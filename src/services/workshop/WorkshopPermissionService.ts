
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
      // Get user from workshop_users table
      const { data: user, error } = await supabase
        .from('workshop_users')
        .select('permissions, role, is_active')
        .eq('id', workshopUserId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return {
          hasPermission: false,
          reason: 'No active user found'
        };
      }

      // Convert permissions to string array safely
      const permissions = Array.isArray(user.permissions) 
        ? user.permissions.map(p => String(p))
        : [];
        
      if (permissions.includes(permission)) {
        return { hasPermission: true };
      }

      // Check role-based permissions
      const rolePermissions = this.getRolePermissions(user.role);
      if (rolePermissions.includes(permission)) {
        return { hasPermission: true };
      }

      return {
        hasPermission: false,
        reason: `Permission '${permission}' not granted for role '${user.role}'`
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
      // For now, update the workshop_users table directly
      const { error } = await supabase
        .from('workshop_users')
        .update({
          role: grant.role,
          permissions: grant.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', grant.workshopUserId);

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
        .from('workshop_users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', workshopUserId);

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
        .from('workshop_users')
        .select('permissions, role')
        .eq('id', workshopUserId)
        .eq('is_active', true)
        .single();

      if (error || !data) return [];

      const rolePermissions = this.getRolePermissions(data.role);
      const explicitPermissions = Array.isArray(data.permissions) 
        ? data.permissions.map(p => String(p))
        : [];

      return [...new Set([...rolePermissions, ...explicitPermissions])];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }
}
