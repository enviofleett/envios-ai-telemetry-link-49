
import { UserImportResult } from './types.ts';

export interface ParallelProcessingConfig {
  maxConcurrency: number;
  batchSize: number;
  delayBetweenBatches: number;
  enableAdaptiveThrottling: boolean;
}

export interface ProcessingBatch {
  usernames: string[];
  batchNumber: number;
  totalBatches: number;
  startTime: number;
}

export class ParallelProcessor {
  private config: ParallelProcessingConfig;
  private activeWorkers: Set<string> = new Set();
  private completedBatches: number = 0;
  private totalBatches: number = 0;

  constructor(config: ParallelProcessingConfig) {
    this.config = config;
  }

  async processUsersInParallel<T>(
    usernames: string[],
    processingFunction: (username: string, context: any) => Promise<T>,
    context: any,
    progressCallback?: (progress: { completed: number; total: number; currentBatch: number }) => void
  ): Promise<T[]> {
    console.log(`Starting parallel processing of ${usernames.length} users with max concurrency: ${this.config.maxConcurrency}`);

    const batches = this.createBatches(usernames);
    this.totalBatches = batches.length;
    const results: T[] = [];
    
    console.log(`Created ${batches.length} batches with batch size: ${this.config.batchSize}`);

    for (let i = 0; i < batches.length; i += this.config.maxConcurrency) {
      const concurrentBatches = batches.slice(i, i + this.config.maxConcurrency);
      
      console.log(`Processing batch group ${Math.floor(i / this.config.maxConcurrency) + 1} with ${concurrentBatches.length} concurrent batches`);

      const batchPromises = concurrentBatches.map(async (batch, batchIndex) => {
        const workerId = `worker-${i + batchIndex}`;
        this.activeWorkers.add(workerId);
        
        try {
          const batchResults = await this.processBatch(batch, processingFunction, context, workerId);
          
          this.completedBatches++;
          progressCallback?.({
            completed: this.completedBatches,
            total: this.totalBatches,
            currentBatch: this.completedBatches
          });
          
          return batchResults;
        } finally {
          this.activeWorkers.delete(workerId);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());

      // Adaptive delay between batch groups
      if (i + this.config.maxConcurrency < batches.length) {
        const delay = this.config.enableAdaptiveThrottling 
          ? this.calculateAdaptiveDelay() 
          : this.config.delayBetweenBatches;
        
        console.log(`Waiting ${delay}ms before processing next batch group...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`Parallel processing completed. Processed ${results.length} items across ${this.totalBatches} batches`);
    return results;
  }

  private createBatches(usernames: string[]): ProcessingBatch[] {
    const batches: ProcessingBatch[] = [];
    const totalBatches = Math.ceil(usernames.length / this.config.batchSize);
    
    for (let i = 0; i < usernames.length; i += this.config.batchSize) {
      const batchUsernames = usernames.slice(i, i + this.config.batchSize);
      batches.push({
        usernames: batchUsernames,
        batchNumber: Math.floor(i / this.config.batchSize) + 1,
        totalBatches,
        startTime: Date.now()
      });
    }
    
    return batches;
  }

  private async processBatch<T>(
    batch: ProcessingBatch,
    processingFunction: (username: string, context: any) => Promise<T>,
    context: any,
    workerId: string
  ): Promise<T[]> {
    console.log(`${workerId}: Processing batch ${batch.batchNumber}/${batch.totalBatches} with ${batch.usernames.length} users`);
    
    const results: T[] = [];
    
    for (const username of batch.usernames) {
      try {
        const result = await processingFunction(username, context);
        results.push(result);
      } catch (error) {
        console.error(`${workerId}: Failed to process user ${username}:`, error);
        // Continue processing other users in the batch
      }
    }
    
    const duration = Date.now() - batch.startTime;
    console.log(`${workerId}: Completed batch ${batch.batchNumber} in ${duration}ms`);
    
    return results;
  }

  private calculateAdaptiveDelay(): number {
    // Implement adaptive delay based on current performance
    const baseDelay = this.config.delayBetweenBatches;
    const activeWorkerCount = this.activeWorkers.size;
    
    // Increase delay if many workers are active (system under load)
    const loadFactor = activeWorkerCount / this.config.maxConcurrency;
    const adaptiveDelay = baseDelay * (1 + loadFactor);
    
    return Math.min(adaptiveDelay, baseDelay * 3); // Cap at 3x base delay
  }

  getStats() {
    return {
      activeWorkers: this.activeWorkers.size,
      completedBatches: this.completedBatches,
      totalBatches: this.totalBatches,
      progress: this.totalBatches > 0 ? (this.completedBatches / this.totalBatches) * 100 : 0
    };
  }
}

export function createOptimalProcessingConfig(
  totalUsers: number,
  estimatedVehiclesPerUser: number = 5
): ParallelProcessingConfig {
  // Calculate optimal parameters based on workload
  const totalVehicles = totalUsers * estimatedVehiclesPerUser;
  
  let maxConcurrency: number;
  let batchSize: number;
  
  if (totalUsers <= 10) {
    maxConcurrency = 2;
    batchSize = 1;
  } else if (totalUsers <= 50) {
    maxConcurrency = 3;
    batchSize = 2;
  } else if (totalUsers <= 200) {
    maxConcurrency = 4;
    batchSize = 3;
  } else {
    maxConcurrency = 5;
    batchSize = 5;
  }
  
  const delayBetweenBatches = totalVehicles > 1000 ? 3000 : 2000;
  
  return {
    maxConcurrency,
    batchSize,
    delayBetweenBatches,
    enableAdaptiveThrottling: totalUsers > 100
  };
}
