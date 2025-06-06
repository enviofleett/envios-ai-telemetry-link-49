
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter, TrendingUp } from 'lucide-react';

const UserDistributionChart: React.FC = () => {
  const data = [
    {
      month: 'Jan',
      endUsers: 400,
      resellers: 240,
      admins: 24
    },
    {
      month: 'Feb',
      endUsers: 450,
      resellers: 280,
      admins: 28
    },
    {
      month: 'Mar',
      endUsers: 520,
      resellers: 320,
      admins: 32
    },
    {
      month: 'Apr',
      endUsers: 580,
      resellers: 350,
      admins: 35
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{`${label} - Total: ${total.toLocaleString()}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            User Distribution
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="rect"
              />
              <Bar 
                dataKey="endUsers" 
                stackId="users"
                fill="#0f172a" 
                name="End Users"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="resellers" 
                stackId="users"
                fill="#475569" 
                name="Resellers"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="admins" 
                stackId="users"
                fill="#0d9488" 
                name="Admins"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="flex items-center justify-center gap-1">
                <div className="w-3 h-3 bg-slate-900 rounded"></div>
                <span className="font-medium text-gray-900">End Users</span>
              </div>
              <div className="text-gray-600 mt-1">400 → 580</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <div className="w-3 h-3 bg-slate-600 rounded"></div>
                <span className="font-medium text-gray-900">Resellers</span>
              </div>
              <div className="text-gray-600 mt-1">240 → 350</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <div className="w-3 h-3 bg-teal-600 rounded"></div>
                <span className="font-medium text-gray-900">Admins</span>
              </div>
              <div className="text-gray-600 mt-1">24 → 35</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Growth Rate: +15.2% QoQ</span>
              <span className="text-gray-500">| Peak Month: April</span>
              <span className="text-gray-500">| Trend: ↗️ Increasing</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserDistributionChart;
