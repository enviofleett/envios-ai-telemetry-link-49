
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useCompanySettings } from '@/hooks/useCompanySettings';

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Africa/Lagos', label: 'Lagos' },
  { value: 'Africa/Cairo', label: 'Cairo' }
];

const CompanySettingsForm: React.FC = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    company_address: '',
    phone_number: '',
    fleet_size: '',  // Keep as string for input field
    operational_hours: '',
    timezone: 'UTC'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        contact_email: settings.contact_email || '',
        company_address: settings.company_address || '',
        phone_number: settings.phone_number || '',
        fleet_size: settings.fleet_size?.toString() || '0',  // Convert number to string
        operational_hours: settings.operational_hours || '',
        timezone: settings.timezone || 'UTC'
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Convert fleet_size back to number when saving
    const dataToSave = {
      ...formData,
      fleet_size: parseInt(formData.fleet_size) || 0
    };
    updateSettings(dataToSave);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company & Fleet Information</CardTitle>
        <CardDescription>Update your company's fleet management details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>
          <div>
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              placeholder="contact@company.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="company-address">Company Address</Label>
          <Textarea
            id="company-address"
            value={formData.company_address}
            onChange={(e) => handleInputChange('company_address', e.target.value)}
            placeholder="Enter full company address"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="fleet-size">Fleet Size</Label>
            <Input
              id="fleet-size"
              type="number"
              min="0"
              value={formData.fleet_size}
              onChange={(e) => handleInputChange('fleet_size', e.target.value)}
              placeholder="Number of vehicles"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="operational-hours">Operational Hours</Label>
            <Input
              id="operational-hours"
              value={formData.operational_hours}
              onChange={(e) => handleInputChange('operational_hours', e.target.value)}
              placeholder="e.g., 24/7 Operations, Mon-Fri 9AM-5PM"
            />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Company Settings'}
          </Button>
          {isUpdating && <LoadingSpinner />}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanySettingsForm;
