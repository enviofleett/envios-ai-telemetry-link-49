
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Mail, Lock } from 'lucide-react';

const WorkshopLogin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, we'll use a simplified login check
      // In production, this would integrate with proper authentication
      const { data: workshopUser, error } = await supabase
        .from('workshop_users')
        .select(`
          *,
          workshop:workshops(*)
        `)
        .eq('email', formData.email)
        .eq('is_active', true)
        .single();

      if (error || !workshopUser) {
        throw new Error('Invalid credentials or inactive account');
      }

      if (!workshopUser.workshop.is_active || !workshopUser.workshop.verified) {
        throw new Error('Workshop is not yet approved. Please wait for admin approval.');
      }

      // Store workshop session (simplified)
      localStorage.setItem('workshop_session', JSON.stringify({
        user: workshopUser,
        workshop: workshopUser.workshop
      }));

      toast({
        title: "Login Successful",
        description: `Welcome to ${workshopUser.workshop.name}!`
      });

      navigate('/workshop-dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Workshop Login</CardTitle>
          <CardDescription>
            Access your workshop management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/workshop-signup" className="text-primary hover:underline">
                  Register your workshop
                </Link>
              </p>
              <Link to="/" className="text-sm text-muted-foreground hover:underline">
                Back to main site
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkshopLogin;
