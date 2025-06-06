
export interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  created_at: string;
  user_roles: Array<{ role: string }>;
  gp51_sessions: Array<{
    id: string;
    username: string;
    token_expires_at: string;
  }>;
  gp51_username?: string;
  gp51_user_type?: number;
  registration_status?: string;
  assigned_vehicles?: string[];
}

export interface UserFilters {
  search: string;
  role?: string;
  status?: string;
  gp51Status?: string;
}

export interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAssignVehicles: (user: User) => void;
  selectedUsers: string[];
  onUserSelect: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
