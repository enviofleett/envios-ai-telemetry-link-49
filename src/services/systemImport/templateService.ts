
import { supabase } from '@/integrations/supabase/client';
import { SystemImportOptions } from '@/types/system-import';
import { importLogger } from './importLogger';

export interface ImportTemplate {
  id: string;
  name: string;
  description?: string;
  templateType: 'system' | 'custom';
  configuration: SystemImportOptions & { description?: string };
  isSystemTemplate: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

class TemplateService {
  public async getTemplates(): Promise<ImportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('import_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return data.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        templateType: template.template_type as 'system' | 'custom',
        configuration: template.configuration as unknown as SystemImportOptions & { description?: string },
        isSystemTemplate: template.is_system_template,
        isActive: template.is_active,
        createdBy: template.created_by,
        createdAt: new Date(template.created_at),
        updatedAt: new Date(template.updated_at)
      }));
    } catch (error) {
      importLogger.error('template', 'Failed to fetch templates', { error });
      return [];
    }
  }

  public async getTemplate(id: string): Promise<ImportTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('import_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        templateType: data.template_type as 'system' | 'custom',
        configuration: data.configuration as unknown as SystemImportOptions & { description?: string },
        isSystemTemplate: data.is_system_template,
        isActive: data.is_active,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      importLogger.error('template', 'Failed to fetch template', { error, id });
      return null;
    }
  }

  public async createTemplate(template: {
    name: string;
    description?: string;
    configuration: SystemImportOptions & { description?: string };
  }): Promise<ImportTemplate> {
    try {
      const { data, error } = await supabase
        .from('import_templates')
        .insert({
          name: template.name,
          description: template.description,
          template_type: 'custom',
          configuration: template.configuration as unknown as any,
          is_system_template: false,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      importLogger.info('template', 'Template created', { templateId: data.id, name: template.name });

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        templateType: 'custom',
        configuration: data.configuration as unknown as SystemImportOptions & { description?: string },
        isSystemTemplate: false,
        isActive: true,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      importLogger.error('template', 'Failed to create template', { error, template });
      throw error;
    }
  }

  public async updateTemplate(id: string, updates: {
    name?: string;
    description?: string;
    configuration?: SystemImportOptions & { description?: string };
  }): Promise<ImportTemplate> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.configuration) updateData.configuration = updates.configuration as unknown as any;

      const { data, error } = await supabase
        .from('import_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      importLogger.info('template', 'Template updated', { templateId: id, updates });

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        templateType: data.template_type as 'system' | 'custom',
        configuration: data.configuration as unknown as SystemImportOptions & { description?: string },
        isSystemTemplate: data.is_system_template,
        isActive: data.is_active,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      importLogger.error('template', 'Failed to update template', { error, id, updates });
      throw error;
    }
  }

  public async deleteTemplate(id: string): Promise<void> {
    try {
      // Don't actually delete, just deactivate
      const { error } = await supabase
        .from('import_templates')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_system_template', false); // Only allow deleting custom templates

      if (error) throw error;

      importLogger.info('template', 'Template deactivated', { templateId: id });
    } catch (error) {
      importLogger.error('template', 'Failed to delete template', { error, id });
      throw error;
    }
  }

  public async duplicateTemplate(id: string, newName: string): Promise<ImportTemplate> {
    try {
      const original = await this.getTemplate(id);
      if (!original) {
        throw new Error('Template not found');
      }

      return await this.createTemplate({
        name: newName,
        description: `Copy of ${original.name}`,
        configuration: original.configuration
      });
    } catch (error) {
      importLogger.error('template', 'Failed to duplicate template', { error, id, newName });
      throw error;
    }
  }

  public async getSystemTemplates(): Promise<ImportTemplate[]> {
    const templates = await this.getTemplates();
    return templates.filter(t => t.isSystemTemplate);
  }

  public async getCustomTemplates(): Promise<ImportTemplate[]> {
    const templates = await this.getTemplates();
    return templates.filter(t => !t.isSystemTemplate);
  }

  public validateTemplate(configuration: SystemImportOptions): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!configuration.importType) {
      errors.push('Import type is required');
    }

    // Validate import type
    const validTypes = ['users_only', 'vehicles_only', 'complete_system', 'selective'];
    if (configuration.importType && !validTypes.includes(configuration.importType)) {
      errors.push(`Invalid import type: ${configuration.importType}`);
    }

    // Validate selective import
    if (configuration.importType === 'selective') {
      if (!configuration.selectedUsernames || configuration.selectedUsernames.length === 0) {
        errors.push('Selected usernames are required for selective import');
      }
    }

    // Validate batch size
    if (configuration.batchSize) {
      if (configuration.batchSize < 1 || configuration.batchSize > 100) {
        errors.push('Batch size must be between 1 and 100');
      }
      if (configuration.batchSize > 50) {
        warnings.push('Large batch sizes may impact performance');
      }
    }

    // Validate cleanup settings
    if (configuration.performCleanup && configuration.importType !== 'complete_system') {
      warnings.push('Data cleanup is typically used with complete system imports');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  public async exportTemplate(id: string): Promise<string> {
    try {
      const template = await this.getTemplate(id);
      if (!template) {
        throw new Error('Template not found');
      }

      const exportData = {
        name: template.name,
        description: template.description,
        configuration: template.configuration,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      importLogger.error('template', 'Failed to export template', { error, id });
      throw error;
    }
  }

  public async importTemplate(templateData: string): Promise<ImportTemplate> {
    try {
      const data = JSON.parse(templateData);
      
      // Validate imported data
      if (!data.name || !data.configuration) {
        throw new Error('Invalid template data');
      }

      const validation = this.validateTemplate(data.configuration);
      if (!validation.isValid) {
        throw new Error(`Invalid template configuration: ${validation.errors.join(', ')}`);
      }

      // Create the template with a unique name
      const uniqueName = await this.generateUniqueName(data.name);
      
      return await this.createTemplate({
        name: uniqueName,
        description: data.description || 'Imported template',
        configuration: data.configuration
      });
    } catch (error) {
      importLogger.error('template', 'Failed to import template', { error });
      throw error;
    }
  }

  private async generateUniqueName(baseName: string): Promise<string> {
    const templates = await this.getTemplates();
    const existingNames = templates.map(t => t.name);
    
    let uniqueName = baseName;
    let counter = 1;
    
    while (existingNames.includes(uniqueName)) {
      uniqueName = `${baseName} (${counter})`;
      counter++;
    }
    
    return uniqueName;
  }
}

export const templateService = new TemplateService();
