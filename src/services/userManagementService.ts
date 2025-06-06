
import { supabase } from '@/integrations/supabase/client';
import { User, UserFilters, PaginationInfo } from '@/types/user-management';

export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

export class UserManagementService {
  async getUsers(page: number, limit: number, filters: UserFilters): Promise<UsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters.search && filters.search.length >= 2) {
      params.append('search', filters.search);
    }

    const { data, error } = await supabase.functions.invoke('user-management', {
      method: 'GET',
      body: null,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data as UsersResponse;
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.functions.invoke(`user-management/${userId}`, {
      method: 'DELETE'
    });
    if (error) throw error;
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await Promise.all(
      userIds.map(id => 
        supabase.functions.invoke(`user-management/${id}`, { method: 'DELETE' })
      )
    );
  }

  async exportUsers(users: User[]): Promise<void> {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'GP51 Username', 'Status', 'Created At'],
      ...users.map(user => [
        user.name,
        user.email,
        user.phone_number || '',
        user.user_roles?.[0]?.role || 'user',
        user.gp51_username || '',
        user.registration_status || 'active',
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

export const userManagementService = new UserManagementService();
