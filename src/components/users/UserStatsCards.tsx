
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Check, Clock, PieChart } from 'lucide-react';

interface UserStatsCardsProps {
  totalUsers: number;
  usersWithVehicles: number;
  pendingActivations: number;
  userDistribution: {
    admin: number;
    fleet_manager: number;
    dispatcher: number;
    driver: number;
  };
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  totalUsers,
  usersWithVehicles,
  pendingActivations,
  userDistribution
}) => {
  const usersWithVehiclesPercentage = totalUsers > 0 ? Math.round((usersWithVehicles / totalUsers) * 100) : 0;
  const pendingPercentage = totalUsers > 0 ? Math.round((pendingActivations / totalUsers) * 100) : 0;

  const cards = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      trend: "",
      icon: Users,
      iconColor: "#64748b"
    },
    {
      title: "Users w/Vehicles",
      value: usersWithVehicles.toLocaleString(),
      trend: `${usersWithVehiclesPercentage}% of total users`,
      icon: Check,
      iconColor: "#64748b"
    },
    {
      title: "Pending Activations",
      value: pendingActivations.toLocaleString(),
      trend: `${pendingPercentage}% of total users`,
      icon: Clock,
      iconColor: "#64748b"
    },
    {
      title: "User Distribution",
      value: `${userDistribution.admin}A ${userDistribution.fleet_manager}FM ${userDistribution.dispatcher}D ${userDistribution.driver}Dr`,
      trend: "Admin, Fleet Mgr, Dispatcher, Driver",
      icon: PieChart,
      iconColor: "#64748b"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="h-[120px] bg-white border border-gray-lighter shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-mid">{card.title}</span>
                <IconComponent className="w-4 h-4" style={{ color: card.iconColor }} />
              </div>
              <div className="text-2xl font-bold text-primary-dark mb-1">
                {card.value}
              </div>
              <div className="text-xs text-gray-mid">
                {card.trend}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UserStatsCards;
