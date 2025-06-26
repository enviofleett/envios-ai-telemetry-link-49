
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { GP51ImportManager } from '@/services/gp51/GP51BulkImportService';
import { Upload, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ImportProgress {
  phase: string;
  message: string;
  progress: number;
  details?: string;
}

const EnhancedBulkImportManager: React.FC = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setImportResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
    }
  };

  const parseCsvFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim());
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            });
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleImport = async () => {
    if (!csvFile) {
      toast({
        title: "No File Selected",
        description: "Please upload a CSV file first",
        variant: "destructive"
      });
      return;
    }

    if (!credentials.username || !credentials.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your GP51 username and password",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({ phase: 'preparing', message: 'Preparing import...', progress: 10 });

    try {
      // Parse CSV file
      setImportProgress({ phase: 'parsing', message: 'Parsing CSV file...', progress: 20 });
      const csvData = await parseCsvFile(csvFile);

      // Initialize import manager
      setImportProgress({ phase: 'authenticating', message: 'Authenticating with GP51...', progress: 30 });
      const importManager = new GP51ImportManager();

      // Run import
      setImportProgress({ phase: 'importing', message: 'Performing bulk import...', progress: 50 });
      const result = await importManager.runImport(csvData, credentials);

      setImportProgress({ phase: 'completing', message: 'Finalizing import...', progress: 90 });
      setImportResult(result);
      setImportProgress({ phase: 'completed', message: 'Import completed!', progress: 100 });

      if (result.success) {
        toast({
          title: "Import Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive"
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setImportResult({
        success: false,
        message: errorMessage,
        results: {
          users: { total: 0, successful: 0, failed: 0, errors: [errorMessage] },
          devices: { total: 0, successful: 0, failed: 0, errors: [errorMessage] }
        }
      });
      
      toast({
        title: "Import Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `username,password,usertype,multilogin,creater,showname,email,phone,deviceid,devicename,devicetype,groupid
user1,password123,11,0,admin,User One,user1@email.com,1234567890,device001,Vehicle 1,92,1
user2,password456,11,0,admin,User Two,user2@email.com,0987654321,device002,Vehicle 2,92,1`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'gp51_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>GP51 Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">GP51 Username</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="Enter your GP51 username"
            />
          </div>
          <div>
            <Label htmlFor="password">GP51 Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Enter your GP51 password"
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Import File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csvFile">Select CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            
            {csvFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                {csvFile.name} loaded
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Import Control</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleImport} 
            disabled={isImporting || !csvFile || !credentials.username || !credentials.password}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Start Bulk Import
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress */}
      {importProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{importProgress.message}</span>
                <span>{importProgress.progress}%</span>
              </div>
              <Progress value={importProgress.progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={importResult.success ? "default" : "destructive"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{importResult.message}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Users Import</h4>
                <div className="text-sm space-y-1">
                  <div>Total: {importResult.results.users.total}</div>
                  <div className="text-green-600">Successful: {importResult.results.users.successful}</div>
                  <div className="text-red-600">Failed: {importResult.results.users.failed}</div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium mb-2">Devices Import</h4>
                <div className="text-sm space-y-1">
                  <div>Total: {importResult.results.devices.total}</div>
                  <div className="text-green-600">Successful: {importResult.results.devices.successful}</div>
                  <div className="text-red-600">Failed: {importResult.results.devices.failed}</div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {(importResult.results.users.errors.length > 0 || importResult.results.devices.errors.length > 0) && (
              <div className="space-y-2">
                <h4 className="font-medium">Errors:</h4>
                <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                  {[...importResult.results.users.errors, ...importResult.results.devices.errors].map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded border text-red-700">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedBulkImportManager;
