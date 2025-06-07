
import { supabase } from '@/integrations/supabase/client';

export interface BackupMetadata {
  id: string;
  name: string;
  description: string;
  backupType: 'full' | 'incremental' | 'selective';
  createdAt: string;
  size: number;
  tables: string[];
  recordCount: number;
  checksumHash: string;
  isVerified: boolean;
  canRollback: boolean;
  expiresAt?: string;
  tags: string[];
}

export interface BackupOptions {
  name?: string;
  description?: string;
  backupType?: 'full' | 'incremental' | 'selective';
  tables?: string[];
  includeSystemTables?: boolean;
  compress?: boolean;
  verify?: boolean;
  retention?: {
    days?: number;
    maxBackups?: number;
  };
  tags?: string[];
}

export interface RollbackOptions {
  targetBackupId: string;
  selectiveTables?: string[];
  dryRun?: boolean;
  preserveNewData?: boolean;
  createRollbackPoint?: boolean;
}

export interface RollbackResult {
  success: boolean;
  backupId: string;
  tablesRestored: string[];
  recordsRestored: number;
  recordsPreserved?: number;
  duration: number;
  rollbackPointCreated?: string;
  error?: string;
  warnings: string[];
}

export interface BackupJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  progress: number;
  currentTable?: string;
  metadata?: BackupMetadata;
  error?: string;
}

export class BackupRollbackManager {
  private static instance: BackupRollbackManager;
  private activeJobs = new Map<string, BackupJob>();
  private readonly CORE_TABLES = ['envio_users', 'vehicles', 'gp51_sessions', 'user_roles'];
  private readonly SYSTEM_TABLES = ['gp51_system_imports', 'gp51_import_previews', 'import_templates'];

  static getInstance(): BackupRollbackManager {
    if (!BackupRollbackManager.instance) {
      BackupRollbackManager.instance = new BackupRollbackManager();
    }
    return BackupRollbackManager.instance;
  }

  async createBackup(options: BackupOptions = {}): Promise<BackupJob> {
    const jobId = this.generateJobId();
    const job: BackupJob = {
      id: jobId,
      status: 'pending',
      startedAt: new Date().toISOString(),
      progress: 0
    };

    this.activeJobs.set(jobId, job);

    // Start backup process asynchronously
    this.executeBackup(job, options).catch(error => {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date().toISOString();
    });

    return job;
  }

  private async executeBackup(job: BackupJob, options: BackupOptions): Promise<void> {
    try {
      job.status = 'running';
      console.log(`Starting backup job ${job.id}`);

      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
      
      // Determine tables to backup
      const tablesToBackup = this.determineTablesToBackup(options);
      job.progress = 10;

      let totalRecords = 0;
      const backupTables: string[] = [];

      // Create backup tables
      for (let i = 0; i < tablesToBackup.length; i++) {
        const table = tablesToBackup[i];
        job.currentTable = table;
        job.progress = 10 + (i / tablesToBackup.length) * 70;

        const backupTableName = `${table}_backup_${timestamp}`;
        
        try {
          // Create backup table
          await this.createBackupTable(table, backupTableName, options.backupType || 'full');
          
          // Count records
          const { count } = await supabase
            .from(backupTableName)
            .select('*', { count: 'exact', head: true });
          
          totalRecords += count || 0;
          backupTables.push(backupTableName);
          
          console.log(`Backed up table ${table} (${count} records) to ${backupTableName}`);
          
        } catch (error) {
          console.error(`Failed to backup table ${table}:`, error);
          throw error;
        }
      }

      // Calculate checksum
      job.progress = 85;
      const checksumHash = await this.calculateBackupChecksum(backupTables);

      // Create backup metadata
      const metadata: BackupMetadata = {
        id: backupId,
        name: options.name || `Backup_${timestamp}`,
        description: options.description || `Automated backup created at ${new Date().toISOString()}`,
        backupType: options.backupType || 'full',
        createdAt: new Date().toISOString(),
        size: await this.calculateBackupSize(backupTables),
        tables: backupTables,
        recordCount: totalRecords,
        checksumHash,
        isVerified: false,
        canRollback: true,
        expiresAt: options.retention?.days ? 
          new Date(Date.now() + options.retention.days * 24 * 60 * 60 * 1000).toISOString() : 
          undefined,
        tags: options.tags || []
      };

      // Verify backup if requested
      if (options.verify !== false) {
        job.progress = 90;
        metadata.isVerified = await this.verifyBackup(metadata);
      }

      // Store backup metadata
      await this.storeBackupMetadata(metadata);

      job.progress = 100;
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.metadata = metadata;

      console.log(`Backup job ${job.id} completed successfully`);

      // Clean up old backups if retention policy is set
      if (options.retention) {
        await this.enforceRetentionPolicy(options.retention);
      }

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date().toISOString();
      console.error(`Backup job ${job.id} failed:`, error);
    }
  }

  private async createBackupTable(sourceTable: string, backupTableName: string, backupType: string): Promise<void> {
    if (backupType === 'full') {
      // Full backup - copy entire table
      await supabase.rpc('create_table_backup', {
        source_table: sourceTable,
        backup_table: backupTableName
      });
    } else if (backupType === 'incremental') {
      // Incremental backup - only changes since last backup
      const lastBackupTime = await this.getLastBackupTime(sourceTable);
      await supabase.rpc('create_incremental_backup', {
        source_table: sourceTable,
        backup_table: backupTableName,
        since_timestamp: lastBackupTime
      });
    }
  }

  async rollbackToBackup(options: RollbackOptions): Promise<RollbackResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      console.log(`Starting rollback to backup ${options.targetBackupId}`);

      // Get backup metadata
      const backup = await this.getBackupMetadata(options.targetBackupId);
      if (!backup) {
        throw new Error(`Backup ${options.targetBackupId} not found`);
      }

      if (!backup.canRollback) {
        throw new Error(`Backup ${options.targetBackupId} cannot be used for rollback`);
      }

      // Verify backup integrity
      if (!backup.isVerified) {
        const isValid = await this.verifyBackup(backup);
        if (!isValid) {
          warnings.push('Backup verification failed, proceeding with caution');
        }
      }

      // Create rollback point if requested
      let rollbackPointId: string | undefined;
      if (options.createRollbackPoint) {
        const rollbackJob = await this.createBackup({
          name: `Pre_Rollback_${Date.now()}`,
          description: `Automatic backup before rollback to ${options.targetBackupId}`,
          backupType: 'full',
          tags: ['pre-rollback', 'automatic']
        });
        rollbackPointId = rollbackJob.id;
      }

      if (options.dryRun) {
        return {
          success: true,
          backupId: options.targetBackupId,
          tablesRestored: backup.tables,
          recordsRestored: backup.recordCount,
          duration: Date.now() - startTime,
          rollbackPointCreated: rollbackPointId,
          warnings: [...warnings, 'DRY RUN - No actual changes made']
        };
      }

      // Determine tables to restore
      const tablesToRestore = options.selectiveTables || 
        this.extractOriginalTableNames(backup.tables);

      let totalRecordsRestored = 0;
      const restoredTables: string[] = [];

      // Restore each table
      for (const originalTable of tablesToRestore) {
        const backupTable = backup.tables.find(bt => bt.includes(originalTable));
        if (!backupTable) {
          warnings.push(`No backup found for table ${originalTable}`);
          continue;
        }

        try {
          if (options.preserveNewData) {
            // Merge strategy - preserve newer records
            await this.mergeTableData(backupTable, originalTable, backup.createdAt);
          } else {
            // Replace strategy - complete restoration
            await this.replaceTableData(backupTable, originalTable);
          }

          const { count } = await supabase
            .from(originalTable)
            .select('*', { count: 'exact', head: true });
          
          totalRecordsRestored += count || 0;
          restoredTables.push(originalTable);

        } catch (error) {
          console.error(`Failed to restore table ${originalTable}:`, error);
          warnings.push(`Failed to restore table ${originalTable}: ${error}`);
        }
      }

      return {
        success: true,
        backupId: options.targetBackupId,
        tablesRestored: restoredTables,
        recordsRestored: totalRecordsRestored,
        duration: Date.now() - startTime,
        rollbackPointCreated: rollbackPointId,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        backupId: options.targetBackupId,
        tablesRestored: [],
        recordsRestored: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings
      };
    }
  }

  private async replaceTableData(backupTable: string, originalTable: string): Promise<void> {
    // Clear original table and restore from backup
    await supabase.rpc('restore_table_from_backup', {
      backup_table: backupTable,
      target_table: originalTable
    });
  }

  private async mergeTableData(backupTable: string, originalTable: string, backupTimestamp: string): Promise<void> {
    // Merge backup data while preserving newer records
    await supabase.rpc('merge_table_from_backup', {
      backup_table: backupTable,
      target_table: originalTable,
      backup_timestamp: backupTimestamp
    });
  }

  // Point-in-time recovery
  async performPointInTimeRecovery(targetTime: string, tables?: string[]): Promise<RollbackResult> {
    const backups = await this.listBackups();
    
    // Find the best backup for point-in-time recovery
    const suitableBackup = backups
      .filter(b => b.createdAt <= targetTime && b.canRollback)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!suitableBackup) {
      throw new Error(`No suitable backup found for point-in-time recovery to ${targetTime}`);
    }

    console.log(`Using backup ${suitableBackup.id} for point-in-time recovery`);

    return this.rollbackToBackup({
      targetBackupId: suitableBackup.id,
      selectiveTables: tables,
      createRollbackPoint: true,
      preserveNewData: false
    });
  }

  // Backup management
  async listBackups(filters?: {
    backupType?: string;
    tags?: string[];
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<BackupMetadata[]> {
    let query = supabase
      .from('backup_metadata')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.backupType) {
      query = query.eq('backup_type', filters.backupType);
    }

    if (filters?.createdAfter) {
      query = query.gte('created_at', filters.createdAfter);
    }

    if (filters?.createdBefore) {
      query = query.lte('created_at', filters.createdBefore);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  async deleteBackup(backupId: string): Promise<void> {
    const backup = await this.getBackupMetadata(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    // Delete backup tables
    for (const table of backup.tables) {
      try {
        await supabase.rpc('drop_table_if_exists', { table_name: table });
      } catch (error) {
        console.error(`Failed to drop backup table ${table}:`, error);
      }
    }

    // Delete metadata
    await supabase
      .from('backup_metadata')
      .delete()
      .eq('id', backupId);

    console.log(`Deleted backup ${backupId}`);
  }

  private async enforceRetentionPolicy(retention: { days?: number; maxBackups?: number }): Promise<void> {
    const backups = await this.listBackups();

    // Delete expired backups
    if (retention.days) {
      const cutoffDate = new Date(Date.now() - retention.days * 24 * 60 * 60 * 1000);
      const expiredBackups = backups.filter(b => new Date(b.createdAt) < cutoffDate);
      
      for (const backup of expiredBackups) {
        await this.deleteBackup(backup.id);
      }
    }

    // Delete excess backups
    if (retention.maxBackups && backups.length > retention.maxBackups) {
      const excessBackups = backups.slice(retention.maxBackups);
      
      for (const backup of excessBackups) {
        await this.deleteBackup(backup.id);
      }
    }
  }

  // Utility methods
  private determineTablesToBackup(options: BackupOptions): string[] {
    if (options.tables) {
      return options.tables;
    }

    let tables = [...this.CORE_TABLES];
    
    if (options.includeSystemTables) {
      tables.push(...this.SYSTEM_TABLES);
    }

    return tables;
  }

  private extractOriginalTableNames(backupTables: string[]): string[] {
    return backupTables.map(bt => {
      const parts = bt.split('_backup_');
      return parts[0];
    });
  }

  private async calculateBackupChecksum(tables: string[]): Promise<string> {
    // Calculate a simple checksum based on table names and row counts
    const checksumData = [];
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      checksumData.push(`${table}:${count}`);
    }

    return btoa(checksumData.join('|'));
  }

  private async calculateBackupSize(tables: string[]): Promise<number> {
    // Estimate backup size (simplified calculation)
    let totalSize = 0;
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      // Rough estimate: 500 bytes per record
      totalSize += (count || 0) * 500;
    }

    return totalSize;
  }

  private async verifyBackup(backup: BackupMetadata): Promise<boolean> {
    try {
      // Verify tables exist and have expected record counts
      for (const table of backup.tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(`Backup verification failed for table ${table}:`, error);
          return false;
        }
      }

      // Verify checksum
      const currentChecksum = await this.calculateBackupChecksum(backup.tables);
      return currentChecksum === backup.checksumHash;

    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    const { data, error } = await supabase
      .from('backup_metadata')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error) return null;
    return data;
  }

  private async storeBackupMetadata(metadata: BackupMetadata): Promise<void> {
    await supabase
      .from('backup_metadata')
      .insert(metadata);
  }

  private async getLastBackupTime(table: string): Promise<string> {
    const { data } = await supabase
      .from('backup_metadata')
      .select('created_at')
      .contains('tables', [table])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.created_at || new Date(0).toISOString();
  }

  private generateJobId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBackupId(): string {
    return `bkp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public interface methods
  getActiveJobs(): BackupJob[] {
    return Array.from(this.activeJobs.values());
  }

  getJobStatus(jobId: string): BackupJob | undefined {
    return this.activeJobs.get(jobId);
  }

  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: string;
    newestBackup?: string;
  }> {
    const backups = await this.listBackups();
    
    return {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : undefined,
      newestBackup: backups.length > 0 ? backups[0].createdAt : undefined
    };
  }
}

export const backupRollbackManager = BackupRollbackManager.getInstance();
