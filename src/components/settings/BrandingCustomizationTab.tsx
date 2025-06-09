
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrandingSettings } from '@/hooks/useBrandingSettings';
import { Palette, Type, Image, Code, RotateCcw } from 'lucide-react';

const BrandingCustomizationTab: React.FC = () => {
  const { settings, isLoading, isSaving, updateSetting, resetToDefaults } = useBrandingSettings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branding & UI Customization</CardTitle>
          <CardDescription>Customize your Envio platform's visual identity and user interface</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding & UI Customization
          </CardTitle>
          <CardDescription>
            Customize your Envio platform's visual identity and user interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Branding Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Enable Custom Branding</h4>
              <p className="text-sm text-muted-foreground">
                Apply your custom branding across the platform
              </p>
            </div>
            <Switch 
              checked={settings.is_active}
              onCheckedChange={(checked) => updateSetting('is_active', checked)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          {/* Color Scheme */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Scheme
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    className="w-16 h-10 p-1 border"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => updateSetting('secondary_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    className="w-16 h-10 p-1 border"
                  />
                  <Input
                    value={settings.secondary_color}
                    onChange={(e) => updateSetting('secondary_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    placeholder="#64748B"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accent-color"
                    type="color"
                    value={settings.accent_color}
                    onChange={(e) => updateSetting('accent_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    className="w-16 h-10 p-1 border"
                  />
                  <Input
                    value={settings.accent_color}
                    onChange={(e) => updateSetting('accent_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="background-color"
                    type="color"
                    value={settings.background_color}
                    onChange={(e) => updateSetting('background_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    className="w-16 h-10 p-1 border"
                  />
                  <Input
                    value={settings.background_color}
                    onChange={(e) => updateSetting('background_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Typography */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Type className="h-4 w-4" />
              Typography
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="font-family">Font Family</Label>
                <Select 
                  value={settings.font_family} 
                  onValueChange={(value) => updateSetting('font_family', value)}
                  disabled={isSaving || !settings.is_active}
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
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={settings.text_color}
                    onChange={(e) => updateSetting('text_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    className="w-16 h-10 p-1 border"
                  />
                  <Input
                    value={settings.text_color}
                    onChange={(e) => updateSetting('text_color', e.target.value)}
                    disabled={isSaving || !settings.is_active}
                    placeholder="#1F2937"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Brand Assets */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Image className="h-4 w-4" />
              Brand Assets
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input
                  id="logo-url"
                  value={settings.logo_url || ''}
                  onChange={(e) => updateSetting('logo_url', e.target.value)}
                  disabled={isSaving || !settings.is_active}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favicon-url">Favicon URL</Label>
                <Input
                  id="favicon-url"
                  value={settings.favicon_url || ''}
                  onChange={(e) => updateSetting('favicon_url', e.target.value)}
                  disabled={isSaving || !settings.is_active}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Custom CSS */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Code className="h-4 w-4" />
              Custom CSS
            </h4>
            <div className="space-y-2">
              <Label htmlFor="custom-css">Additional CSS Styles</Label>
              <Textarea
                id="custom-css"
                value={settings.custom_css || ''}
                onChange={(e) => updateSetting('custom_css', e.target.value)}
                disabled={isSaving || !settings.is_active}
                placeholder="/* Add your custom CSS here */&#10;.custom-class {&#10;  /* styles */&#10;}"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Add custom CSS to further customize your platform's appearance
              </p>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={resetToDefaults}
              disabled={isSaving}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {settings.is_active && (
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              Preview how your branding changes will look
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
              <h3 
                className="text-lg font-semibold mb-2"
                style={{ color: settings.primary_color }}
              >
                Envio Fleet Management
              </h3>
              <p className="mb-4">
                This is a preview of how your custom branding will appear throughout the platform.
              </p>
              <div className="flex gap-2">
                <div 
                  className="px-4 py-2 rounded text-white"
                  style={{ backgroundColor: settings.primary_color }}
                >
                  Primary Button
                </div>
                <div 
                  className="px-4 py-2 rounded border"
                  style={{ 
                    borderColor: settings.secondary_color,
                    color: settings.secondary_color
                  }}
                >
                  Secondary Button
                </div>
                <div 
                  className="px-4 py-2 rounded text-white"
                  style={{ backgroundColor: settings.accent_color }}
                >
                  Accent Button
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BrandingCustomizationTab;
