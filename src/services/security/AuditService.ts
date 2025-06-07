
import { SecurityService } from './SecurityService';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  requestId?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'system_config' | 'gp51_api' | 'user_management';
}

export interface GP51ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  userId?: string;
  requestData: any;
  responseData: any;
  success: boolean;
  responseTime: number;
  errorMessage?: string;
  gp51Status?: number;
  redactedFields: string[];
}

export interface SecurityAudit {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    criticalEvents: number;
    uniqueUsers: number;
    uniqueIPs: number;
  };
  topActions: Array<{ action: string; count: number }>;
  failureAnalysis: {
    topFailures: Array<{ action: string; count: number }>;
    suspiciousActivities: AuditLogEntry[];
  };
  gp51Analysis: {
    totalApiCalls: number;
    successRate: number;
    avgResponseTime: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  };
}

export class AuditService {
  private static logs: AuditLogEntry[] = [];
  private static gp51Logs: GP51ApiLog[] = [];
  private static readonly MAX_LOGS = 10000; // Prevent memory issues

  static async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Store in memory
    this.logs.push(auditEntry);
    this.maintainLogSize();

    // Log to console for immediate visibility
    console.log(`[AUDIT] ${entry.action} on ${entry.resource}`, {
      userId: entry.userId,
      success: entry.success,
      severity: entry.severity,
      category: entry.category
    });

    // Log as security event for critical actions
    if (entry.severity === 'critical' || !entry.success) {
      SecurityService.logSecurityEvent({
        type: this.mapCategoryToEventType(entry.category),
        severity: entry.severity,
        description: `${entry.action} on ${entry.resource}`,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        additionalData: {
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          success: entry.success,
          errorMessage: entry.errorMessage,
          details: this.sanitizeAuditDetails(entry.details)
        }
      });
    }

    // In production, also:
    // 1. Store in database
    // 2. Send to external logging service
    // 3. Trigger alerts for critical actions
    await this.handleCriticalActions(auditEntry);
  }

  static async logGP51ApiCall(log: Omit<GP51ApiLog, 'id' | 'timestamp'>): Promise<void> {
    const apiLog: GP51ApiLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...log
    };

    this.gp51Logs.push(apiLog);
    this.maintainGP51LogSize();

    // Log API call details
    console.log(`[GP51 API] ${log.method} ${log.endpoint}`, {
      userId: log.userId,
      success: log.success,
      responseTime: log.responseTime,
      gp51Status: log.gp51Status
    });

    // Create audit entry for API calls
    await this.logAction({
      userId: log.userId,
      action: `GP51_API_${log.method}`,
      resource: 'gp51_api',
      resourceId: log.endpoint,
      details: {
        endpoint: log.endpoint,
        method: log.method,
        responseTime: log.responseTime,
        gp51Status: log.gp51Status,
        redactedFields: log.redactedFields
      },
      success: log.success,
      errorMessage: log.errorMessage,
      severity: log.success ? 'low' : 'medium',
      category: 'gp51_api'
    });
  }

  // Enhanced logging methods for specific actions
  static async logUserCreation(
    adminUserId: string, 
    newUserId: string, 
    userDetails: any, 
    success: boolean, 
    error?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.logAction({
      userId: adminUserId,
      action: 'CREATE_USER',
      resource: 'user',
      resourceId: newUserId,
      details: {
        newUserUsername: userDetails.username,
        newUserEmail: userDetails.email,
        newUserRole: userDetails.usertype,
        gp51Username: userDetails.gp51Username,
        createdAt: new Date().toISOString()
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      success,
      errorMessage: error,
      severity: success ? 'medium' : 'high',
      category: 'user_management'
    });
  }

  static async logVehicleCreation(
    adminUserId: string, 
    deviceId: string, 
    vehicleDetails: any, 
    success: boolean, 
    error?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.logAction({
      userId: adminUserId,
      action: 'CREATE_VEHICLE',
      resource: 'vehicle',
      resourceId: deviceId,
      details: {
        deviceId: vehicleDetails.deviceid,
        deviceName: vehicleDetails.devicename,
        deviceType: vehicleDetails.devicetype,
        imei: vehicleDetails.imei,
        simNumber: vehicleDetails.simnum,
        gp51Compliant: vehicleDetails.gp51Compliant,
        createdAt: new Date().toISOString()
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      success,
      errorMessage: error,
      severity: success ? 'medium' : 'high',
      category: 'data_access'
    });
  }

  static async logSecurityEvent(
    userId: string | undefined, 
    eventType: string, 
    details: any, 
    success: boolean = true,
    context?: { ipAddress?: string; userAgent?: string; severity?: 'low' | 'medium' | 'high' | 'critical' }
  ): Promise<void> {
    await this.logAction({
      userId,
      action: `SECURITY_${eventType}`,
      resource: 'security',
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      success,
      severity: context?.severity || (success ? 'low' : 'high'),
      category: 'authentication'
    });
  }

  static async logGP51ProtocolEvent(
    deviceId: string, 
    eventType: string, 
    details: any, 
    success: boolean,
    context?: { userId?: string; ipAddress?: string }
  ): Promise<void> {
    await this.logAction({
      userId: context?.userId,
      action: `GP51_${eventType}`,
      resource: 'gp51_protocol',
      resourceId: deviceId,
      details: {
        deviceId,
        eventType,
        ...details
      },
      ipAddress: context?.ipAddress,
      success,
      severity: success ? 'low' : 'medium',
      category: 'gp51_api'
    });
  }

  static async logSystemConfiguration(
    adminUserId: string,
    configType: string,
    changes: Record<string, any>,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.logAction({
      userId: adminUserId,
      action: 'UPDATE_SYSTEM_CONFIG',
      resource: 'system_configuration',
      resourceId: configType,
      details: {
        configType,
        changes: this.sanitizeAuditDetails(changes),
        modifiedAt: new Date().toISOString()
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      success: true,
      severity: 'high',
      category: 'system_config'
    });
  }

  static async logDataAccess(
    userId: string,
    dataType: string,
    operation: string,
    resourceIds: string[],
    success: boolean,
    context?: { ipAddress?: string; userAgent?: string; filters?: Record<string, any> }
  ): Promise<void> {
    await this.logAction({
      userId,
      action: `${operation.toUpperCase()}_${dataType.toUpperCase()}`,
      resource: dataType,
      resourceId: resourceIds.length === 1 ? resourceIds[0] : `multiple_${resourceIds.length}`,
      details: {
        operation,
        dataType,
        resourceCount: resourceIds.length,
        resourceIds: resourceIds.slice(0, 10), // Limit logged IDs
        filters: context?.filters,
        accessedAt: new Date().toISOString()
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      success,
      severity: success ? 'low' : 'medium',
      category: 'data_access'
    });
  }

  // Advanced audit retrieval and analysis
  static getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    category?: AuditLogEntry['category'];
    severity?: AuditLogEntry['severity'];
    success?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
    ipAddress?: string;
  }): AuditLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters?.action) {
      filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action!));
    }

    if (filters?.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
    }

    if (filters?.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }

    if (filters?.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
    }

    if (filters?.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === filters.success);
    }

    if (filters?.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters?.ipAddress) {
      filteredLogs = filteredLogs.filter(log => log.ipAddress === filters.ipAddress);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  static getGP51ApiLogs(filters?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): GP51ApiLog[] {
    let filteredLogs = [...this.gp51Logs];

    if (filters?.endpoint) {
      filteredLogs = filteredLogs.filter(log => log.endpoint === filters.endpoint);
    }

    if (filters?.method) {
      filteredLogs = filteredLogs.filter(log => log.method === filters.method);
    }

    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters?.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === filters.success);
    }

    if (filters?.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  // Security audit report generation
  static generateSecurityAudit(hours = 24): SecurityAudit {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
    
    const logs = this.getAuditLogs({
      startDate: startTime.toISOString(),
      endDate: endTime.toISOString()
    });

    const gp51Logs = this.getGP51ApiLogs({
      startDate: startTime.toISOString(),
      endDate: endTime.toISOString()
    });

    const uniqueUsers = new Set(logs.filter(l => l.userId).map(l => l.userId!));
    const uniqueIPs = new Set(logs.filter(l => l.ipAddress).map(l => l.ipAddress!));

    const actionCounts = new Map<string, number>();
    const failureCounts = new Map<string, number>();

    logs.forEach(log => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
      
      if (!log.success) {
        failureCounts.set(log.action, (failureCounts.get(log.action) || 0) + 1);
      }
    });

    const endpointCounts = new Map<string, number>();
    const gp51ResponseTimes: number[] = [];

    gp51Logs.forEach(log => {
      endpointCounts.set(log.endpoint, (endpointCounts.get(log.endpoint) || 0) + 1);
      gp51ResponseTimes.push(log.responseTime);
    });

    const avgResponseTime = gp51ResponseTimes.length > 0 ? 
      gp51ResponseTimes.reduce((a, b) => a + b, 0) / gp51ResponseTimes.length : 0;

    const successfulGP51Calls = gp51Logs.filter(l => l.success).length;
    const successRate = gp51Logs.length > 0 ? (successfulGP51Calls / gp51Logs.length) * 100 : 0;

    return {
      period: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      },
      summary: {
        totalEvents: logs.length,
        successfulEvents: logs.filter(l => l.success).length,
        failedEvents: logs.filter(l => !l.success).length,
        criticalEvents: logs.filter(l => l.severity === 'critical').length,
        uniqueUsers: uniqueUsers.size,
        uniqueIPs: uniqueIPs.size
      },
      topActions: Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      failureAnalysis: {
        topFailures: Array.from(failureCounts.entries())
          .map(([action, count]) => ({ action, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        suspiciousActivities: this.detectSuspiciousActivities(logs)
      },
      gp51Analysis: {
        totalApiCalls: gp51Logs.length,
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        topEndpoints: Array.from(endpointCounts.entries())
          .map(([endpoint, count]) => ({ endpoint, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }
    };
  }

  // Get recent critical events for monitoring
  static getCriticalEvents(hours: number = 24): AuditLogEntry[] {
    return this.getAuditLogs({
      severity: 'critical',
      startDate: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
      limit: 100
    });
  }

  // Get failed actions for monitoring
  static getFailedActions(hours: number = 24): AuditLogEntry[] {
    return this.getAuditLogs({
      success: false,
      startDate: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
      limit: 100
    });
  }

  // Detect suspicious activities
  private static detectSuspiciousActivities(logs: AuditLogEntry[]): AuditLogEntry[] {
    const suspicious: AuditLogEntry[] = [];
    const userActions = new Map<string, AuditLogEntry[]>();

    // Group logs by user
    logs.forEach(log => {
      if (log.userId) {
        if (!userActions.has(log.userId)) {
          userActions.set(log.userId, []);
        }
        userActions.get(log.userId)!.push(log);
      }
    });

    // Detect patterns
    userActions.forEach((userLogs, userId) => {
      // Multiple failed login attempts
      const failedLogins = userLogs.filter(l => 
        l.action.includes('LOGIN') && !l.success
      );
      if (failedLogins.length >= 3) {
        suspicious.push(...failedLogins);
      }

      // Rapid successive actions (possible automation)
      userLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      for (let i = 1; i < userLogs.length; i++) {
        const timeDiff = new Date(userLogs[i].timestamp).getTime() - 
                        new Date(userLogs[i-1].timestamp).getTime();
        if (timeDiff < 1000) { // Less than 1 second between actions
          suspicious.push(userLogs[i]);
        }
      }

      // Unusual IP address changes
      const ips = new Set(userLogs.filter(l => l.ipAddress).map(l => l.ipAddress!));
      if (ips.size > 3) { // More than 3 different IPs in the time period
        suspicious.push(...userLogs.filter(l => l.ipAddress));
      }
    });

    return suspicious.slice(0, 50); // Limit results
  }

  private static sanitizeAuditDetails(details: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];

    Object.entries(details).forEach(([key, value]) => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeAuditDetails(value);
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  private static mapCategoryToEventType(category: AuditLogEntry['category']): SecurityService['logSecurityEvent'] extends (event: { type: infer T }) => any ? T : never {
    const mapping = {
      'authentication': 'authentication' as const,
      'authorization': 'authorization' as const,
      'data_access': 'input_validation' as const,
      'system_config': 'authentication' as const,
      'gp51_api': 'input_validation' as const,
      'user_management': 'authentication' as const
    };

    return mapping[category] || 'suspicious_activity' as const;
  }

  private static async handleCriticalActions(entry: AuditLogEntry): Promise<void> {
    if (entry.severity === 'critical') {
      // In production, trigger immediate alerts
      console.error(`[CRITICAL AUDIT] ${entry.action} on ${entry.resource}`, entry);
      
      // Example integrations:
      // - Send email alert
      // - Post to Slack
      // - Create incident ticket
      // - Trigger webhook
    }

    // Store critical events in separate collection for faster access
    if (entry.severity === 'critical' || !entry.success) {
      // In production: await database.criticalEvents.insert(entry);
    }
  }

  private static maintainLogSize(): void {
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }
  }

  private static maintainGP51LogSize(): void {
    if (this.gp51Logs.length > this.MAX_LOGS) {
      this.gp51Logs = this.gp51Logs.slice(-this.MAX_LOGS);
    }
  }
}
