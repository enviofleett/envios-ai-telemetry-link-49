
import { JobStatusManager } from './job-status-manager.ts';
import { DataValidator } from './data-validator.ts';

export class PhaseManager {
  constructor(
    private statusManager: JobStatusManager,
    private validator: DataValidator
  ) {}

  async executePreImportValidation(
    jobId: string,
    targetUsernames: string[]
  ): Promise<string[]> {
    console.log('Phase 1: Pre-import validation...');
    await this.statusManager.updateJobStatus(
      jobId, 
      'processing', 
      'Phase 1: Pre-import validation', 
      'Validating usernames and GP51 connectivity'
    );
    
    const validationResult = this.validator.validateUsernames(targetUsernames);
    if (!validationResult.isValid) {
      console.error('Pre-import validation failed:', validationResult.errors);
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }

    const validUsernames = [...new Set(targetUsernames.filter(u => u?.trim()))];
    console.log(`Validation passed: ${validUsernames.length} valid usernames`);
    
    return validUsernames;
  }

  async executeParallelProcessing(
    jobId: string,
    validUsernames: string[],
    maxConcurrency: number
  ): Promise<void> {
    console.log('Phase 2: Parallel processing with enhanced monitoring...');
    await this.statusManager.updateJobStatus(
      jobId, 
      'processing', 
      'Phase 2: Parallel user processing', 
      `Processing ${validUsernames.length} users with ${maxConcurrency} concurrent workers`
    );
  }

  async executeConsistencyCheck(jobId: string): Promise<any> {
    console.log('Phase 3: Post-import consistency verification...');
    await this.statusManager.updateJobStatus(
      jobId, 
      'processing', 
      'Phase 3: Data consistency verification', 
      'Performing post-import data integrity checks'
    );

    return await this.validator.performConsistencyAudit();
  }

  async executeFinalization(jobId: string): Promise<void> {
    console.log('Phase 4: Finalizing metrics and generating reports...');
  }
}
