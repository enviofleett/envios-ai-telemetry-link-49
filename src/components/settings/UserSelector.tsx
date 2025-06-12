
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User } from 'lucide-react';
import { fetchSelectableUsers, SelectableUser } from '@/services/user-selection-api';
import { useToast } from '@/hooks/use-toast';

interface UserSelectorProps {
  selectedUserId?: string;
  onUserSelect: (userId: string | undefined) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUserId,
  onUserSelect
}) => {
  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const fetchedUsers = await fetchSelectableUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [toast]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Select User to Manage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user-search">Search Users</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="user-search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-select">User</Label>
          <Select
            value={selectedUserId || ""}
            onValueChange={(value) => onUserSelect(value || undefined)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a user to manage their branding..." />
            </SelectTrigger>
            <SelectContent>
              {filteredUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {user.registration_status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUser && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium">Selected User</h4>
            <p className="text-sm text-muted-foreground">{selectedUser.name} - {selectedUser.email}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSelector;
