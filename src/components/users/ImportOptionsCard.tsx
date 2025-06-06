
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Database } from 'lucide-react';

interface ImportOptionsCardProps {
  onImportUsers: () => void;
  onFullImport: () => void;
}

const ImportOptionsCard: React.FC<ImportOptionsCardProps> = ({
  onImportUsers,
  onFullImport
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Import Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={onImportUsers}
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">User Import</h3>
              <Badge variant="outline">Standard</Badge>
            </div>
            <p className="text-sm text-gray-600">
              Import users from GP51 platform with passwordless authentication setup
            </p>
          </div>
          
          <div 
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={onFullImport}
          >
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Full System Import</h3>
              <Badge variant="default">Enhanced</Badge>
            </div>
            <p className="text-sm text-gray-600">
              Comprehensive import with data cleanup, backup, and rollback capabilities
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportOptionsCard;
