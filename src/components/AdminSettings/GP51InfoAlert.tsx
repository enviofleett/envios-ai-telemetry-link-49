
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const GP51InfoAlert = () => {
  const { data: sessionStatus, isLoading } = useQuery({
    queryKey: ['gp51-session-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: envioUser } = await supabase
        .from('envio_users')
        .select('id, email')
        .eq('email', user.email)
        .single();

      if (!envioUser) return null;

      const { data: sessions } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('envio_user_id', envioUser.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        hasSession: sessions && sessions.length > 0,
        session: sessions?.[0],
        userId: envioUser.id
      };
    },
    refetchInterval: 10000, // Check every 10 seconds
  });

  if (isLoading) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Checking GP51 session status...
        </AlertDescription>
      </Alert>
    );
  }

  if (!sessionStatus) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in to check GP51 session status.
        </AlertDescription>
      </Alert>
    );
  }

  if (sessionStatus.hasSession) {
    const session = sessionStatus.session;
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    const isExpired = expiresAt <= now;
    const hoursUntilExpiry = Math.max(0, (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

    return (
      <Alert>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="space-y-2">
            <div>
              <strong>GP51 Session Status:</strong> {isExpired ? 'Expired' : 'Active'}
            </div>
            <div>
              <strong>Username:</strong> {session.username}
            </div>
            <div>
              <strong>Linked to Account:</strong> ✅ Yes (User ID: {sessionStatus.userId.slice(0, 8)}...)
            </div>
            {!isExpired && (
              <div>
                <strong>Expires in:</strong> {hoursUntilExpiry.toFixed(1)} hours
              </div>
            )}
            {isExpired && (
              <div className="text-amber-600">
                ⚠️ Session has expired. It will be automatically refreshed on next sync attempt.
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertDescription>
        No GP51 session found for your account. Please enter your GP51 credentials above to authenticate and link your session.
      </AlertDescription>
    </Alert>
  );
};

export default GP51InfoAlert;
