
import { supabase } from '@/integrations/supabase/client';
import { WORKSHOP_PERMISSIONS } from '@/types/workshop-enhanced';

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
}

export interface PermissionGrant {
  workshopId: string;
  userId?: string;
  workshopUserId?: string;
  role: 'owner' | 'manager' | 'technician' | 'inspector';
  permissions: string[];
  expiresAt?: string;
}

export class WorkshopPermissionService {
  static async checkPermission(
    workshopUserId: string, 
    permission: string, 
    workshopId?: string
  ): Promise<PermissionCheck> {
    try {
      // Get user's permissions - simplified query to avoid type issues
      const { data: userPermissions, error } = await supabase
        .from('workshop_permissions')
        .select('permissions, role, is_active')
        .eq('workshop_user_id', workshopUserId)
        .eq('is_active', true)
        .single();

      if (error || !userPermissions) {
        return {
          hasPermission: false,
          reason: 'No active permissions found'
        };
      }

      // Check if permission is explicitly granted
      const permissions = Array.isArray(userPermissions.permissions) 
        ? userPermissions.permissions 
        : [];
        
      if (permissions.includes(permission)) {
        return { hasPermission: true };
      }

      // Check role-based permissions
      const rolePermissions = this.getRolePermissions(userPermissions.role);
      if (rolePermissions.includes(permission)) {
        return { hasPermission: true };
      }

      return {
        hasPermission: false,
        reason: `Permission '${permission}' not granted for role '${userPermissions.role}'`
      };
    } catch (error) {
      console.error('Permission check failed:', error);
      return {
        hasPermission: false,
        reason: 'Permission check failed'
      };
    }
  }

  static async grantPermissions(grant: PermissionGrant, grantedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workshop_permissions')
        .insert({
          workshop_id: grant.workshopId,
          user_id: grant.userId,
          workshop_user_id: grant.workshopUserId,
          role: grant.role,
          permissions: grant.permissions,
          granted_by: grantedBy,
          expires_at: grant.expiresAt
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Permission grant failed:', error);
      return false;
    }
  }

  static async revokePermissions(workshopUserId: string, revokedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workshop_permissions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('workshop_user_id', workshopUserId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Permission revocation failed:', error);
      return false;
    }
  }

  static getRolePermissions(role: string): string[] {
    switch (role) {
      case 'owner':
        return Object.values(WORKSHOP_PERMISSIONS || {});
      case 'manager':
        return [
          'MANAGE_STAFF',
          'VIEW_TRANSACTIONS',
          'MANAGE_INSPECTIONS',
          'ASSIGN_INSPECTORS',
          'VIEW_INSPECTIONS',
          'UPDATE_INSPECTIONS'
        ];
      case 'technician':
        return [
          'VIEW_INSPECTIONS',
          'CONDUCT_INSPECTIONS',
          'UPDATE_INSPECTION_RESULTS'
        ];
      case 'inspector':
        return [
          'VIEW_INSPECTIONS',
          'CONDUCT_INSPECTIONS',
          'UPDATE_INSPECTION_RESULTS'
        ];
      default:
        return [];
    }
  }

  static async getUserPermissions(workshopUserId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('workshop_permissions')
        .select('permissions, role')
        .eq('workshop_user_id', workshopUserId)
        .eq('is_active', true)
        .single();

      if (error || !data) return [];

      const rolePermissions = this.getRolePermissions(data.role);
      const explicitPermissions = Array.isArray(data.permissions) ? data.permissions : [];

      return [...new Set([...rolePermissions, ...explicitPermissions])];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }
}
