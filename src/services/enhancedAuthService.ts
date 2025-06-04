
import { supabase } from '@/integrations/supabase/client';
import { telemetryApi } from '@/services/telemetryApi';

interface AuthFlowStep {
  step: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  error?: string;
  data?: any;
}

interface AuthValidationResult {
  success: boolean;
  steps: AuthFlowStep[];
  finalState: {
    supabaseAuthenticated: boolean;
    gp51Connected: boolean;
    userProfile: any;
    sessionValid: boolean;
  };
}

export class EnhancedAuthService {
  private authSteps: AuthFlowStep[] = [];

  private logStep(step: string, status: 'pending' | 'success' | 'error', error?: string, data?: any): void {
    const stepData: AuthFlowStep = {
      step,
      status,
      timestamp: new Date(),
      error,
      data
    };
    
    this.authSteps.push(stepData);
    console.log(`Auth Step [${status.toUpperCase()}]: ${step}`, { error, data });
  }

  public async validateCompleteAuthFlow(email: string, password: string): Promise<AuthValidationResult> {
    this.authSteps = [];
    
    try {
      // Step 1: Supabase Authentication
      this.logStep('Supabase Login', 'pending');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        this.logStep('Supabase Login', 'error', authError.message);
        return this.buildResult(false);
      }

      this.logStep('Supabase Login', 'success', undefined, { userId: authData.user?.id });

      // Step 2: User Profile Retrieval
      this.logStep('User Profile Fetch', 'pending');
      
      const { data: profile, error: profileError } = await supabase
        .from('envio_users')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) {
        this.logStep('User Profile Fetch', 'error', profileError.message);
      } else {
        this.logStep('User Profile Fetch', 'success', undefined, { profile });
      }

      // Step 3: GP51 Connection Validation (if user has GP51 credentials)
      this.logStep('GP51 Connection Check', 'pending');
      
      if (profile?.gp51_username) {
        try {
          const gp51Status = await telemetryApi.getGP51Status();
          if (gp51Status.connected) {
            this.logStep('GP51 Connection Check', 'success', undefined, gp51Status);
          } else {
            this.logStep('GP51 Connection Check', 'error', gp51Status.error || 'Not connected');
          }
        } catch (error) {
          this.logStep('GP51 Connection Check', 'error', error instanceof Error ? error.message : 'GP51 check failed');
        }
      } else {
        this.logStep('GP51 Connection Check', 'success', undefined, { message: 'No GP51 credentials found' });
      }

      // Step 4: Session Validation
      this.logStep('Session Validation', 'pending');
      
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        this.logStep('Session Validation', 'success', undefined, { 
          expiresAt: session.session.expires_at,
          refreshToken: !!session.session.refresh_token 
        });
      } else {
        this.logStep('Session Validation', 'error', 'No valid session found');
      }

      // Step 5: Database Permissions Test
      this.logStep('Database Permissions Test', 'pending');
      
      try {
        const { data: vehicleCount, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id', { count: 'exact' })
          .limit(1);

        if (vehicleError) {
          this.logStep('Database Permissions Test', 'error', vehicleError.message);
        } else {
          this.logStep('Database Permissions Test', 'success', undefined, { canAccessVehicles: true });
        }
      } catch (error) {
        this.logStep('Database Permissions Test', 'error', error instanceof Error ? error.message : 'DB access failed');
      }

      return this.buildResult(true);

    } catch (error) {
      this.logStep('Authentication Flow', 'error', error instanceof Error ? error.message : 'Unknown error');
      return this.buildResult(false);
    }
  }

  public async validateGP51Integration(username: string, password: string): Promise<AuthValidationResult> {
    this.authSteps = [];

    try {
      // Step 1: GP51 Authentication
      this.logStep('GP51 Authentication', 'pending');
      
      const authResult = await telemetryApi.authenticate(username, password);
      
      if (!authResult.success) {
        this.logStep('GP51 Authentication', 'error', authResult.error);
        return this.buildResult(false);
      }

      this.logStep('GP51 Authentication', 'success', undefined, { 
        sessionId: authResult.sessionId,
        vehicleCount: authResult.vehicles?.length || 0
      });

      // Step 2: Vehicle Data Retrieval
      this.logStep('Vehicle Data Retrieval', 'pending');
      
      const positionsResult = await telemetryApi.getVehiclePositions();
      
      if (!positionsResult.success) {
        this.logStep('Vehicle Data Retrieval', 'error', positionsResult.error);
      } else {
        this.logStep('Vehicle Data Retrieval', 'success', undefined, {
          positionCount: positionsResult.positions?.length || 0
        });
      }

      // Step 3: Credentials Storage
      this.logStep('Credentials Storage', 'pending');
      
      const saveResult = await telemetryApi.saveGP51Credentials(username, password);
      
      if (!saveResult.success) {
        this.logStep('Credentials Storage', 'error', saveResult.error);
      } else {
        this.logStep('Credentials Storage', 'success', undefined, { message: saveResult.message });
      }

      return this.buildResult(true);

    } catch (error) {
      this.logStep('GP51 Integration', 'error', error instanceof Error ? error.message : 'Unknown error');
      return this.buildResult(false);
    }
  }

  private buildResult(success: boolean): AuthValidationResult {
    const finalState = {
      supabaseAuthenticated: this.authSteps.some(s => s.step === 'Supabase Login' && s.status === 'success'),
      gp51Connected: this.authSteps.some(s => s.step === 'GP51 Connection Check' && s.status === 'success'),
      userProfile: this.authSteps.find(s => s.step === 'User Profile Fetch' && s.status === 'success')?.data?.profile,
      sessionValid: this.authSteps.some(s => s.step === 'Session Validation' && s.status === 'success')
    };

    return {
      success,
      steps: [...this.authSteps],
      finalState
    };
  }

  public getAuthSteps(): AuthFlowStep[] {
    return [...this.authSteps];
  }
}

export const enhancedAuthService = new EnhancedAuthService();
