
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

const ImportUsersDialog: React.FC<ImportUsersDialogProps> = ({ open, onOpenChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['name', 'email'];
    
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      row.rowNumber = index + 2; // +2 because we start from line 2 (after header)
      return row;
    });

    return data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const data = parseCSV(csvText);
        setCsvData(data);
        toast({
          title: 'CSV parsed successfully',
          description: `Found ${data.length} user records`
        });
      } catch (error: any) {
        toast({
          title: 'CSV parsing error',
          description: error.message,
          variant: 'destructive'
        });
        setFile(null);
        setCsvData([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const importUsersMutation = useMutation({
    mutationFn: async (userData: any[]) => {
      const result: ImportResult = {
        total: userData.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      setImporting(true);
      setProgress(0);

      for (let i = 0; i < userData.length; i++) {
        const user = userData[i];
        setProgress((i / userData.length) * 100);

        try {
          // Validate user data
          if (!user.name || !user.email) {
            throw new Error(`Row ${user.rowNumber}: Name and email are required`);
          }

          if (!/\S+@\S+\.\S+/.test(user.email)) {
            throw new Error(`Row ${user.rowNumber}: Invalid email format`);
          }

          // Create user
          const { data: envioUser, error: envioError } = await supabase.functions.invoke('user-management', {
            body: {
              name: user.name.trim(),
              email: user.email.trim(),
              phone_number: user.phone_number?.trim() || ''
            }
          });

          if (envioError) throw envioError;

          // Set role if provided
          if (user.role && ['user', 'admin'].includes(user.role.toLowerCase())) {
            await supabase.functions.invoke(`user-management/${envioUser.user.id}/role`, {
              body: { role: user.role.toLowerCase() }
            });
          }

          // Update with additional fields if provided
          const updateData: any = {};
          if (user.gp51_username) updateData.gp51_username = user.gp51_username.trim();
          if (user.gp51_user_type && [1, 2, 3, 4].includes(parseInt(user.gp51_user_type))) {
            updateData.gp51_user_type = parseInt(user.gp51_user_type);
          }

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from('envio_users')
              .update(updateData)
              .eq('id', envioUser.user.id);
          }

          result.successful++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(error.message);
          console.error(`Import error for user ${user.name}:`, error);
        }
      }

      setProgress(100);
      return result;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['users-enhanced'] });
      toast({
        title: 'Import completed',
        description: `${result.successful} users imported successfully, ${result.failed} failed`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setImporting(false);
    }
  });

  const handleImport = () => {
    if (csvData.length === 0) return;
    importUsersMutation.mutate(csvData);
  };

  const handleReset = () => {
    setFile(null);
    setCsvData([]);
    setImportResult(null);
    setProgress(0);
  };

  const downloadTemplate = () => {
    const template = `name,email,phone_number,role,gp51_username,gp51_user_type
John Doe,john@example.com,+1234567890,user,johndoe,3
Jane Smith,jane@example.com,+1234567891,admin,janesmith,2`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-import-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Users from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-medium">Need a template?</h3>
              <p className="text-sm text-gray-600">Download a CSV template with the correct format</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <FileText className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
            />
          </div>

          {/* File Info */}
          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>{file.name}</strong> - {csvData.length} user records found
              </AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing users...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Import completed: {importResult.successful} successful, {importResult.failed} failed
                </AlertDescription>
              </Alert>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Import Errors:</div>
                      <div className="max-h-32 overflow-y-auto text-sm">
                        {importResult.errors.slice(0, 10).map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                        {importResult.errors.length > 10 && (
                          <div>... and {importResult.errors.length - 10} more errors</div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Required Fields Info */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Required fields:</strong> name, email<br />
            <strong>Optional fields:</strong> phone_number, role (user/admin), gp51_username, gp51_user_type (1-4)
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={importResult ? handleReset : () => onOpenChange(false)}
            className="flex-1"
            disabled={importing}
          >
            {importResult ? 'Reset' : 'Cancel'}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={csvData.length === 0 || importing}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import {csvData.length} Users
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportUsersDialog;
