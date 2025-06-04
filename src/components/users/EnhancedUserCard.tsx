
import React from 'react';
import { User, Mail, Calendar, Link2, Edit, Trash2, Shield, UserCheck, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnhancedUserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    needs_password_set?: boolean;
    is_gp51_imported?: boolean;
    import_source?: string;
    user_roles?: Array<{ role: string }>;
    gp51_sessions?: Array<{
      id: string;
      username: string;
      created_at: string;
      token_expires_at: string;
    }>;
  };
  vehicleCount: number;
  isCurrentUser: boolean;
  onEdit: (user: any) => void;
  onEditRole: (user: any) => void;
  onDelete: (userId: string) => void;
}

const EnhancedUserCard: React.FC<EnhancedUserCardProps> = ({
  user,
  vehicleCount,
  isCurrentUser,
  onEdit,
  onEditRole,
  onDelete
}) => {
  const getUserRole = () => {
    return user.user_roles?.[0]?.role || 'user';
  };

  const getSourceBadge = () => {
    if (user.is_gp51_imported) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
          GP51 Imported
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
        Envio Registered
      </Badge>
    );
  };

  const getStatusBadge = () => {
    if (user.needs_password_set) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
          <Key className="h-3 w-3 mr-1" />
          Needs Password Set
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
        Active
      </Badge>
    );
  };

  const isSessionActive = (session: any) => {
    return new Date(session.token_expires_at) > new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const userRole = getUserRole();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                {user.name}
                {userRole === 'admin' && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(user)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditRole(user)}
              className="h-8 w-8 p-0"
            >
              <UserCheck className="h-4 w-4" />
            </Button>
            {!isCurrentUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(user.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Source and Status Badges */}
        <div className="flex flex-wrap gap-2">
          {getSourceBadge()}
          {getStatusBadge()}
        </div>

        {/* User Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-3 w-3" />
            Created: {formatDate(user.created_at)}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600">Associated Vehicles: </span>
            <span className="font-medium text-gray-900">{vehicleCount}</span>
          </div>
        </div>
        
        {/* GP51 Connections */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">GP51 Connections:</span>
          </div>
          {user.gp51_sessions && user.gp51_sessions.length > 0 ? (
            <div className="space-y-1 pl-6">
              {user.gp51_sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{session.username}</span>
                  <Badge 
                    variant={isSessionActive(session) ? 'default' : 'secondary'}
                    className={isSessionActive(session) 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                    }
                  >
                    {isSessionActive(session) ? 'Active' : 'Expired'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 pl-6">No GP51 connections</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedUserCard;
