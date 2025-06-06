
import React from 'react';
import { Search, Plus, Upload, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserFilters } from '@/types/user-management';

interface UserTableHeaderProps {
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

const UserTableHeader: React.FC<UserTableHeaderProps> = ({
  filters,
  onFiltersChange,
  selectedCount,
  onCreateUser,
  onImportUsers,
  onExport,
  onBulkDelete,
  isBulkDeleting,
  debouncedSearch,
  searchValue
}) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users (min 2 chars)..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        {debouncedSearch !== searchValue && (
          <span className="text-sm text-gray-500">Searching...</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <Button 
            variant="destructive" 
            onClick={onBulkDelete}
            disabled={isBulkDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedCount})
          </Button>
        )}
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button variant="outline" onClick={onImportUsers}>
          <Upload className="h-4 w-4 mr-2" />
          Import Users
        </Button>
        <Button onClick={onCreateUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
    </div>
  );
};

export default UserTableHeader;
