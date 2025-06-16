
import { AnalysisService } from './analysisService';
import { RedistributionService } from './redistributionService';
import { AutoLinkingService } from './autoLinkingService';
import { IntegrityService } from './integrityService';
import { AnalysisResult, RedistributionResult, DataIntegrityResult } from './types';

export class VehicleRedistributionService {
  private analysisService = new AnalysisService();
  private redistributionService = new RedistributionService();
  private autoLinkingService = new AutoLinkingService();
  private integrityService = new IntegrityService();

  async analyzeCurrentAssignments(): Promise<AnalysisResult> {
    return this.analysisService.analyzeCurrentAssignments();
  }

  async redistributeVehicles(): Promise<RedistributionResult> {
    return this.redistributionService.redistributeVehicles();
  }

  async autoLinkNewVehicle(deviceId: string, gp51Username?: string): Promise<boolean> {
    return this.autoLinkingService.autoLinkNewVehicle(deviceId, gp51Username);
  }

  async autoLinkNewUser(userId: string, gp51Username?: string): Promise<number> {
    return this.autoLinkingService.autoLinkNewUser(userId, gp51Username);
  }

  async validateGp51DataIntegrity(): Promise<DataIntegrityResult> {
    // Call the IntegrityService method and transform the result to match DataIntegrityResult
    const result = await this.integrityService.validateGp51DataIntegrity();
    const analysis = await this.integrityService.analyzeDataIntegrity();
    
    return {
      isValid: result.isValid,
      errors: result.errors,
      recommendations: result.recommendations,
      totalVehicles: analysis.healthyAssignments + analysis.orphanedVehicles + analysis.invalidUserAssignments + analysis.duplicateAssignments,
      validUsernames: analysis.healthyAssignments,
      invalidUsernames: analysis.invalidUserAssignments,
      emptyUsernames: analysis.orphanedVehicles,
      genericUsernames: analysis.duplicateAssignments
    };
  }
}

export const vehicleRedistributionService = new VehicleRedistributionService();

// Export types for use in other parts of the application
export type { AnalysisResult, RedistributionResult, DataIntegrityResult } from './types';
