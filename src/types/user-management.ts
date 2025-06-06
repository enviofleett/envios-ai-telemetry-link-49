
import { z } from 'zod';

// Base User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  created_at: string;
  updated_at?: string;
  user_roles: Array<{ role: UserRole }>;
  gp51_sessions: Array<{
    id: string;
    username: string;
    token_expires_at: string;
  }>;
  gp51_username?: string;
  gp51_user_type?: GP51UserType;
  registration_status?: RegistrationStatus;
  registration_type?: RegistrationType;
  assigned_vehicles?: string[];
  is_gp51_imported?: boolean;
  needs_password_set?: boolean;
  city?: string;
  import_source?: string;
}

// Enums for better type safety
export type UserRole = 'admin' | 'user';
export type GP51UserType = 1 | 2 | 3 | 4;
export type RegistrationStatus = 'pending' | 'completed' | 'suspended' | 'active';
export type RegistrationType = 'admin' | 'public' | 'import';
export type UserSortField = 'name' | 'email' | 'created_at';
export type SortOrder = 'asc' | 'desc';

// Filter interfaces
export interface UserFilters {
  search: string;
  role?: UserRole;
  status?: RegistrationStatus;
  gp51Status?: 'active' | 'expired' | 'not_connected';
  gp51UserType?: GP51UserType;
  registrationType?: RegistrationType;
  dateRange?: {
    from: string;
    to: string;
  };
}

// API Response types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

// Error types
export interface UserManagementError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export type UserManagementErrorCode = 
  | 'FETCH_USERS_ERROR'
  | 'CREATE_USER_ERROR'
  | 'UPDATE_USER_ERROR'
  | 'DELETE_USER_ERROR'
  | 'BULK_DELETE_ERROR'
  | 'EXPORT_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND_ERROR';

// Component prop interfaces
export interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAssignVehicles: (user: User) => void;
  selectedUsers: string[];
  onUserSelect: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  sortBy: UserSortField;
  sortOrder: SortOrder;
  onSort: (field: UserSortField) => void;
}

export interface UserTableHeaderProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  selectedCount: number;
  onCreateUser: () => void;
  onImportUsers: () => void;
  onExport: () => void;
  onBulkDelete: () => void;
  isBulkDeleting: boolean;
  debouncedSearch: string;
  searchValue: string;
}

export interface UserTableRowProps {
  user: User;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssignVehicles: () => void;
}

export interface UserTablePaginationProps {
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
}

// Zod schemas for runtime validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  user_roles: z.array(z.object({
    role: z.enum(['admin', 'user'])
  })),
  gp51_sessions: z.array(z.object({
    id: z.string().uuid(),
    username: z.string(),
    token_expires_at: z.string()
  })),
  gp51_username: z.string().optional(),
  gp51_user_type: z.number().min(1).max(4).optional(),
  registration_status: z.enum(['pending', 'completed', 'suspended', 'active']).optional(),
  registration_type: z.enum(['admin', 'public', 'import']).optional(),
  assigned_vehicles: z.array(z.string()).optional(),
  is_gp51_imported: z.boolean().optional(),
  needs_password_set: z.boolean().optional(),
  city: z.string().optional(),
  import_source: z.string().optional()
});

export const UsersResponseSchema = z.object({
  users: z.array(UserSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1),
    total: z.number().min(0),
    totalPages: z.number().min(0)
  })
});

export const UserFiltersSchema = z.object({
  search: z.string(),
  role: z.enum(['admin', 'user']).optional(),
  status: z.enum(['pending', 'completed', 'suspended', 'active']).optional(),
  gp51Status: z.enum(['active', 'expired', 'not_connected']).optional(),
  gp51UserType: z.number().min(1).max(4).optional(),
  registrationType: z.enum(['admin', 'public', 'import']).optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string()
  }).optional()
});

// Type guards
export function isUser(data: unknown): data is User {
  try {
    UserSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isUsersResponse(data: unknown): data is UsersResponse {
  try {
    UsersResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isUserFilters(data: unknown): data is UserFilters {
  try {
    UserFiltersSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

// Error factory functions
export function createUserManagementError(
  code: UserManagementErrorCode,
  message: string,
  details?: Record<string, any>
): UserManagementError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}
