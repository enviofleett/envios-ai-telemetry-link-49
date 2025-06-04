
import React from 'react';
import { Users, UserPlus, Shield, Key } from 'lucide-react';

interface UserStatisticsProps {
  statistics: {
    total: number;
    gp51Imported: number;
    envioRegistered: number;
    needsPassword: number;
    admins: number;
  };
}

const UserStatistics: React.FC<UserStatisticsProps> = ({ statistics }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="text-2xl font-bold text-blue-900">{statistics.total}</div>
        <div className="text-sm text-blue-700">Total Users</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="text-2xl font-bold text-purple-900">{statistics.gp51Imported}</div>
        <div className="text-sm text-purple-700">GP51 Imported</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="text-2xl font-bold text-green-900">{statistics.envioRegistered}</div>
        <div className="text-sm text-green-700">Envio Registered</div>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="text-2xl font-bold text-yellow-900">{statistics.needsPassword}</div>
        <div className="text-sm text-yellow-700">Need Password</div>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <div className="text-2xl font-bold text-orange-900">{statistics.admins}</div>
        <div className="text-sm text-orange-700">Administrators</div>
      </div>
    </div>
  );
};

export default UserStatistics;
