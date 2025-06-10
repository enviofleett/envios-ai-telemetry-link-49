
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Mail, Lock, Building } from 'lucide-react';
import { useWorkshopAuth } from '@/hooks/useWorkshopAuth';
import { useWorkshops } from '@/hooks/useWorkshops';

interface WorkshopLoginFormProps {
  onSuccess?: () => void;
}

const WorkshopLoginForm: React.FC<WorkshopLoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const { login, isLoggingIn } = useWorkshopAuth();
  const { workshops } = useWorkshops();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      email,
      password,
      workshop_id: selectedWorkshopId
    });
    
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Wrench className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Workshop Login</CardTitle>
        <CardDescription>
          Sign in to your workshop management account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workshop">Workshop</Label>
            <Select value={selectedWorkshopId} onValueChange={setSelectedWorkshopId}>
              <SelectTrigger id="workshop">
                <Building className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select your workshop" />
              </SelectTrigger>
              <SelectContent>
                {workshops?.map((workshop) => (
                  <SelectItem key={workshop.id} value={workshop.id}>
                    {workshop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoggingIn || !selectedWorkshopId}
          >
            {isLoggingIn ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkshopLoginForm;
