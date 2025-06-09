
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { useCSVImport } from '@/hooks/useCSVImport';
import CSVImportPreview from './CSVImportPreview';
import CSVImportJobsList from './CSVImportJobsList';

const CSVVehicleImportManager: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobName, setJobName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const {
    importJobs,
    previewData,
    isLoading,
    isProcessing,
    loadImportJobs,
    validateCSV,
    createImportJob,
    downloadTemplate,
    setPreviewData
  } = useCSVImport();

  useEffect(() => {
    loadImportJobs();
  }, [loadImportJobs]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    
    setSelectedFile(file);
    setJobName(file.name.replace('.csv', '') + '_import_' + new Date().toISOString().slice(0, 10));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleValidateFile = async () => {
    if (!selectedFile) return;
    
    try {
      await validateCSV(selectedFile);
      setActiveTab('preview');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile || !previewData) return;
    
    try {
      await createImportJob(jobName, selectedFile.name, previewData.summary.total_rows);
      setSelectedFile(null);
      setJobName('');
      setPreviewData(null);
      setActiveTab('jobs');
      loadImportJobs();
    } catch (error) {
      console.error('Failed to start import:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CSV Vehicle Import</h2>
          <p className="text-sm text-muted-foreground">
            Import vehicle data from CSV files with validation and conflict resolution
          </p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload & Validate</TabsTrigger>
          <TabsTrigger value="preview">Preview & Import</TabsTrigger>
          <TabsTrigger value="jobs">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                File Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  or click to browse files
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="max-w-xs mx-auto"
                />
              </div>

              {selectedFile && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-gray-600">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobName">Import Job Name</Label>
                    <Input
                      id="jobName"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      placeholder="Enter job name"
                    />
                  </div>

                  <Button 
                    onClick={handleValidateFile}
                    disabled={!jobName || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Validate File
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          {previewData ? (
            <CSVImportPreview 
              previewData={previewData}
              onStartImport={handleStartImport}
              isProcessing={isProcessing}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">No preview data available. Please upload and validate a CSV file first.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobs">
          <CSVImportJobsList 
            jobs={importJobs}
            isLoading={isLoading}
            onRefresh={loadImportJobs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSVVehicleImportManager;
