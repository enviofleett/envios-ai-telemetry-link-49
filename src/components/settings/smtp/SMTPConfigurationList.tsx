
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SMTPConfigurationListProps {
  smtpConfigs: any[];
  onLoadConfig: (config: any) => void;
}

const SMTPConfigurationList: React.FC<SMTPConfigurationListProps> = ({
  smtpConfigs,
  onLoadConfig
}) => {
  if (!smtpConfigs || smtpConfigs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Configurations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {smtpConfigs.map((config: any) => (
            <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{config.name}</h4>
                  {config.is_active && <Badge variant="default">Active</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{config.host}:{config.port}</p>
                <p className="text-sm text-muted-foreground">{config.from_email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadConfig(config)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SMTPConfigurationList;
