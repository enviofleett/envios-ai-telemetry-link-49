
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, MapPin, Car } from 'lucide-react';
import type { GP51Group } from '@/types/gp51-unified';

interface GroupGridProps {
  groups: GP51Group[];
  loading: boolean;
  onRefresh: () => void;
}

const GroupGrid: React.FC<GroupGridProps> = ({ groups, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = groups.filter(group => {
    const groupName = group.groupname || group.group_name || '';
    const remark = group.remark || '';
    return (
      groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remark.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return 'Never';
    
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  const getGroupName = (group: GP51Group): string => {
    return group.groupname || group.group_name || '';
  };

  const getGroupId = (group: GP51Group): number => {
    // Fix: Ensure we always return a number
    const id = group.groupid || group.group_id || group.id || 0;
    return typeof id === 'string' ? parseInt(id, 10) || 0 : id;
  };

  const getDeviceCount = (group: GP51Group): number => {
    return group.devices?.length || group.device_count || group.devicecount || 0;
  };

  const getLastSyncAt = (group: GP51Group): string => {
    return group.last_sync_at || new Date().toISOString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Device Groups ({filteredGroups.length})
            </CardTitle>
            <CardDescription>
              Organize and manage device groups
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            {loading ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading groups...
              </div>
            ) : searchTerm ? (
              `No groups found matching "${searchTerm}"`
            ) : (
              'No groups available. Try importing data from GP51.'
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group) => {
              const groupName = getGroupName(group);
              const groupId = getGroupId(group);
              const deviceCount = getDeviceCount(group);
              const lastSyncAt = getLastSyncAt(group);
              
              return (
                <Card key={groupId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{groupName}</CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {deviceCount}
                      </Badge>
                    </div>
                    {group.remark && (
                      <CardDescription className="line-clamp-2">
                        {group.remark}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Group ID:</span>
                        <span className="font-mono">{groupId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Sync:</span>
                        <span>{formatDate(lastSyncAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupGrid;
