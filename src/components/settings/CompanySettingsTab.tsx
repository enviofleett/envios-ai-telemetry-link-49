
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const CompanySettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company & Fleet Information</CardTitle>
        <CardDescription>Update your company's fleet management details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company-name">Company Name</Label>
            <Input id="company-name" defaultValue="FleetIQ Solutions Ltd" />
          </div>
          <div>
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input id="contact-email" type="email" defaultValue="fleet@company.com" />
          </div>
        </div>

        <div>
          <Label htmlFor="company-address">Company Address</Label>
          <Textarea id="company-address" defaultValue="123 Business District, Lagos, Nigeria" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" defaultValue="+234 801 234 5678" />
          </div>
          <div>
            <Label htmlFor="fleet-size">Fleet Size</Label>
            <Input id="fleet-size" type="number" defaultValue="25" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="operational-hours">Operational Hours</Label>
            <Input id="operational-hours" defaultValue="24/7 Operations" />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" defaultValue="Africa/Lagos" />
          </div>
        </div>

        <div>
          <Label htmlFor="company-logo">Company Logo</Label>
          <Input id="company-logo" type="file" accept="image/*" />
        </div>

        <Button>Save Company Settings</Button>
      </CardContent>
    </Card>
  );
};

export default CompanySettingsTab;
