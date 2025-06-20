
import { supabase } from '@/integrations/supabase/client';

export interface ReportTemplate {
  id: string;
  name: string;
  report_type: string;
  template_config: {
    filters: any;
    charts: string[];
    metrics: string[];
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      recipients: string[];
    };
  };
  created_by: string;
  is_system_template: boolean;
  created_at: string;
  updated_at: string;
}

class ReportTemplatesService {
  async getTemplates(): Promise<ReportTemplate[]> {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTemplate(id: string): Promise<ReportTemplate | null> {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createTemplate(template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<ReportTemplate> {
    const { data, error } = await supabase
      .from('report_templates')
      .insert({
        ...template,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const { data, error } = await supabase
      .from('report_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('report_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getSystemTemplates(): Promise<ReportTemplate[]> {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('is_system_template', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createSystemTemplates(): Promise<void> {
    const systemTemplates = [
      {
        name: 'Daily Fleet Summary',
        report_type: 'fleet_summary',
        template_config: {
          filters: { dateRange: 'last_24_hours' },
          charts: ['vehicle_status', 'speed_distribution'],
          metrics: ['total_vehicles', 'active_vehicles', 'total_mileage']
        },
        is_system_template: true
      },
      {
        name: 'Weekly Trip Analysis',
        report_type: 'trip_analysis',
        template_config: {
          filters: { dateRange: 'last_7_days' },
          charts: ['trip_frequency', 'distance_trends'],
          metrics: ['total_trips', 'total_distance', 'average_speed']
        },
        is_system_template: true
      },
      {
        name: 'Monthly Maintenance Report',
        report_type: 'maintenance',
        template_config: {
          filters: { dateRange: 'last_30_days' },
          charts: ['maintenance_by_type', 'cost_trends'],
          metrics: ['total_maintenance', 'average_cost', 'upcoming_maintenance']
        },
        is_system_template: true
      }
    ];

    for (const template of systemTemplates) {
      try {
        await supabase
          .from('report_templates')
          .insert(template)
          .select()
          .single();
      } catch (error) {
        console.log('System template already exists or error creating:', template.name);
      }
    }
  }
}

export const reportTemplatesService = new ReportTemplatesService();
