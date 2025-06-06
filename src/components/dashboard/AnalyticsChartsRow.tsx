
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const AnalyticsChartsRow: React.FC = () => {
  const userDistributionData = [
    { month: 'Jan', endUsers: 120, resellers: 45, admins: 15 },
    { month: 'Feb', endUsers: 150, resellers: 55, admins: 18 },
    { month: 'Mar', endUsers: 180, resellers: 65, admins: 22 },
    { month: 'Apr', endUsers: 200, resellers: 70, admins: 25 }
  ];

  const subscriptionData = [
    { name: 'End Users', value: 867, color: '#0f172a' },
    { name: 'Resellers', value: 245, color: '#475569' },
    { name: 'Admins', value: 128, color: '#0d9488' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Distribution Chart */}
      <Card className="bg-white border border-gray-lighter shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-primary-dark">
            User Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  stroke="#64748b"
                />
                <YAxis 
                  fontSize={12}
                  stroke="#64748b"
                />
                <Bar dataKey="endUsers" fill="#0f172a" />
                <Bar dataKey="resellers" fill="#475569" />
                <Bar dataKey="admins" fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Breakdown Chart */}
      <Card className="bg-white border border-gray-lighter shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-primary-dark">
            Subscription Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="h-[300px] flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 pl-4 space-y-2">
              {subscriptionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-tertiary-dark">
                    {item.name}: {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsChartsRow;
