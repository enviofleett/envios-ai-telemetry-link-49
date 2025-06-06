
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { UserFilters } from '@/types/user-management';
import { Plus, Import, Download, Trash2, Search } from 'lucide-react';
import AdvancedUserFilters from './AdvancedUserFilters';
import EnhancedBulkOperations from './EnhancedBulkOperations';

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
  const [savedPresets] = useState<Array<{ name: string; filters: UserFilters }>>([
    { name: 'Active Admins', filters: { search: '', role: 'admin' as const, status: 'active' as const } },
    { name: 'GP51 Users', filters: { search: '', gp51Status: 'active' as const } },
    { name: 'Recent Registrations', filters: { search: '', dateRange: { from: '2024-01-01', to: '2024-12-31' } } }
  ]);

  const handleSavePreset = (name: string, filterPreset: UserFilters) => {
    console.log('Saving preset:', name, filterPreset);
    // In a real app, this would save to backend or localStorage
  };

  return (
    <div className="space-y-4">
      {/* Main Header Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchValue}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={onCreateUser}>
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
              <Button variant="outline" onClick={onImportUsers}>
                <Import className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AdvancedUserFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onSavePreset={handleSavePreset}
        savedPresets={savedPresets}
      />

      {/* Enhanced Bulk Operations */}
      <EnhancedBulkOperations
        selectedUserIds={[]} // This would be passed from the parent component
        onBulkDelete={onBulkDelete}
        onDeselectAll={() => {}} // This would be passed from the parent component
      />
    </div>
  );
};

export default UserTableHeader;
