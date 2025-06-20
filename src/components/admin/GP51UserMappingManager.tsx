import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  Database
} from 'lucide-react';
import { GP51UserMappingService, GP51UserMapping } from '@/services/gp51UserMapping';
import { supabase } from '@/integrations/supabase/client';

const GP51UserMappingManager: React.FC = () => {
  const [mappings, setMappings] = useState<GP51UserMapping[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { data: envioUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', currentUser.user.email)
        .single();

      if (envioUser) {
        const userMappings = await GP51UserMappingService.getUserMappings(envioUser.id);
        setMappings(userMappings);
      }
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast({
        title: "Error",
        description: "Failed to load GP51 user mappings",
        variant: "destructive"
      });
    }
  };

  const handleAddMapping = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a GP51 username",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { data: envioUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', currentUser.user.email)
        .single();

      if (envioUser) {
        await GP51UserMappingService.createMapping(envioUser.id, newUsername.trim());
        setNewUsername('');
        await loadMappings();
        toast({
          title: "Success",
          description: "GP51 username mapping created successfully"
        });
      }
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast({
        title: "Error",
        description: "Failed to create GP51 username mapping",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMapping = async (mappingId: string) => {
    try {
      await GP51UserMappingService.verifyMapping(mappingId);
      await loadMappings();
      toast({
        title: "Success",
        description: "GP51 username mapping verified successfully"
      });
    } catch (error) {
      console.error('Error verifying mapping:', error);
      toast({
        title: "Error",
        description: "Failed to verify GP51 username mapping",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    try {
      await GP51UserMappingService.deleteMapping(mappingId);
      await loadMappings();
      toast({
        title: "Success",
        description: "GP51 username mapping deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({
        title: "Error",
        description: "Failed to delete GP51 username mapping",
        variant: "destructive"
      });
    }
  };

  const handleMigrateExistingUsers = async () => {
    setIsMigrating(true);
    try {
      await GP51UserMappingService.migrateExistingUsers();
      await loadMappings();
      toast({
        title: "Migration Complete",
        description: "Successfully migrated existing GP51 user mappings"
      });
    } catch (error) {
      console.error('Error migrating users:', error);
      toast({
        title: "Migration Failed",
        description: "Failed to migrate existing GP51 user mappings",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          GP51 User Account Mapping
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Link your GP51 usernames to access vehicle data. Supports text usernames, 
            email addresses, and phone numbers as GP51 credentials.
          </AlertDescription>
        </Alert>

        {/* Add New Mapping */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="gp51-username">GP51 Username</Label>
              <Input
                id="gp51-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter GP51 username, email, or phone"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddMapping}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isLoading ? 'Adding...' : 'Add Mapping'}
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleMigrateExistingUsers}
            disabled={isMigrating}
          >
            <Database className="h-4 w-4 mr-2" />
            {isMigrating ? 'Migrating...' : 'Migrate Existing GP51 Users'}
          </Button>
        </div>

        {/* Existing Mappings */}
        <div className="space-y-3">
          <h4 className="font-medium">Current GP51 Username Mappings</h4>
          {mappings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No GP51 username mappings found. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{mapping.gp51_username}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {mapping.mapping_type} | User Type: {mapping.gp51_user_type}
                      </p>
                    </div>
                    <Badge variant={mapping.is_verified ? "default" : "secondary"}>
                      {mapping.is_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {!mapping.is_verified && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyMapping(mapping.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMapping(mapping.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Usage Guide:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Add any GP51 username format: text, email, or phone number</li>
            <li>Verify mappings to confirm they work with GP51 authentication</li>
            <li>Use "Migrate Existing" to automatically import from old system</li>
            <li>Multiple mappings allow access to different GP51 accounts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51UserMappingManager;
