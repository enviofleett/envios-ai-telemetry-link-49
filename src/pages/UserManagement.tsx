
import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const UserManagement: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>User Management System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                User management functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default UserManagement;
