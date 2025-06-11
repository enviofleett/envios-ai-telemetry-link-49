
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useEnhancedBrandingSettings } from '@/hooks/useEnhancedBrandingSettings';
import { Building2, Palette, Type, Image, Eye, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EnhancedBrandingTab: React.FC = () => {
  const { settings, isLoading, isSaving, updateSetting } = useEnhancedBrandingSettings();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {isSaving && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Saving branding settings...
          </AlertDescription>
        </Alert>
      )}

      {/* Branding Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branding Control
          </CardTitle>
          <CardDescription>
            Control how your company branding appears across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Enable Custom Branding</h4>
              <p className="text-sm text-muted-foreground">
                Apply your custom branding across the platform
              </p>
            </div>
            <Switch 
              checked={settings.is_branding_active}
              onCheckedChange={(checked) => updateSetting('is_branding_active', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Authentication Page Branding</h4>
              <p className="text-sm text-muted-foreground">
                Show company branding on login and registration pages
              </p>
            </div>
            <Switch 
              checked={settings.auth_page_branding}
              onCheckedChange={(checked) => updateSetting('auth_page_branding', checked)}
              disabled={isSaving || !settings.is_branding_active}
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Identity
          </CardTitle>
          <CardDescription>
            Define your company name and messaging for all user-facing pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={settings.company_name}
                onChange={(e) => updateSetting('company_name', e.target.value)}
                disabled={isSaving || !settings.is_branding_active}
                placeholder="FleetIQ"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Primary Tagline</Label>
              <Input
                id="tagline"
                value={settings.tagline}
                onChange={(e) => updateSetting('tagline', e.target.value)}
                disabled={isSaving || !settings.is_branding_active}
                placeholder="GPS51 Management Platform"
                maxLength={200}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle/Description</Label>
            <Textarea
              id="subtitle"
              value={settings.subtitle}
              onChange={(e) => updateSetting('subtitle', e.target.value)}
              disabled={isSaving || !settings.is_branding_active}
              placeholder="Professional vehicle tracking and management"
              rows={2}
              maxLength={500}
            />
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color Scheme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'primary_color', label: 'Primary Color', placeholder: '#3B82F6' },
              { key: 'secondary_color', label: 'Secondary Color', placeholder: '#64748B' },
              { key: 'accent_color', label: 'Accent Color', placeholder: '#10B981' },
              { key: 'background_color', label: 'Background Color', placeholder: '#FFFFFF' },
              { key: 'text_color', label: 'Text Color', placeholder: '#1F2937' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings[key as keyof typeof settings] as string}
                    onChange={(e) => updateSetting(key as any, e.target.value)}
                    disabled={isSaving || !settings.is_branding_active}
                    className="w-12 h-10 p-1 border"
                  />
                  <Input
                    value={settings[key as keyof typeof settings] as string}
                    onChange={(e) => updateSetting(key as any, e.target.value)}
                    disabled={isSaving || !settings.is_branding_active}
                    placeholder={placeholder}
                    className="flex-1"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography & Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography & Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select 
                value={settings.font_family} 
                onValueChange={(value) => updateSetting('font_family', value)}
                disabled={isSaving || !settings.is_branding_active}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={settings.logo_url}
                onChange={(e) => updateSetting('logo_url', e.target.value)}
                disabled={isSaving || !settings.is_branding_active}
                placeholder="https://example.com/logo.png"
                type="url"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon-url">Favicon URL</Label>
            <Input
              id="favicon-url"
              value={settings.favicon_url}
              onChange={(e) => updateSetting('favicon_url', e.target.value)}
              disabled={isSaving || !settings.is_branding_active}
              placeholder="https://example.com/favicon.ico"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-css">Custom CSS</Label>
            <Textarea
              id="custom-css"
              value={settings.custom_css}
              onChange={(e) => updateSetting('custom_css', e.target.value)}
              disabled={isSaving || !settings.is_branding_active}
              placeholder="/* Add your custom CSS here */"
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Add custom CSS to further customize your platform's appearance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      {settings.is_branding_active && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live Preview
            </CardTitle>
            <CardDescription>
              Preview how your branding will appear on authentication pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 border rounded-lg"
              style={{
                backgroundColor: settings.background_color,
                color: settings.text_color,
                fontFamily: settings.font_family
              }}
            >
              <div className="text-center space-y-4">
                {settings.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Company Logo" 
                    className="h-12 mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: settings.primary_color }}
                >
                  {settings.company_name}
                </h1>
                <p className="text-lg font-medium">
                  {settings.tagline}
                </p>
                <p className="text-sm opacity-80">
                  {settings.subtitle}
                </p>
                <div className="flex justify-center gap-2 pt-4">
                  <div 
                    className="px-4 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: settings.primary_color }}
                  >
                    Login
                  </div>
                  <div 
                    className="px-4 py-2 rounded border text-sm"
                    style={{ 
                      borderColor: settings.secondary_color,
                      color: settings.secondary_color
                    }}
                  >
                    Register
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedBrandingTab;
