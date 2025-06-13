
import { EmailCampaign, CampaignExecution } from './types';
import { CampaignOperations } from './campaignOperations';
import { ExecutionManager } from './executionManager';

class ScheduledCampaignsService {
  private campaignOps = new CampaignOperations();
  private executionManager = new ExecutionManager();

  // Campaign management methods
  async createCampaign(campaignData: Partial<EmailCampaign>): Promise<EmailCampaign> {
    return this.campaignOps.createCampaign(campaignData);
  }

  async getCampaigns(): Promise<EmailCampaign[]> {
    return this.campaignOps.getCampaigns();
  }

  async updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    return this.campaignOps.updateCampaign(id, updates);
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    return this.campaignOps.pauseCampaign(campaignId);
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    return this.campaignOps.resumeCampaign(campaignId);
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    return this.campaignOps.deleteCampaign(campaignId);
  }

  // Execution methods
  async executeCampaign(campaignId: string): Promise<CampaignExecution> {
    return this.executionManager.executeCampaign(campaignId);
  }
}

export const scheduledCampaignsService = new ScheduledCampaignsService();

// Export types for external use
export { EmailCampaign, CampaignExecution } from './types';
