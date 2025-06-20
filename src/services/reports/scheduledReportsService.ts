
import { supabase } from '@/integrations/supabase/client';
import { realtimeReportsService } from './realtimeReportsService';
import { exportService } from './exportService';

export interface ScheduledReport {
  id: string;
  template_id: string;
  schedule_config: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
    day_of_week?: number;
    day_of_month?: number;
  };
  recipients: string[];
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

class ScheduledReportsService {
  async getScheduledReports(): Promise<ScheduledReport[]> {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .select(`
        *,
        report_templates (
          name,
          report_type
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      schedule_config: typeof item.schedule_config === 'string' 
        ? JSON.parse(item.schedule_config) 
        : item.schedule_config,
      recipients: typeof item.recipients === 'string' 
        ? JSON.parse(item.recipients) 
        : item.recipients
    })) as ScheduledReport[];
  }

  async createScheduledReport(report: Omit<ScheduledReport, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<ScheduledReport> {
    const nextRunAt = this.calculateNextRun(report.schedule_config);
    
    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert({
        ...report,
        next_run_at: nextRunAt,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      schedule_config: typeof data.schedule_config === 'string' 
        ? JSON.parse(data.schedule_config) 
        : data.schedule_config,
      recipients: typeof data.recipients === 'string' 
        ? JSON.parse(data.recipients) 
        : data.recipients
    } as ScheduledReport;
  }

  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    if (updates.schedule_config) {
      updates.next_run_at = this.calculateNextRun(updates.schedule_config);
    }

    const { data, error } = await supabase
      .from('scheduled_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      schedule_config: typeof data.schedule_config === 'string' 
        ? JSON.parse(data.schedule_config) 
        : data.schedule_config,
      recipients: typeof data.recipients === 'string' 
        ? JSON.parse(data.recipients) 
        : data.recipients
    } as ScheduledReport;
  }

  async deleteScheduledReport(id: string): Promise<void> {
    const { error } = await supabase
      .from('scheduled_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async executeScheduledReport(reportId: string): Promise<void> {
    console.log('Executing scheduled report:', reportId);
    
    const { data: report, error } = await supabase
      .from('scheduled_reports')
      .select(`
        *,
        report_templates (*)
      `)
      .eq('id', reportId)
      .single();

    if (error) throw error;
    if (!report) return;

    try {
      // Create execution record
      const { data: execution } = await supabase
        .from('report_executions')
        .insert({
          scheduled_report_id: reportId,
          template_id: report.template_id,
          execution_status: 'running'
        })
        .select()
        .single();

      // Generate report data based on template type
      let reportData;
      const template = report.report_templates as any;
      
      switch (template.report_type) {
        case 'fleet_summary':
          reportData = await realtimeReportsService.generateFleetReport({});
          break;
        case 'trip_analysis':
          reportData = await realtimeReportsService.generateTripReport({});
          break;
        case 'maintenance':
          reportData = await realtimeReportsService.generateMaintenanceReport({});
          break;
        default:
          reportData = await realtimeReportsService.generateFleetReport({});
      }

      // Update execution with report data
      await supabase
        .from('report_executions')
        .update({
          execution_status: 'completed',
          completed_at: new Date().toISOString(),
          report_data: reportData
        })
        .eq('id', execution?.id);

      // Update scheduled report
      const nextRunAt = this.calculateNextRun(typeof report.schedule_config === 'string' 
        ? JSON.parse(report.schedule_config) 
        : report.schedule_config);
      await supabase
        .from('scheduled_reports')
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: nextRunAt
        })
        .eq('id', reportId);

      console.log('Scheduled report executed successfully');
    } catch (error) {
      console.error('Error executing scheduled report:', error);
      
      // Update execution with error
      await supabase
        .from('report_executions')
        .update({
          execution_status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('scheduled_report_id', reportId);
    }
  }

  async getReportExecutions(reportId?: string): Promise<any[]> {
    let query = supabase
      .from('report_executions')
      .select(`
        *,
        scheduled_reports (
          report_templates (
            name,
            report_type
          )
        )
      `)
      .order('generated_at', { ascending: false });

    if (reportId) {
      query = query.eq('scheduled_report_id', reportId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private calculateNextRun(scheduleConfig: ScheduledReport['schedule_config']): string {
    const now = new Date();
    const [hours, minutes] = scheduleConfig.time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, move to next occurrence
    if (nextRun <= now) {
      switch (scheduleConfig.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          const daysUntilTarget = (7 + (scheduleConfig.day_of_week || 0) - nextRun.getDay()) % 7;
          nextRun.setDate(nextRun.getDate() + (daysUntilTarget || 7));
          break;
        case 'monthly':
          if (scheduleConfig.day_of_month) {
            nextRun.setMonth(nextRun.getMonth() + 1, scheduleConfig.day_of_month);
          } else {
            nextRun.setMonth(nextRun.getMonth() + 1);
          }
          break;
      }
    }
    
    return nextRun.toISOString();
  }

  async checkAndExecuteDueReports(): Promise<void> {
    const { data: dueReports, error } = await supabase
      .from('scheduled_reports')
      .select('id')
      .eq('is_active', true)
      .lte('next_run_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching due reports:', error);
      return;
    }

    for (const report of dueReports || []) {
      await this.executeScheduledReport(report.id);
    }
  }
}

export const scheduledReportsService = new ScheduledReportsService();
