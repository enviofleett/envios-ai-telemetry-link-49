
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Eye, RotateCcw, Search, Filter, TrendingUp, Users, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportJob {
  id: string;
  jobName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  importType: 'manual' | 'gp51_import' | 'bulk_upload' | 'system_import';
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  errorLog?: string[];
  duration?: number;
}

const MOCK_IMPORT_JOBS: ImportJob[] = [
  {
    id: '1',
    jobName: 'GP51 Full System Import',
    status: 'completed',
    importType: 'gp51_import',
    totalRecords: 150,
    processedRecords: 150,
    successfulRecords: 147,
    failedRecords: 3,
    createdAt: '2024-01-20T10:30:00Z',
    completedAt: '2024-01-20T10:45:00Z',
    createdBy: 'Admin User',
    duration: 15,
    errorLog: ['User "test123" already exists', 'Invalid vehicle data for device ABC123']
  },
  {
    id: '2',
    jobName: 'Manual User Import',
    status: 'running',
    importType: 'manual',
    totalRecords: 50,
    processedRecords: 30,
    successfulRecords: 28,
    failedRecords: 2,
    createdAt: '2024-01-21T14:15:00Z',
    createdBy: 'Admin User'
  },
  {
    id: '3',
    jobName: 'Bulk Upload CSV',
    status: 'failed',
    importType: 'bulk_upload',
    totalRecords: 200,
    processedRecords: 45,
    successfulRecords: 0,
    failedRecords: 45,
    createdAt: '2024-01-19T09:00:00Z',
    completedAt: '2024-01-19T09:05:00Z',
    createdBy: 'Admin User',
    duration: 5,
    errorLog: ['Invalid CSV format', 'Missing required columns']
  }
];

const ImportHistoryTab: React.FC = () => {
  const [jobs, setJobs] = useState<ImportJob[]>(MOCK_IMPORT_JOBS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesType = typeFilter === 'all' || job.importType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'manual': return 'Manual Import';
      case 'gp51_import': return 'GP51 Import';
      case 'bulk_upload': return 'Bulk Upload';
      case 'system_import': return 'System Import';
      default: return type;
    }
  };

  const calculateProgress = (job: ImportJob) => {
    if (job.totalRecords === 0) return 0;
    return (job.processedRecords / job.totalRecords) * 100;
  };

  const calculateSuccessRate = (job: ImportJob) => {
    if (job.processedRecords === 0) return 0;
    return (job.successfulRecords / job.processedRecords) * 100;
  };

  const handleRetryImport = (jobId: string) => {
    toast({
      title: 'Import Retry',
      description: 'Import job has been queued for retry'
    });
  };

  const handleDownloadLog = (jobId: string) => {
    toast({
      title: 'Download Started',
      description: 'Import log download has started'
    });
  };

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const runningJobs = jobs.filter(j => j.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedJobs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedJobs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{runningJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by job name or created by..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manual">Manual Import</SelectItem>
                <SelectItem value="gp51_import">GP51 Import</SelectItem>
                <SelectItem value="bulk_upload">Bulk Upload</SelectItem>
                <SelectItem value="system_import">System Import</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.jobName}</TableCell>
                  <TableCell>{getTypeLabel(job.importType)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-20">
                      <Progress value={calculateProgress(job)} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">
                        {job.processedRecords}/{job.totalRecords}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {calculateSuccessRate(job).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {job.successfulRecords} success, {job.failedRecords} failed
                    </div>
                  </TableCell>
                  <TableCell>{job.totalRecords}</TableCell>
                  <TableCell>
                    {job.duration ? `${job.duration}m` : job.status === 'running' ? 'Running...' : '-'}
                  </TableCell>
                  <TableCell>{job.createdBy}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleDownloadLog(job.id)}>
                        <Download className="w-3 h-3" />
                      </Button>
                      {job.status === 'failed' && (
                        <Button size="sm" variant="outline" onClick={() => handleRetryImport(job.id)}>
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportHistoryTab;
