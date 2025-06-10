
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEnhancedWorkshopManagement = (workshopId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inspection templates
  const { data: inspectionTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['inspection-templates', workshopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspection_form_templates')
        .select('*')
        .eq('workshop_id', workshopId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Create or update inspection template
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const { data: user } = await supabase.auth.getUser();
      
      if (template.id) {
        // Update existing template
        const { data, error } = await supabase
          .from('inspection_form_templates')
          .update({
            template_name: template.template_name,
            template_description: template.template_description,
            vehicle_category: template.vehicle_category,
            form_fields: template.form_fields,
            is_default: template.is_default
          })
          .eq('id', template.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('inspection_form_templates')
          .insert({
            workshop_id: workshopId,
            template_name: template.template_name,
            template_description: template.template_description,
            vehicle_category: template.vehicle_category,
            form_fields: template.form_fields,
            is_default: template.is_default,
            created_by: user.user?.id
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-templates', workshopId] });
      toast({
        title: "Template Saved",
        description: "Inspection form template has been saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save template: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete inspection template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('inspection_form_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-templates', workshopId] });
      toast({
        title: "Template Deleted",
        description: "Inspection form template has been deleted"
      });
    }
  });

  // Fetch workshop permissions for current user
  const { data: userPermissions } = useQuery({
    queryKey: ['user-workshop-permissions', workshopId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('workshop_permissions')
        .select('*')
        .eq('workshop_id', workshopId)
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Check if user has specific permission
  const hasPermission = (permission: string) => {
    if (!userPermissions || !userPermissions.permissions) return false;
    
    // Handle permissions as a JSON array
    const permissions = Array.isArray(userPermissions.permissions) 
      ? userPermissions.permissions 
      : [];
    
    return permissions.includes(permission);
  };

  // Check if user has specific role
  const hasRole = (role: string) => {
    if (!userPermissions) return false;
    return userPermissions.role === role;
  };

  // Get workshop statistics
  const getWorkshopStats = () => {
    if (!inspectionTemplates) return null;

    return {
      totalTemplates: inspectionTemplates.length,
      activeTemplates: inspectionTemplates.filter(t => t.is_active).length,
      defaultTemplates: inspectionTemplates.filter(t => t.is_default).length
    };
  };

  return {
    // Data
    inspectionTemplates,
    userPermissions,
    workshopStats: getWorkshopStats(),
    
    // Loading states
    isLoading: isLoading || templatesLoading,
    isSaving: saveTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    
    // Actions
    saveTemplate: saveTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    
    // Permission checks
    hasPermission,
    hasRole,
    
    // Role-based access
    canManageStaff: hasPermission('manage_staff') || hasRole('owner') || hasRole('manager'),
    canManageSettings: hasPermission('manage_settings') || hasRole('owner'),
    canViewTransactions: hasPermission('view_transactions') || hasRole('owner') || hasRole('manager'),
    canManageInspections: hasPermission('manage_inspections') || hasRole('owner') || hasRole('manager'),
    canAssignInspectors: hasPermission('assign_inspectors') || hasRole('owner') || hasRole('manager')
  };
};
