
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  User,
  Database,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { gp51UsernameConsistencyService } from '@/services/gp51UsernameConsistencyService';

interface UsernameAnalysis {
  adminUser: string;
  activeSession: string | null;
  vehicleUsernames: Array<{ username: string; count: number }>;
  inconsistencies: string[];
}

const GP51UsernameConsistencyManager: React.FC = () => {
  const [analysis, setAnalysis] = useState<UsernameAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await gp51UsernameConsistencyService.analyzeUsernameConsistency();
      setAnalysis(result);
      
      if (result.inconsistencies.length === 0) {
        toast({
          title: 'Analysis Complete',
          description: 'No username inconsistencies found!'
        });
      } else {
        toast({
          title: 'Inconsistencies Found',
          description: `Found ${result.inconsistencies.length} issues to resolve`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze usernames',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFix = async () => {
    if (!analysis || !analysis.adminUser) {
      toast({
        title: 'Fix Failed',
        description: 'No admin username available for fixing',
        variant: 'destructive'
      });
      return;
    }

    setIsFixing(true);
    try {
      const result = await gp51UsernameConsistencyService.fixUsernameConsistency(analysis.adminUser);
      
      if (result.success) {
        toast({
          title: 'Fix Successful',
          description: `Updated ${result.vehiclesUpdated} vehicles and ${result.sessionsUpdated} sessions`
        });
        
        // Re-analyze to show updated state
        await handleAnalyze();
      } else {
        toast({
          title: 'Fix Failed',
          description: result.errors.join(', '),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Fix failed:', error);
      toast({
        title: 'Fix Failed',
        description: error instanceof Error ? error.message : 'Failed to fix inconsistencies',
        variant: 'destructive'
      });
    } finally {
      setIsFixing(false);
    }
  };

  const hasInconsistencies = analysis && analysis.inconsistencies.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          GP51 Username Consistency Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || isFixing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Analyze Consistency
          </Button>
          
          {hasInconsistencies && (
            <Button 
              onClick={handleFix} 
              disabled={isFixing || isAnalyzing}
              variant="default"
            >
              <CheckCircle className={`w-4 h-4 mr-2 ${isFixing ? 'animate-spin' : ''}`} />
              Fix Inconsistencies
            </Button>
          )}
        </div>

        {analysis && (
          <div className="space-y-4">
            {/* Current State */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Admin User</span>
                </div>
                <Badge variant="outline">{analysis.adminUser}</Badge>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Active Session</span>
                </div>
                <Badge variant={analysis.activeSession ? "outline" : "destructive"}>
                  {analysis.activeSession || 'None'}
                </Badge>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Vehicle Usernames</span>
                </div>
                <div className="space-y-1">
                  {analysis.vehicleUsernames.map(({ username, count }) => (
                    <div key={username} className="flex justify-between text-sm">
                      <span>{username}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inconsistencies */}
            {hasInconsistencies ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Found {analysis.inconsistencies.length} inconsistencies:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.inconsistencies.map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All GP51 usernames are consistent! No action needed.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!analysis && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Click "Analyze Consistency" to check for GP51 username inconsistencies across vehicles, sessions, and admin users.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51UsernameConsistencyManager;
