import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  UserFilters, 
  PaginationInfo, 
  UsersResponse, 
  UserManagementError,
  createUserManagementError,
  isUsersResponse,
  UsersResponseSchema
} from '@/types/user-management';

export class UserManagementService {
  async getUsers(page: number, limit: number, filters: UserFilters): Promise<UsersResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (filters.search && filters.search.length >= 2) {
        params.append('search', filters.search);
      }

      if (filters.role) {
        params.append('role', filters.role);
      }

      if (filters.status) {
        params.append('status', filters.status);
      }

      if (filters.gp51Status) {
        params.append('gp51Status', filters.gp51Status);
      }

      if (filters.gp51UserType) {
        params.append('gp51UserType', filters.gp51UserType.toString());
      }

      if (filters.registrationType) {
        params.append('registrationType', filters.registrationType);
      }

      if (filters.dateRange) {
        params.append('dateFrom', filters.dateRange.from);
        params.append('dateTo', filters.dateRange.to);
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
        throw createUserManagementError(
          'FETCH_USERS_ERROR',
          `Failed to fetch users: ${error.message}`,
          { originalError: error, params: Object.fromEntries(params) }
        );
      }

      // Validate response structure
      try {
        const validatedData = UsersResponseSchema.parse(data);
        return validatedData as UsersResponse;
      } catch (validationError) {
        console.error('Invalid response structure:', validationError);
        throw createUserManagementError(
          'VALIDATION_ERROR',
          'Received invalid data structure from server',
          { validationError, receivedData: data }
        );
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw UserManagementError
      }
      
      throw createUserManagementError(
        'NETWORK_ERROR',
        'Network error while fetching users',
        { originalError: error }
      );
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      if (!userId || typeof userId !== 'string') {
        throw createUserManagementError(
          'VALIDATION_ERROR',
          'Invalid user ID provided'
        );
      }

      const { error } = await supabase.functions.invoke(`user-management/${userId}`, {
        method: 'DELETE'
      });

      if (error) {
        throw createUserManagementError(
          'DELETE_USER_ERROR',
          `Failed to delete user: ${error.message}`,
          { userId, originalError: error }
        );
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      throw createUserManagementError(
        'DELETE_USER_ERROR',
        'Unexpected error while deleting user',
        { userId, originalError: error }
      );
    }
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw createUserManagementError(
          'VALIDATION_ERROR',
          'Invalid user IDs array provided'
        );
      }

      const deletePromises = userIds.map(id => 
        supabase.functions.invoke(`user-management/${id}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const failures = results
        .map((result, index) => ({ result, userId: userIds[index] }))
        .filter(({ result }) => result.status === 'rejected');

      if (failures.length > 0) {
        throw createUserManagementError(
          'BULK_DELETE_ERROR',
          `Failed to delete ${failures.length} out of ${userIds.length} users`,
          { 
            totalUsers: userIds.length,
            failedUsers: failures.length,
            failures: failures.map(f => ({
              userId: f.userId,
              error: f.result.status === 'rejected' ? f.result.reason : null
            }))
          }
        );
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      throw createUserManagementError(
        'BULK_DELETE_ERROR',
        'Unexpected error during bulk delete operation',
        { userIds, originalError: error }
      );
    }
  }

  async exportUsers(users: User[]): Promise<void> {
    try {
      if (!Array.isArray(users)) {
        throw createUserManagementError(
          'VALIDATION_ERROR',
          'Invalid users array provided for export'
        );
      }

      const csvContent = [
        ['Name', 'Email', 'Phone', 'Role', 'GP51 Username', 'Status', 'Created At'],
        ...users.map(user => [
          user.name || '',
          user.email || '',
          user.phone_number || '',
          user.user_roles?.[0]?.role || 'user',
          user.gp51_username || '',
          user.registration_status || 'active',
          user.created_at ? new Date(user.created_at).toLocaleDateString() : ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw createUserManagementError(
        'EXPORT_ERROR',
        'Failed to export users to CSV',
        { userCount: users.length, originalError: error }
      );
    }
  }
}

export const userManagementService = new UserManagementService();
