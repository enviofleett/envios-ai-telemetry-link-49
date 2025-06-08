
export interface ReconciliationRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'merge' | 'replace' | 'validate' | 'transform';
  priority: number;
  conditions: ReconciliationCondition[];
  actions: ReconciliationAction[];
  isActive: boolean;
}

export interface ReconciliationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'missing' | 'duplicate';
  value?: any;
  tolerance?: number;
}

export interface ReconciliationAction {
  type: 'update' | 'delete' | 'merge' | 'flag' | 'notify';
  targetField?: string;
  newValue?: any;
  mergeStrategy?: 'latest' | 'oldest' | 'manual' | 'priority';
}

export interface ReconciliationJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startedAt?: Date;
  completedAt?: Date;
  rulesApplied: string[];
  itemsProcessed: number;
  itemsResolved: number;
  itemsFlagged: number;
  results: ReconciliationResult[];
  errorLog: string[];
}

export interface ReconciliationResult {
  itemId: string;
  itemType: string;
  ruleApplied: string;
  action: string;
  beforeValue: any;
  afterValue: any;
  confidence: number;
  requiresManualReview: boolean;
}

export class DataReconciliationService {
  private static instance: DataReconciliationService;
  private reconciliationRules: ReconciliationRule[] = [];
  private activeJobs: Map<string, ReconciliationJob> = new Map();

  static getInstance(): DataReconciliationService {
    if (!DataReconciliationService.instance) {
      DataReconciliationService.instance = new DataReconciliationService();
      DataReconciliationService.instance.initializeRules();
    }
    return DataReconciliationService.instance;
  }

  private initializeRules(): void {
    this.reconciliationRules = [
      {
        id: 'merge_duplicate_users',
        name: 'Merge Duplicate Users',
        description: 'Automatically merge users with identical email addresses',
        ruleType: 'merge',
        priority: 1,
        conditions: [
          { field: 'email', operator: 'duplicate' }
        ],
        actions: [
          { type: 'merge', mergeStrategy: 'latest' }
        ],
        isActive: true
      },
      {
        id: 'fix_vehicle_assignments',
        name: 'Fix Vehicle Assignments',
        description: 'Resolve orphaned vehicle assignments',
        ruleType: 'validate',
        priority: 2,
        conditions: [
          { field: 'envio_user_id', operator: 'missing' }
        ],
        actions: [
          { type: 'flag' },
          { type: 'notify' }
        ],
        isActive: true
      },
      {
        id: 'update_expired_sessions',
        name: 'Clean Expired Sessions',
        description: 'Remove or update expired GP51 sessions',
        ruleType: 'replace',
        priority: 3,
        conditions: [
          { field: 'token_expires_at', operator: 'equals', value: 'past' }
        ],
        actions: [
          { type: 'delete' }
        ],
        isActive: true
      },
      {
        id: 'normalize_device_names',
        name: 'Normalize Device Names',
        description: 'Standardize device naming conventions',
        ruleType: 'transform',
        priority: 4,
        conditions: [
          { field: 'device_name', operator: 'contains', value: 'irregular_pattern' }
        ],
        actions: [
          { type: 'update', targetField: 'device_name' }
        ],
        isActive: false
      }
    ];
  }

  async performAutomaticReconciliation(): Promise<ReconciliationJob> {
    const jobId = `auto_reconciliation_${Date.now()}`;
    const job: ReconciliationJob = {
      id: jobId,
      name: 'Automatic Data Reconciliation',
      status: 'running',
      startedAt: new Date(),
      rulesApplied: [],
      itemsProcessed: 0,
      itemsResolved: 0,
      itemsFlagged: 0,
      results: [],
      errorLog: []
    };

    this.activeJobs.set(jobId, job);

    try {
      console.log('Starting automatic data reconciliation...');

      const activeRules = this.reconciliationRules
        .filter(rule => rule.isActive)
        .sort((a, b) => a.priority - b.priority);

      for (const rule of activeRules) {
        await this.applyReconciliationRule(job, rule);
        job.rulesApplied.push(rule.id);
      }

      job.status = 'completed';
      job.completedAt = new Date();

      console.log(`Reconciliation completed. Processed: ${job.itemsProcessed}, Resolved: ${job.itemsResolved}, Flagged: ${job.itemsFlagged}`);

    } catch (error) {
      job.status = 'failed';
      job.errorLog.push(`Reconciliation failed: ${error.message}`);
      console.error('Reconciliation failed:', error);
    }

    return job;
  }

  async performManualReconciliation(ruleIds: string[]): Promise<ReconciliationJob> {
    const jobId = `manual_reconciliation_${Date.now()}`;
    const job: ReconciliationJob = {
      id: jobId,
      name: 'Manual Data Reconciliation',
      status: 'running',
      startedAt: new Date(),
      rulesApplied: [],
      itemsProcessed: 0,
      itemsResolved: 0,
      itemsFlagged: 0,
      results: [],
      errorLog: []
    };

    this.activeJobs.set(jobId, job);

    try {
      const rulesToApply = this.reconciliationRules.filter(rule => ruleIds.includes(rule.id));

      for (const rule of rulesToApply) {
        await this.applyReconciliationRule(job, rule);
        job.rulesApplied.push(rule.id);
      }

      job.status = 'completed';
      job.completedAt = new Date();

    } catch (error) {
      job.status = 'failed';
      job.errorLog.push(`Manual reconciliation failed: ${error.message}`);
    }

    return job;
  }

  private async applyReconciliationRule(job: ReconciliationJob, rule: ReconciliationRule): Promise<void> {
    console.log(`Applying reconciliation rule: ${rule.name}`);

    // Mock implementation - in production this would interact with the database
    const mockItems = this.generateMockItemsForRule(rule);

    for (const item of mockItems) {
      try {
        const meetsConditions = this.evaluateConditions(item, rule.conditions);
        
        if (meetsConditions) {
          const result = await this.executeActions(item, rule.actions, rule);
          job.results.push(result);
          job.itemsProcessed++;

          if (result.requiresManualReview) {
            job.itemsFlagged++;
          } else {
            job.itemsResolved++;
          }
        }
      } catch (error) {
        job.errorLog.push(`Failed to process item ${item.id} with rule ${rule.id}: ${error.message}`);
      }
    }
  }

  private generateMockItemsForRule(rule: ReconciliationRule): any[] {
    // Mock data generation based on rule type
    const mockData = {
      merge_duplicate_users: [
        { id: 'user1', email: 'test@example.com', name: 'John Doe' },
        { id: 'user2', email: 'test@example.com', name: 'John Smith' }
      ],
      fix_vehicle_assignments: [
        { id: 'vehicle1', device_id: 'DEV001', envio_user_id: null }
      ],
      update_expired_sessions: [
        { id: 'session1', token_expires_at: '2024-01-01T00:00:00Z' }
      ],
      normalize_device_names: [
        { id: 'device1', device_name: 'GPS-TRACKER-001!!!' }
      ]
    };

    return mockData[rule.id as keyof typeof mockData] || [];
  }

  private evaluateConditions(item: any, conditions: ReconciliationCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = item[condition.field];

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(condition.value);
        case 'missing':
          return fieldValue == null || fieldValue === '';
        case 'duplicate':
          // In real implementation, this would check for duplicates in the database
          return true;
        default:
          return false;
      }
    });
  }

  private async executeActions(item: any, actions: ReconciliationAction[], rule: ReconciliationRule): Promise<ReconciliationResult> {
    let requiresManualReview = false;
    let actionExecuted = 'none';
    let afterValue = item;

    for (const action of actions) {
      switch (action.type) {
        case 'update':
          actionExecuted = 'update';
          if (action.targetField && action.newValue) {
            afterValue = { ...afterValue, [action.targetField]: action.newValue };
          }
          break;
        case 'delete':
          actionExecuted = 'delete';
          afterValue = null;
          break;
        case 'merge':
          actionExecuted = 'merge';
          requiresManualReview = action.mergeStrategy === 'manual';
          break;
        case 'flag':
          requiresManualReview = true;
          actionExecuted = 'flag';
          break;
        case 'notify':
          actionExecuted = 'notify';
          console.log(`Notification: Item ${item.id} requires attention`);
          break;
      }
    }

    return {
      itemId: item.id,
      itemType: rule.ruleType,
      ruleApplied: rule.id,
      action: actionExecuted,
      beforeValue: item,
      afterValue,
      confidence: requiresManualReview ? 0.5 : 0.95,
      requiresManualReview
    };
  }

  getActiveJobs(): ReconciliationJob[] {
    return Array.from(this.activeJobs.values());
  }

  getJobById(jobId: string): ReconciliationJob | undefined {
    return this.activeJobs.get(jobId);
  }

  getAvailableRules(): ReconciliationRule[] {
    return [...this.reconciliationRules];
  }

  async pauseJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'running') {
      job.status = 'paused';
      return true;
    }
    return false;
  }

  async resumeJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'paused') {
      job.status = 'running';
      return true;
    }
    return false;
  }
}

export const dataReconciliationService = DataReconciliationService.getInstance();
