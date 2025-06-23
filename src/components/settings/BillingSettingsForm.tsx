
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const BillingSettingsForm: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    billingAddress: '',
    taxId: '',
    autoRenewal: true,
    invoiceEmail: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Billing Settings Updated",
      description: "Your billing information has been saved successfully.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>Manage your billing details and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Billing Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name for billing"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoiceEmail">Invoice Email</Label>
                <Input
                  id="invoiceEmail"
                  name="invoiceEmail"
                  type="email"
                  value={formData.invoiceEmail}
                  onChange={handleChange}
                  placeholder="Enter email for invoices"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Input
                id="billingAddress"
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleChange}
                placeholder="Enter billing address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / VAT Number</Label>
              <Input
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="Enter tax ID or VAT number"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoRenewal"
                checked={formData.autoRenewal}
                onCheckedChange={(checked) => setFormData({...formData, autoRenewal: checked})}
              />
              <Label htmlFor="autoRenewal">Enable auto-renewal</Label>
            </div>

            <Button type="submit" className="w-full">
              Save Billing Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingSettingsForm;
