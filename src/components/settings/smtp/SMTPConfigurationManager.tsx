
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Settings, AlertTriangle, CheckCircle } from 'lucide-react';

interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  sender_email: string;
  sender_name: string;
  encryption_type: string;
  is_active: boolean;
  created_at: string;
}

interface SMTPConfigurationManagerProps {
  configs: SMTPConfig[];
  onEdit: (config: SMTPConfig) => void;
  onDelete: (configId: string) => void;
  onToggleActive: (configId: string, isActive: boolean) => void;
  isLoading?: boolean;
}

const SMTPConfigurationManager: React.FC<SMTPConfigurationManagerProps> = ({
  configs,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading = false
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (configId: string) => {
    setDeletingId(configId);
    try {
      await onDelete(configId);
    } finally {
      setDeletingId(null);
    }
  };

  const getEncryptionBadge = (encryptionType: string) => {
    const colors = {
      'starttls': 'bg-green-100 text-green-800',
      'tls': 'bg-blue-100 text-blue-800',
      'ssl': 'bg-purple-100 text-purple-800',
      'none': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="outline" className={colors[encryptionType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {encryptionType.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SMTP Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading configurations...</div>
        </CardContent>
      </Card>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SMTP Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No SMTP configurations found. Create your first configuration above to start sending emails.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const activeConfig = configs.find(config => config.is_active);
  const inactiveConfigs = configs.filter(config => !config.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          SMTP Configurations
          <Badge variant="outline">{configs.length} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Configuration */}
        {activeConfig && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <h4 className="font-medium">Active Configuration</h4>
            </div>
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">{activeConfig.name}</h5>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activeConfig.host}:{activeConfig.port} • {activeConfig.sender_email}
                  </p>
                  <div className="flex items-center gap-2">
                    {getEncryptionBadge(activeConfig.encryption_type)}
                    <span className="text-xs text-muted-foreground">
                      Created: {new Date(activeConfig.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(activeConfig)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleActive(activeConfig.id, false)}
                  >
                    Deactivate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inactive Configurations */}
        {inactiveConfigs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Inactive Configurations</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Encryption</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveConfigs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{config.host}:{config.port}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getEncryptionBadge(config.encryption_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{config.sender_name}</div>
                        <div className="text-muted-foreground">{config.sender_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleActive(config.id, true)}
                        >
                          Activate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                          disabled={deletingId === config.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SMTPConfigurationManager;
