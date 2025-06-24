
import { supabase } from '@/integrations/supabase/client';
import { enhancedGP51SessionManager } from '@/services/security/enhancedGP51SessionManager';

export interface SyncConflict {
  id: string;
  entityType: 'user' | 'vehicle';
  entityId: string;
  conflictType: 'duplicate' | 'mismatch' | 'outdated';
  localData: any;
  remoteData: any;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high';
  autoResolvable: boolean;
}

export interface SyncOperation {
  id: string;
  type: 'user_sync' | 'vehicle_sync' | 'full_sync';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  conflicts: SyncConflict[];
  errorMessage?: string;
}

export interface DataIntegrityReport {
  timestamp: Date;
  totalRecords: number;
  corruptedRecords: number;
  missingRelations: number;
  duplicateRecords: number;
  inconsistentData: number;
  issues: DataIntegrityIssue[];
  score: number; // 0-100
}

export interface DataIntegrityIssue {
  id: string;
  type: 'corruption' | 'missing_relation' | 'duplicate' | 'inconsistent';
  table: string;
  recordId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
  recommendedAction: string;
}

export interface SyncConfiguration {
  autoSync: boolean;
  syncInterval: number; // minutes
  conflictResolution: 'manual' | 'prefer_remote' | 'prefer_local' | 'newest_wins';
  batchSize: number;
  enableRealTime: boolean;
  maxRetries: number;
  backoffMultiplier: number;
}

export class GP51DataSyncManager {
  private static instance: GP51DataSyncManager;
  private syncOperations: Map<string, SyncOperation> = new Map();
  private subscribers: Set<(operation: SyncOperation) => void> = new Set();
  private isRunning = false;
  
  private constructor() {}

  static getInstance(): GP51DataSyncManager {
    if (!GP51DataSyncManager.instance) {
      GP51DataSyncManager.instance = new GP51DataSyncManager();
    }
    return GP51DataSyncManager.instance;
  }

  async startFullSync(configuration?: Partial<SyncConfiguration>): Promise<string> {
    try {
      console.log('🔄 Starting full data synchronization...');

      const session = enhancedGP51SessionManager.getCurrentSession();
      if (!session) {
        throw new Error('No active GP51 session');
      }

      const operationId = crypto.randomUUID();
      const operation: SyncOperation = {
        id: operationId,
        type: 'full_sync',
        status: 'pending',
        startedAt: new Date(),
        progress: 0,
        totalItems: 0,
        processedItems: 0,
        failedItems: 0,
        conflicts: []
      };

      this.syncOperations.set(operationId, operation);
      this.notifySubscribers(operation);

      // Start sync process asynchronously
      this.executeFullSync(operationId, configuration).catch(error => {
        console.error('Full sync failed:', error);
        this.updateOperationStatus(operationId, 'failed', error.message);
      });

      return operationId;
    } catch (error) {
      console.error('Failed to start full sync:', error);
      throw error;
    }
  }

  private async executeFullSync(operationId: string, config?: Partial<SyncConfiguration>): Promise<void> {
    const operation = this.syncOperations.get(operationId);
    if (!operation) return;

    try {
      this.updateOperationStatus(operationId, 'running');

      // Phase 1: Sync users
      await this.syncUsers(operationId);
      
      // Phase 2: Sync vehicles
      await this.syncVehicles(operationId);
      
      // Phase 3: Validate data integrity
      await this.validateDataIntegrity(operationId);

      this.updateOperationStatus(operationId, 'completed');
      console.log('✅ Full sync completed successfully');
    } catch (error) {
      console.error('Full sync execution failed:', error);
      this.updateOperationStatus(operationId, 'failed', error.message);
    }
  }

  private async syncUsers(operationId: string): Promise<void> {
    console.log('👥 Syncing users...');
    
    try {
      // Call GP51 API to get users
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'fetch_users',
          sync_operation_id: operationId
        }
      });

      if (error) throw error;

      const operation = this.syncOperations.get(operationId);
      if (!operation) return;

      operation.totalItems += data.users?.length || 0;
      operation.progress = 25;
      this.notifySubscribers(operation);

      // Process users in batches
      if (data.users) {
        for (const user of data.users) {
          await this.processUserSync(user, operationId);
          operation.processedItems++;
          this.notifySubscribers(operation);
        }
      }

      console.log('✅ User sync completed');
    } catch (error) {
      console.error('User sync failed:', error);
      throw error;
    }
  }

  private async syncVehicles(operationId: string): Promise<void> {
    console.log('🚗 Syncing vehicles...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'fetch_vehicles',
          sync_operation_id: operationId
        }
      });

      if (error) throw error;

      const operation = this.syncOperations.get(operationId);
      if (!operation) return;

      operation.totalItems += data.vehicles?.length || 0;
      operation.progress = 50;
      this.notifySubscribers(operation);

      if (data.vehicles) {
        for (const vehicle of data.vehicles) {
          await this.processVehicleSync(vehicle, operationId);
          operation.processedItems++;
          this.notifySubscribers(operation);
        }
      }

      operation.progress = 75;
      this.notifySubscribers(operation);
      console.log('✅ Vehicle sync completed');
    } catch (error) {
      console.error('Vehicle sync failed:', error);
      throw error;
    }
  }

  private async processUserSync(userData: any, operationId: string): Promise<void> {
    try {
      // Check for existing user
      const { data: existingUser } = await supabase
        .from('envio_users')
        .select('*')
        .eq('gp51_username', userData.username)
        .maybeSingle();

      if (existingUser) {
        // Check for conflicts
        const conflicts = this.detectUserConflicts(existingUser, userData);
        if (conflicts.length > 0) {
          const operation = this.syncOperations.get(operationId);
          if (operation) {
            operation.conflicts.push(...conflicts);
          }
        }
      } else {
        // Create new user
        await this.createUserFromGP51(userData);
      }
    } catch (error) {
      console.error('User sync processing failed:', error);
      const operation = this.syncOperations.get(operationId);
      if (operation) {
        operation.failedItems++;
      }
    }
  }

  private async processVehicleSync(vehicleData: any, operationId: string): Promise<void> {
    try {
      const { data: existingVehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('gp51_device_id', vehicleData.device_id)
        .maybeSingle();

      if (existingVehicle) {
        const conflicts = this.detectVehicleConflicts(existingVehicle, vehicleData);
        if (conflicts.length > 0) {
          const operation = this.syncOperations.get(operationId);
          if (operation) {
            operation.conflicts.push(...conflicts);
          }
        }
      } else {
        await this.createVehicleFromGP51(vehicleData);
      }
    } catch (error) {
      console.error('Vehicle sync processing failed:', error);
      const operation = this.syncOperations.get(operationId);
      if (operation) {
        operation.failedItems++;
      }
    }
  }

  private detectUserConflicts(localUser: any, remoteUser: any): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    if (localUser.email !== remoteUser.email) {
      conflicts.push({
        id: crypto.randomUUID(),
        entityType: 'user',
        entityId: localUser.id,
        conflictType: 'mismatch',
        localData: { email: localUser.email },
        remoteData: { email: remoteUser.email },
        detectedAt: new Date(),
        severity: 'medium',
        autoResolvable: false
      });
    }

    return conflicts;
  }

  private detectVehicleConflicts(localVehicle: any, remoteVehicle: any): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    if (localVehicle.name !== remoteVehicle.name) {
      conflicts.push({
        id: crypto.randomUUID(),
        entityType: 'vehicle',
        entityId: localVehicle.id,
        conflictType: 'mismatch',
        localData: { name: localVehicle.name },
        remoteData: { name: remoteVehicle.name },
        detectedAt: new Date(),
        severity: 'low',
        autoResolvable: true
      });
    }

    return conflicts;
  }

  private async createUserFromGP51(userData: any): Promise<void> {
    await supabase
      .from('envio_users')
      .insert({
        name: userData.name || userData.username,
        email: userData.email,
        gp51_username: userData.username,
        gp51_user_type: userData.user_type || 3,
        registration_type: 'gp51_sync',
        import_source: 'gp51_sync'
      });
  }

  private async createVehicleFromGP51(vehicleData: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('vehicles')
      .insert({
        gp51_device_id: vehicleData.device_id,
        name: vehicleData.name || vehicleData.device_id,
        user_id: user?.id,
        sim_number: vehicleData.sim_number
      });
  }

  private async validateDataIntegrity(operationId: string): Promise<void> {
    console.log('🔍 Validating data integrity...');
    
    const operation = this.syncOperations.get(operationId);
    if (!operation) return;

    operation.progress = 90;
    this.notifySubscribers(operation);

    // Perform integrity checks
    await this.checkForDuplicates();
    await this.checkRelationalIntegrity();
    
    operation.progress = 100;
    this.notifySubscribers(operation);
  }

  private async checkForDuplicates(): Promise<void> {
    // Check for duplicate users
    const { data: duplicateUsers } = await supabase
      .from('envio_users')
      .select('gp51_username, count(*)')
      .not('gp51_username', 'is', null)
      .group('gp51_username')
      .having('count(*)', 'gt', 1);

    if (duplicateUsers && duplicateUsers.length > 0) {
      console.warn('Found duplicate users:', duplicateUsers);
    }

    // Check for duplicate vehicles
    const { data: duplicateVehicles } = await supabase
      .from('vehicles')
      .select('gp51_device_id, count(*)')
      .not('gp51_device_id', 'is', null)
      .group('gp51_device_id')
      .having('count(*)', 'gt', 1);

    if (duplicateVehicles && duplicateVehicles.length > 0) {
      console.warn('Found duplicate vehicles:', duplicateVehicles);
    }
  }

  private async checkRelationalIntegrity(): Promise<void> {
    // Check for vehicles without valid users
    const { data: orphanedVehicles } = await supabase
      .from('vehicles')
      .select('id, gp51_device_id, user_id')
      .not('user_id', 'is', null)
      .not('user_id', 'in', 
        supabase.from('envio_users').select('id')
      );

    if (orphanedVehicles && orphanedVehicles.length > 0) {
      console.warn('Found orphaned vehicles:', orphanedVehicles);
    }
  }

  async pauseSync(operationId: string): Promise<void> {
    this.updateOperationStatus(operationId, 'paused');
  }

  async resumeSync(operationId: string): Promise<void> {
    this.updateOperationStatus(operationId, 'running');
  }

  async cancelSync(operationId: string): Promise<void> {
    this.updateOperationStatus(operationId, 'failed', 'Cancelled by user');
    this.syncOperations.delete(operationId);
  }

  async resolveConflict(conflictId: string, resolution: 'prefer_local' | 'prefer_remote' | 'merge'): Promise<void> {
    // Implementation for resolving specific conflicts
    console.log(`Resolving conflict ${conflictId} with resolution: ${resolution}`);
  }

  async generateIntegrityReport(): Promise<DataIntegrityReport> {
    const report: DataIntegrityReport = {
      timestamp: new Date(),
      totalRecords: 0,
      corruptedRecords: 0,
      missingRelations: 0,
      duplicateRecords: 0,
      inconsistentData: 0,
      issues: [],
      score: 100
    };

    // Calculate integrity metrics
    // This would involve checking data consistency, relationships, etc.
    
    return report;
  }

  private updateOperationStatus(operationId: string, status: SyncOperation['status'], errorMessage?: string): void {
    const operation = this.syncOperations.get(operationId);
    if (!operation) return;

    operation.status = status;
    if (status === 'completed' || status === 'failed') {
      operation.completedAt = new Date();
    }
    if (errorMessage) {
      operation.errorMessage = errorMessage;
    }

    this.notifySubscribers(operation);
  }

  subscribe(callback: (operation: SyncOperation) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(operation: SyncOperation): void {
    this.subscribers.forEach(callback => {
      try {
        callback(operation);
      } catch (error) {
        console.error('Sync subscriber error:', error);
      }
    });
  }

  getSyncOperation(operationId: string): SyncOperation | undefined {
    return this.syncOperations.get(operationId);
  }

  getAllSyncOperations(): SyncOperation[] {
    return Array.from(this.syncOperations.values());
  }
}

export const gp51DataSyncManager = GP51DataSyncManager.getInstance();
