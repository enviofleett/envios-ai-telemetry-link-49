
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Users,
  Car,
  Zap
} from 'lucide-react';
import { useEnhancedCSVImport } from '@/hooks/useEnhancedCSVImport';
import EnhancedCSVImportPreview from './EnhancedCSVImportPreview';

const EnhancedCSVImportManager: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobName, setJobName] = useState('');
  const [gp51SyncEnabled, setGp51SyncEnabled] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const {
    previewData,
    isLoading,
    isProcessing,
    validateEnhancedCSV,
    createEnhancedImportJob,
    downloadEnhancedTemplate,
    setPreviewData
  } = useEnhancedCSVImport();

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
    setJobName(file.name.replace('.csv', '') + '_enhanced_import_' + new Date().toISOString().slice(0, 10));
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
      await validateEnhancedCSV(selectedFile);
      setActiveTab('preview');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile || !previewData) return;
    
    try {
      await createEnhancedImportJob(
        jobName, 
        selectedFile.name, 
        previewData.summary.total_rows,
        gp51SyncEnabled
      );
      
      setSelectedFile(null);
      setJobName('');
      setPreviewData(null);
      setActiveTab('jobs');
    } catch (error) {
      console.error('Failed to start enhanced import:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Enhanced User-Vehicle CSV Import
          </h2>
          <p className="text-sm text-muted-foreground">
            Import users and vehicles together with GP51 conformity and automatic validation
          </p>
        </div>
        <Button onClick={downloadEnhancedTemplate} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Enhanced Template
        </Button>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">User Management</span>
            </div>
            <p className="text-sm text-blue-700">
              Create users with auto-generated GP51 usernames and email validation
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Vehicle Assignment</span>
            </div>
            <p className="text-sm text-green-700">
              Automatically assign vehicles to users with relationship tracking
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">GP51 Sync</span>
            </div>
            <p className="text-sm text-purple-700">
              Real-time synchronization with GP51 API and conflict resolution
            </p>
          </CardContent>
        </Card>
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
                Enhanced File Upload
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
                  Drag and drop your enhanced CSV file here
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Supports user-vehicle combined imports with GP51 conformity
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

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="gp51-sync"
                      checked={gp51SyncEnabled}
                      onCheckedChange={setGp51SyncEnabled}
                    />
                    <Label htmlFor="gp51-sync" className="text-sm">
                      Enable GP51 synchronization
                    </Label>
                  </div>

                  <Button 
                    onClick={handleValidateFile}
                    disabled={!jobName || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Validating with GP51 conformity...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Validate Enhanced File
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
            <EnhancedCSVImportPreview 
              previewData={previewData}
              onStartImport={handleStartImport}
              isProcessing={isProcessing}
              gp51SyncEnabled={gp51SyncEnabled}
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
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Enhanced import history and GP51 sync monitoring coming soon...
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedCSVImportManager;
