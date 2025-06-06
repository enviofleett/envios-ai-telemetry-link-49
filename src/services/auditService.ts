
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
}

export class AuditService {
  private static logs: AuditLogEntry[] = [];

  static async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Store in memory (in production, this would go to a database)
    this.logs.push(auditEntry);

    // Log to console for immediate visibility
    console.log(`[AUDIT] ${entry.action} on ${entry.resource}`, {
      userId: entry.userId,
      success: entry.success,
      details: entry.details
    });

    // In production, you would also:
    // 1. Store in database
    // 2. Send to external logging service
    // 3. Trigger alerts for critical actions
  }

  static async logUserCreation(adminUserId: string, newUserId: string, userDetails: any, success: boolean, error?: string): Promise<void> {
    await this.logAction({
      userId: adminUserId,
      action: 'CREATE_USER',
      resource: 'user',
      resourceId: newUserId,
      details: {
        newUserUsername: userDetails.username,
        newUserEmail: userDetails.email,
        newUserRole: userDetails.usertype,
        gp51Username: userDetails.gp51Username
      },
      success,
      errorMessage: error
    });
  }

  static async logVehicleCreation(adminUserId: string, deviceId: string, vehicleDetails: any, success: boolean, error?: string): Promise<void> {
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
        gp51Compliant: vehicleDetails.gp51Compliant
      },
      success,
      errorMessage: error
    });
  }

  static async logSecurityEvent(userId: string | undefined, eventType: string, details: any, success: boolean = true): Promise<void> {
    await this.logAction({
      userId,
      action: `SECURITY_${eventType}`,
      resource: 'security',
      details,
      success
    });
  }

  static async logGP51ProtocolEvent(deviceId: string, eventType: string, details: any, success: boolean): Promise<void> {
    await this.logAction({
      action: `GP51_${eventType}`,
      resource: 'gp51_protocol',
      resourceId: deviceId,
      details,
      success
    });
  }

  // Retrieve audit logs (for admin dashboard)
  static getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
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

    if (filters?.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  // Get security-related logs for monitoring
  static getSecurityLogs(hours: number = 24): AuditLogEntry[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    const cutoffString = cutoff.toISOString();

    return this.logs.filter(log => 
      log.action.startsWith('SECURITY_') && 
      log.timestamp >= cutoffString
    );
  }

  // Get failed actions for monitoring
  static getFailedActions(hours: number = 24): AuditLogEntry[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    const cutoffString = cutoff.toISOString();

    return this.logs.filter(log => 
      !log.success && 
      log.timestamp >= cutoffString
    );
  }
}
