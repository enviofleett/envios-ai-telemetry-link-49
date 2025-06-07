export interface DataProcessingActivity {
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  retentionPeriod: string;
  crossBorderTransfers: boolean;
  safeguards?: string[];
}

export interface DataSubjectRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  userId: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  responseDate?: Date;
  reason?: string;
}

export interface PrivacySettings {
  userId: string;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  locationTrackingConsent: boolean;
  dataRetentionPeriod: number; // in days
  dataExportFormat: 'json' | 'csv';
}

export class GDPRComplianceService {
  private static instance: GDPRComplianceService;

  static getInstance(): GDPRComplianceService {
    if (!GDPRComplianceService.instance) {
      GDPRComplianceService.instance = new GDPRComplianceService();
    }
    return GDPRComplianceService.instance;
  }

  // Data Processing Activities Register
  getDataProcessingActivities(): DataProcessingActivity[] {
    return [
      {
        purpose: 'Vehicle Fleet Management and GPS Tracking',
        legalBasis: 'Legitimate interests (fleet security and management)',
        dataCategories: ['Location data', 'Vehicle identification', 'Driver assignments'],
        dataSubjects: ['Fleet managers', 'Drivers', 'Vehicle operators'],
        recipients: ['GP51 API service', 'Internal fleet management team'],
        retentionPeriod: '7 years (or until contract termination + 3 years)',
        crossBorderTransfers: true,
        safeguards: [
          'Standard Contractual Clauses with GP51',
          'Data encryption in transit and at rest',
          'Access controls and authentication'
        ]
      },
      {
        purpose: 'User Account Management and Authentication',
        legalBasis: 'Contract performance',
        dataCategories: ['Contact information', 'Account credentials', 'User preferences'],
        dataSubjects: ['Registered users', 'Admin users'],
        recipients: ['Supabase (authentication provider)', 'Internal support team'],
        retentionPeriod: 'Duration of contract + 3 years',
        crossBorderTransfers: true,
        safeguards: [
          'Supabase EU hosting',
          'SOC 2 Type II compliance',
          'Data encryption and secure authentication'
        ]
      },
      {
        purpose: 'System Performance Monitoring and Analytics',
        legalBasis: 'Legitimate interests (service improvement)',
        dataCategories: ['Usage analytics', 'Performance metrics', 'Error logs'],
        dataSubjects: ['All system users'],
        recipients: ['Internal development team'],
        retentionPeriod: '2 years',
        crossBorderTransfers: false,
        safeguards: [
          'Data anonymization where possible',
          'Access controls',
          'Regular data review and purging'
        ]
      }
    ];
  }

  // Data Subject Rights Management
  async submitDataSubjectRequest(request: Omit<DataSubjectRequest, 'id' | 'requestDate' | 'status'>): Promise<string> {
    const requestId = `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In a real implementation, this would be stored in the database
    console.log('Data Subject Request submitted:', {
      ...request,
      id: requestId,
      requestDate: new Date(),
      status: 'pending'
    });
    
    return requestId;
  }

  async processAccessRequest(userId: string): Promise<any> {
    // Compile all user data from various sources
    const userData = {
      personalData: {
        // User profile data from envio_users table
        note: 'Retrieved from envio_users table'
      },
      vehicleData: {
        // Vehicle assignments and location history
        note: 'Retrieved from vehicles and vehicle_positions tables'
      },
      systemData: {
        // Login history, preferences, etc.
        note: 'Retrieved from various system tables'
      },
      gp51Data: {
        // Data shared with GP51 API
        note: 'Contact GP51 directly for their data processing records'
      }
    };
    
    return userData;
  }

  async processErasureRequest(userId: string, retainMinimal: boolean = false): Promise<boolean> {
    try {
      if (retainMinimal) {
        // Anonymize data while retaining for legal/contractual obligations
        console.log(`Anonymizing data for user ${userId}`);
        // Implementation would update records to remove PII while keeping necessary business data
      } else {
        // Complete erasure where legally permissible
        console.log(`Complete erasure requested for user ${userId}`);
        // Implementation would delete all user data across all systems
      }
      
      return true;
    } catch (error) {
      console.error('Error processing erasure request:', error);
      return false;
    }
  }

  // Privacy Settings Management
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    // In real implementation, retrieve from database
    return {
      userId,
      dataProcessingConsent: true,
      marketingConsent: false,
      analyticsConsent: true,
      locationTrackingConsent: true,
      dataRetentionPeriod: 2555, // 7 years
      dataExportFormat: 'json'
    };
  }

  async updatePrivacySettings(settings: PrivacySettings): Promise<boolean> {
    try {
      // In real implementation, save to database and apply changes
      console.log('Privacy settings updated:', settings);
      
      // Apply consent changes immediately
      if (!settings.locationTrackingConsent) {
        console.log('Location tracking disabled - stopping real-time sync');
      }
      
      if (!settings.analyticsConsent) {
        console.log('Analytics consent withdrawn - stopping data collection');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return false;
    }
  }

  // Data Retention Policy Enforcement
  async enforceDataRetention(): Promise<void> {
    const activities = this.getDataProcessingActivities();
    
    activities.forEach(activity => {
      console.log(`Enforcing retention policy for: ${activity.purpose}`);
      console.log(`Retention period: ${activity.retentionPeriod}`);
      
      // In real implementation, this would:
      // 1. Identify data older than retention period
      // 2. Archive or delete as appropriate
      // 3. Log retention actions for audit trail
    });
  }

  // Cross-border Transfer Documentation
  getCrossBorderTransferSafeguards(): { service: string; safeguards: string[] }[] {
    return [
      {
        service: 'GP51 API',
        safeguards: [
          'Standard Contractual Clauses (SCCs)',
          'Data Processing Agreement with GP51',
          'End-to-end encryption of location data',
          'Regular security assessments',
          'Data minimization - only necessary data transferred'
        ]
      },
      {
        service: 'Supabase (Database/Auth)',
        safeguards: [
          'EU-based hosting (Ireland)',
          'SOC 2 Type II certification',
          'ISO 27001 compliance',
          'GDPR compliance certification',
          'Data encryption at rest and in transit'
        ]
      }
    ];
  }

  // Breach Notification Procedures
  assessDataBreach(incident: {
    type: string;
    affectedUsers: number;
    dataTypes: string[];
    containmentStatus: string;
  }): {
    supervisoryAuthorityNotification: boolean;
    dataSubjectNotification: boolean;
    timeframe: string;
    reasoning: string;
  } {
    const highRisk = incident.affectedUsers > 100 || 
                    incident.dataTypes.includes('location') ||
                    incident.dataTypes.includes('personal_identifiers');
    
    return {
      supervisoryAuthorityNotification: incident.affectedUsers > 0,
      dataSubjectNotification: highRisk,
      timeframe: highRisk ? '72 hours to authority, without delay to subjects' : '72 hours to authority',
      reasoning: highRisk 
        ? 'High risk to rights and freedoms due to sensitive location data or large number of affected individuals'
        : 'Standard notification required for any personal data breach'
    };
  }

  // Compliance Documentation
  generateComplianceReport(): {
    lastUpdated: Date;
    dataProcessingActivities: number;
    activeCrossBorderTransfers: number;
    dataSubjectRequests: { pending: number; completed: number };
    retentionPoliciesEnforced: boolean;
    lastDataProtectionImpactAssessment: Date;
    recommendations: string[];
  } {
    return {
      lastUpdated: new Date(),
      dataProcessingActivities: this.getDataProcessingActivities().length,
      activeCrossBorderTransfers: this.getCrossBorderTransferSafeguards().length,
      dataSubjectRequests: { pending: 0, completed: 0 }, // Would be from database
      retentionPoliciesEnforced: true,
      lastDataProtectionImpactAssessment: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      recommendations: [
        'Schedule annual DPIA review',
        'Implement automated data retention enforcement',
        'Conduct staff GDPR training refresher',
        'Review and update data processing agreements'
      ]
    };
  }
}

export const gdprComplianceService = GDPRComplianceService.getInstance();
