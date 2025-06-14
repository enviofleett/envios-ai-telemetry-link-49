
import { supabase } from "@/integrations/supabase/client";

export interface PlatformAdminUser {
  id: string;
  user_id: string;
  email: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
  roles: string[];
}

export interface PlatformAdminRole {
  id: string;
  admin_user_id: string;
  role: "super_admin" | "system_admin" | "support_admin";
  assigned_by?: string;
  assigned_at: string;
}

export const PlatformAdminService = {
  // List platform admin users w/their roles
  async listAdmins(): Promise<PlatformAdminUser[]> {
    const { data, error } = await supabase
      .from("platform_admin_users")
      .select(
        "id, user_id, email, display_name, created_at, updated_at, platform_admin_roles(id, role)"
      );

    if (error) throw new Error(error.message);
    return (
      data?.map((u: any) => ({
        ...u,
        roles: u.platform_admin_roles?.map((r: any) => r.role) || [],
      })) || []
    );
  },

  // Add a new platform admin user with initial role
  async addAdmin(email: string, user_id: string, display_name: string, role: "super_admin" | "system_admin" | "support_admin") {
    // Insert to platform_admin_users
    const { data: userData, error: userError } = await supabase
      .from("platform_admin_users")
      .insert([{ email, user_id, display_name }])
      .select()
      .single();

    if (userError) throw new Error(userError.message);

    // Assign initial role
    const { error: roleError } = await supabase
      .from("platform_admin_roles")
      .insert([{ admin_user_id: userData.id, role }]);

    if (roleError) throw new Error(roleError.message);
    return userData;
  },

  // Assign a role to an admin user
  async assignRole(admin_user_id: string, role: "super_admin" | "system_admin" | "support_admin") {
    const { error } = await supabase
      .from("platform_admin_roles")
      .insert([{ admin_user_id, role }]);
    if (error) throw new Error(error.message);
  },

  // Remove a role from an admin user
  async removeRole(admin_user_id: string, role: "super_admin" | "system_admin" | "support_admin") {
    const { error } = await supabase
      .from("platform_admin_roles")
      .delete()
      .eq("admin_user_id", admin_user_id)
      .eq("role", role);
    if (error) throw new Error(error.message);
  },

  // Get permissions for a given admin role
  async getPermissionsForRole(role: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("admin_permissions")
      .select("permission")
      .eq("role", role);
    if (error) throw new Error(error.message);
    return data?.map((row: any) => row.permission) || [];
  },
};

