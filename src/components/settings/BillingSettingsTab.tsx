
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const BillingSettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription Management</CardTitle>
        <CardDescription>Configure fleet billing settings and payment methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subscription-plan">Current Plan</Label>
            <Input id="subscription-plan" defaultValue="FleetIQ Pro - 50 Vehicles" readOnly />
          </div>
          <div>
            <Label htmlFor="billing-cycle">Billing Cycle</Label>
            <Select defaultValue="monthly">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="next-billing">Next Billing Date</Label>
            <Input id="next-billing" defaultValue="2025-07-06" readOnly />
          </div>
          <div>
            <Label htmlFor="billing-amount">Monthly Amount</Label>
            <Input id="billing-amount" defaultValue="₦125,000" readOnly />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Payment Methods</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="card-payments">Credit/Debit Cards</Label>
              <Switch id="card-payments" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="bank-transfer">Direct Bank Transfer</Label>
              <Switch id="bank-transfer" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="mobile-money">Mobile Money</Label>
              <Switch id="mobile-money" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Usage Monitoring</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="api-usage">Monthly API Calls</Label>
              <Input id="api-usage" defaultValue="47,832 / 100,000" readOnly />
            </div>
            <div>
              <Label htmlFor="data-usage">Data Transfer</Label>
              <Input id="data-usage" defaultValue="2.3 GB / 10 GB" readOnly />
            </div>
          </div>
        </div>

        <Button>Update Billing Settings</Button>
      </CardContent>
    </Card>
  );
};

export default BillingSettingsTab;
