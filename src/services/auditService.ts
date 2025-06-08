
import { supabase } from '@/integrations/supabase/client';
import { SecurityService } from './security/SecurityService';

export interface AuditEvent {
  id?: string;
  eventType: 'user_action' | 'system_action' | 'security_event' | 'data_change';
  action: string;
  userId?: string;
  targetEntity?: string;
  targetId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditService {
  private static localAuditLog: AuditEvent[] = [];
  private static maxLocalEntries = 1000;

  static async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    };

    // Store locally for immediate access
    this.localAuditLog.unshift(auditEvent);
    if (this.localAuditLog.length > this.maxLocalEntries) {
      this.localAuditLog = this.localAuditLog.slice(0, this.maxLocalEntries);
    }

    // Log to security service for critical events
    if (auditEvent.severity === 'critical' || auditEvent.severity === 'high') {
      SecurityService.logSecurityEvent({
        type: 'suspicious_activity',
        severity: auditEvent.severity,
        description: `Audit: ${auditEvent.action}`,
        userId: auditEvent.userId,
        additionalData: auditEvent.details
      });
    }

    // Attempt to store in database (non-blocking)
    this.persistToDatabase(auditEvent).catch(error => {
      console.error('Failed to persist audit event to database:', error);
    });

    console.log(`[AUDIT] ${auditEvent.eventType}: ${auditEvent.action}`, auditEvent.details);
  }

  private static async persistToDatabase(event: AuditEvent): Promise<void> {
    try {
      // Note: This would require an audit_log table in the database
      // For now, we'll store in a generic log table or console
      console.log('Persisting audit event:', event);
    } catch (error) {
      console.error('Database persistence failed:', error);
    }
  }

  static async logUserAction(
    userId: string,
    action: string,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    await this.logEvent({
      eventType: 'user_action',
      action,
      userId,
      details,
      severity
    });
  }

  static async logSystemAction(
    action: string,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    await this.logEvent({
      eventType: 'system_action',
      action,
      details,
      severity
    });
  }

  static async logDataChange(
    userId: string,
    targetEntity: string,
    targetId: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType: 'data_change',
      action,
      userId,
      targetEntity,
      targetId,
      details,
      severity: 'medium'
    });
  }

  static async logVehicleCreation(
    userId: string,
    deviceId: string,
    vehicleData: any,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'user_action',
      action: 'vehicle_created',
      userId,
      targetEntity: 'vehicle',
      targetId: deviceId,
      details: {
        success,
        error,
        vehicleData: { 
          deviceId, 
          make: vehicleData.make, 
          model: vehicleData.model 
        }
      },
      severity: success ? 'low' : 'medium'
    });
  }

  static async logUserCreation(
    adminUserId: string, 
    newUserId: string, 
    userDetails: any, 
    success: boolean, 
    error?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.logEvent({
      eventType: 'user_action',
      action: 'user_created',
      userId: adminUserId,
      targetEntity: 'user',
      targetId: newUserId,
      details: {
        newUserDetails: userDetails,
        success,
        error
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      severity: success ? 'medium' : 'high'
    });
  }

  static async logAuthentication(
    userId: string,
    action: 'login' | 'logout' | 'failed_login',
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'security_event',
      action: `user_${action}`,
      userId,
      details,
      severity: action === 'failed_login' ? 'medium' : 'low'
    });
  }

  static async logSecurityEvent(
    userId: string | undefined, 
    eventType: string, 
    details: any, 
    success: boolean = true,
    context?: { ipAddress?: string; userAgent?: string; severity?: 'low' | 'medium' | 'high' | 'critical' }
  ): Promise<void> {
    await this.logEvent({
      eventType: 'security_event',
      action: `security_${eventType}`,
      userId,
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      severity: context?.severity || (success ? 'low' : 'high')
    });
  }

  static async logGP51ProtocolEvent(
    deviceId: string, 
    eventType: string, 
    details: any, 
    success: boolean,
    context?: { userId?: string; ipAddress?: string }
  ): Promise<void> {
    await this.logEvent({
      eventType: 'system_action',
      action: `gp51_${eventType}`,
      userId: context?.userId,
      targetEntity: 'gp51_protocol',
      targetId: deviceId,
      details: {
        deviceId,
        eventType,
        success,
        ...details
      },
      ipAddress: context?.ipAddress,
      severity: success ? 'low' : 'medium'
    });
  }

  static getRecentEvents(
    count: number = 50,
    filters?: {
      eventType?: string;
      userId?: string;
      severity?: string;
      hours?: number;
    }
  ): AuditEvent[] {
    let events = [...this.localAuditLog];

    if (filters) {
      if (filters.eventType) {
        events = events.filter(e => e.eventType === filters.eventType);
      }
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId);
      }
      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity);
      }
      if (filters.hours) {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - filters.hours);
        events = events.filter(e => new Date(e.timestamp) >= cutoff);
      }
    }

    return events.slice(0, count);
  }

  static async generateAuditReport(hours: number = 24) {
    const events = this.getRecentEvents(1000, { hours });
    
    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const securityEvents = events.filter(e => 
      e.eventType === 'security_event' || e.severity === 'high' || e.severity === 'critical'
    );

    return {
      timeRange: {
        start: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      securityEvents: securityEvents.length,
      recentHighSeverityEvents: securityEvents.slice(0, 10)
    };
  }
}
