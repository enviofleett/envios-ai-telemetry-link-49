
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FilterState } from '@/types/vehicle';

export interface LiveTrackingFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  userOptions: { id: string; name: string; email: string; }[];
}

export const LiveTrackingFilters: React.FC<LiveTrackingFiltersProps> = ({
  filters,
  setFilters,
  userOptions
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="search">Search Vehicles</Label>
          <Input
            id="search"
            placeholder="Search by name or device ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={filters.status} 
            onValueChange={(value) => setFilters({ ...filters, status: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="user">Assigned User</Label>
          <Select 
            value={filters.user} 
            onValueChange={(value) => setFilters({ ...filters, user: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {userOptions.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTrackingFilters;
