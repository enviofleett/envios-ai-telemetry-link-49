
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import GP51ConnectionInfo from './AdminSettings/GP51ConnectionInfo';
import GP51CredentialsForm from './AdminSettings/GP51CredentialsForm';

const AdminSettings = () => {
  const { data: gp51Status, isLoading: statusLoading } = useQuery({
    queryKey: ['gp51-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          GP51 LIVE Platform Connection
          <Badge variant="outline" className="text-xs">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GP51ConnectionInfo 
          gp51Status={gp51Status} 
          statusLoading={statusLoading}
        />
        <GP51CredentialsForm />
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
