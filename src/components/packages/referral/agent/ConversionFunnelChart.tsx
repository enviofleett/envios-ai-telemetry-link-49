
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserCheck, Award, ChevronsRight } from 'lucide-react';

interface FunnelStageProps {
  name: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  className?: string;
}

const FunnelStage: React.FC<FunnelStageProps> = ({ name, value, icon, color, className }) => (
    <div className={`p-6 rounded-lg ${color} text-white text-center ${className}`}>
        {React.cloneElement(icon, { className: "h-8 w-8 mx-auto mb-2"})}
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm font-medium">{name}</p>
    </div>
);

interface ConversionArrowProps {
    from: number;
    to: number;
}

const ConversionArrow: React.FC<ConversionArrowProps> = ({ from, to }) => {
    const rate = from > 0 ? (to / from) * 100 : 0;
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-2">
            <ChevronsRight className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-semibold mt-1 text-gray-600">{rate.toFixed(1)}%</span>
            <span className="text-xs text-muted-foreground">conv. rate</span>
        </div>
    );
};


interface ConversionFunnelChartProps {
  referrals: number;
  signups: number;
  conversions: number;
}

const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ referrals, signups, conversions }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All-Time Conversion Funnel</CardTitle>
        <CardDescription>
          Track the customer journey from initial referral to a conversion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center w-full">
            <FunnelStage name="Referrals" value={referrals} icon={<Users />} color="bg-blue-500" className="flex-shrink-0 w-1/4"/>
            <ConversionArrow from={referrals} to={signups} />
            <FunnelStage name="Sign-ups" value={signups} icon={<UserCheck />} color="bg-indigo-500" className="flex-shrink-0 w-1/4"/>
            <ConversionArrow from={signups} to={conversions} />
            <FunnelStage name="Conversions" value={conversions} icon={<Award />} color="bg-purple-500" className="flex-shrink-0 w-1/4"/>
        </div>
        <div className="mt-6 border-t pt-4 text-center">
            <h4 className="text-md font-semibold mb-2">Overall Performance</h4>
            <div>
                <p className="text-sm text-muted-foreground">Overall Conversion Rate</p>
                <p className="text-2xl font-bold">
                    {referrals > 0 ? ((conversions / referrals) * 100).toFixed(1) : '0.0'}%
                </p>
                <p className="text-xs text-muted-foreground">(From Referrals to Conversions)</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnelChart;
