
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Copy, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { GPS51PasswordService } from '@/services/gp51/GPS51PasswordService';
import { useToast } from '@/hooks/use-toast';

const GPS51MD5TestPanel: React.FC = () => {
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [allTestResults, setAllTestResults] = useState<any>(null);
  const { toast } = useToast();

  // Run tests on component mount
  useEffect(() => {
    runAllTests();
  }, []);

  const runAllTests = async () => {
    setIsRunningTests(true);
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      const results = GPS51PasswordService.runAllTests();
      setAllTestResults(results);
      
      if (results.summary.passed) {
        toast({
          title: "MD5 Tests Passed",
          description: `All ${results.summary.totalCount} tests passed successfully`,
        });
      } else {
        toast({
          title: "MD5 Tests Failed",
          description: `${results.summary.passCount}/${results.summary.totalCount} tests passed`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test execution error:', error);
      toast({
        title: "Test Error",
        description: "Failed to run MD5 tests",
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const generateHash = () => {
    if (!testInput.trim()) return;
    
    const result = GPS51PasswordService.createPasswordHash(testInput);
    if (result.isValid) {
      setTestOutput(result.hash);
    } else {
      toast({
        title: "Hash Generation Failed",
        description: result.error || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Hash copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const quickTest = (password: string) => {
    setTestInput(password);
    const result = GPS51PasswordService.createPasswordHash(password);
    if (result.isValid) {
      setTestOutput(result.hash);
    }
  };

  const getOverallStatus = () => {
    if (!allTestResults) return { color: 'text-gray-400', icon: TestTube, text: 'Not tested' };
    
    if (allTestResults.summary.passed) {
      return { color: 'text-green-400', icon: CheckCircle, text: 'All tests passed' };
    } else {
      return { color: 'text-red-400', icon: XCircle, text: 'Tests failed' };
    }
  };

  const status = getOverallStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-400" />
            MD5 Testing Panel
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${status.color}`} />
            <span className={`text-sm ${status.color}`}>{status.text}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Results Overview */}
        {allTestResults && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Test Results:</span>
              <div className="flex items-center gap-2">
                <Badge variant={allTestResults.summary.passed ? "default" : "destructive"}>
                  {allTestResults.summary.passCount}/{allTestResults.summary.totalCount}
                </Badge>
                <Button
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {isRunningTests ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            
            <Progress 
              value={allTestResults.summary.passCount / allTestResults.summary.totalCount * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Interactive Hash Generator */}
        <div className="space-y-3">
          <h4 className="font-medium text-white">Interactive Hash Generator</h4>
          <div className="flex gap-2">
            <Input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter password to test"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && generateHash()}
            />
            <Button 
              onClick={generateHash}
              disabled={!testInput.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Hash
            </Button>
          </div>
          
          {testOutput && (
            <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">MD5 Hash:</span>
                <Button
                  onClick={() => copyToClipboard(testOutput)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-300"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="font-mono text-green-400 text-sm break-all">
                {testOutput}
              </div>
            </div>
          )}
        </div>

        {/* Quick Test Cases */}
        <div className="space-y-3">
          <h4 className="font-medium text-white">Quick Test Cases</h4>
          <div className="grid grid-cols-2 gap-2">
            {GPS51PasswordService.getTestCases().map((testCase, index) => (
              <Button
                key={index}
                onClick={() => quickTest(testCase.input)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 justify-start"
              >
                "{testCase.input}"
              </Button>
            ))}
          </div>
        </div>

        {/* Detailed Test Results */}
        {allTestResults && (
          <div className="space-y-3">
            <h4 className="font-medium text-white">Detailed Results</h4>
            <div className="space-y-2">
              {allTestResults.results.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.isMatch 
                      ? 'bg-green-900/20 border-green-700' 
                      : 'bg-red-900/20 border-red-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm text-gray-300">
                      "{result.input}"
                    </span>
                    {result.isMatch ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-gray-400">{result.description}</div>
                    <div className="text-gray-400">
                      Expected: <span className="font-mono text-gray-300">{result.expected}</span>
                    </div>
                    <div className="text-gray-400">
                      Actual: <span className="font-mono text-gray-300">{result.actualHash}</span>
                    </div>
                    {result.error && (
                      <div className="text-red-400">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implementation Notes */}
        <Alert className="bg-blue-900/20 border-blue-700">
          <AlertTriangle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-400">
            <strong>GPS51 Requirements:</strong> MD5 hashes must be 32 lowercase hexadecimal characters. 
            Input passwords are trimmed and encoded as UTF-8 before hashing.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GPS51MD5TestPanel;
