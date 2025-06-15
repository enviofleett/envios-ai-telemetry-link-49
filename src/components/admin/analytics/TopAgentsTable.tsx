
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TopAgent } from '@/types/referral';
import { Crown } from 'lucide-react';

interface TopAgentsTableProps {
  agents: TopAgent[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const TopAgentsTable: React.FC<TopAgentsTableProps> = ({ agents }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Top Performing Agents
        </CardTitle>
        <CardDescription>
          Agents with the highest all-time commission earnings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Total Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent, index) => (
              <TableRow key={agent.agent_id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{agent.agent_name}</TableCell>
                <TableCell>{agent.agent_email}</TableCell>
                <TableCell className="text-right">{formatCurrency(agent.total_commission)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {agents.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                No agent commission data available yet.
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopAgentsTable;
