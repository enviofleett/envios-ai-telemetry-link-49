
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Play, Copy } from 'lucide-react';
import { GPS51PasswordService } from '@/services/gp51/GPS51PasswordService';
import { useToast } from '@/hooks/use-toast';

const GPS51MD5TestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [customInput, setCustomInput] = useState('');
  const [customResult, setCustomResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    runTests();
  }, []);

  const runTests = () => {
    const results = GPS51PasswordService.runAllTests();
    setTestResults(results);
  };

  const testCustomInput = () => {
    if (!customInput.trim()) return;
    
    const result = GPS51PasswordService.createPasswordHash(customInput);
    setCustomResult({
      input: customInput,
      hash: result.hash,
      isValid: result.isValid,
      error: result.error
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Hash copied successfully",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Results Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              MD5 Implementation Tests
              {testResults && (
                <Badge variant={testResults.summary.passed ? "default" : "destructive"}>
                  {testResults.summary.message}
                </Badge>
              )}
            </CardTitle>
            <Button
              onClick={runTests}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Re-run Tests
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {testResults && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {testResults.summary.passCount}
                  </div>
                  <div className="text-sm text-gray-400">Tests Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {testResults.summary.totalCount}
                  </div>
                  <div className="text-sm text-gray-400">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">32</div>
                  <div className="text-sm text-gray-400">Hash Length</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {testResults.summary.passed ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-400">Status</div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-3">
                <h4 className="font-medium text-white">Test Cases</h4>
                {testResults.results.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.isMatch 
                        ? 'bg-green-900/20 border-green-700' 
                        : 'bg-red-900/20 border-red-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.isMatch ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <span className="font-medium text-white">
                          {result.description}
                        </span>
                      </div>
                      <Badge variant={result.isMatch ? "default" : "destructive"}>
                        {result.isMatch ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Input:</div>
                        <div className="font-mono bg-gray-700 p-2 rounded text-gray-300">
                          "{result.input}"
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Expected:</div>
                        <div className="font-mono bg-gray-700 p-2 rounded text-gray-300 break-all">
                          {result.expected}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-gray-400">Actual:</div>
                      <div className="font-mono bg-gray-700 p-2 rounded text-gray-300 break-all flex items-center justify-between">
                        <span>{result.actualHash}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result.actualHash)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Test Input */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Custom MD5 Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="custom-input" className="text-gray-300">
                Test Input
              </Label>
              <Input
                id="custom-input"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter text to hash"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    testCustomInput();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={testCustomInput}
                disabled={!customInput.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
          </div>

          {customResult && (
            <div className="space-y-2">
              <div className="text-gray-400 text-sm">Result:</div>
              <div className="font-mono bg-gray-700 p-3 rounded text-gray-300 break-all flex items-center justify-between">
                <span>{customResult.hash || 'Error generating hash'}</span>
                {customResult.hash && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(customResult.hash)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {customResult.error && (
                <div className="text-red-400 text-sm">
                  Error: {customResult.error}
                </div>
              )}
              <div className="text-gray-400 text-xs">
                Length: {customResult.hash?.length || 0} characters
                {customResult.hash && customResult.hash.length === 32 && (
                  <span className="text-green-400 ml-2">✓ Valid length</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51MD5TestPanel;
