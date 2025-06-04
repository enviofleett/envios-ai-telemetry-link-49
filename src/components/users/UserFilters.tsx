
import React from 'react';
import { Search, Filter, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserFiltersProps {
  filters: {
    search: string;
    source: string;
    status: string;
    role: string;
  };
  onFiltersChange: (filters: any) => void;
  userCount: number;
  filteredCount: number;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  userCount,
  filteredCount
}) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleSourceChange = (value: string) => {
    onFiltersChange({ ...filters, source: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({ ...filters, role: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      source: 'all',
      status: 'all',
      role: 'all'
    });
  };

  const hasActiveFilters = filters.search || 
    filters.source !== 'all' || 
    filters.status !== 'all' || 
    filters.role !== 'all';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users by name, email, or GP51 username..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Select value={filters.source} onValueChange={handleSourceChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="gp51">GP51 Imported</SelectItem>
              <SelectItem value="envio">Envio Registered</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="needs_password">Needs Password</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>
            Showing {filteredCount} of {userCount} users
          </span>
        </div>
        {hasActiveFilters && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            <Filter className="h-3 w-3 mr-1" />
            Filtered
          </Badge>
        )}
      </div>
    </div>
  );
};

export default UserFilters;
