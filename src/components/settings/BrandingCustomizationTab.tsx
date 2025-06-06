
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  Type, 
  Menu,
  Save,
  RotateCcw,
  Eye,
  Trash2,
  GripVertical
} from 'lucide-react';

interface BrandingConfig {
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family_heading: string;
  font_family_body: string;
  font_size_scale: string;
  button_style: string;
}

interface MenuItemConfig {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
  custom_name?: string;
}

const defaultMenuItems: MenuItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', visible: true, order: 1 },
  { id: 'tracking', label: 'Live Tracking', icon: 'MapPin', visible: true, order: 2 },
  { id: 'users', label: 'User Management', icon: 'Users', visible: true, order: 3 },
  { id: 'settings', label: 'Settings', icon: 'Settings', visible: true, order: 4 },
  { id: 'system-import', label: 'System Import', icon: 'Download', visible: true, order: 5 }
];

const colorThemes = {
  envio: {
    name: 'Envio Default',
    primary_color: '#0066cc',
    accent_color: '#0052a3',
    background_color: '#ffffff',
    text_color: '#1f2937'
  },
  dark: {
    name: 'Dark Professional',
    primary_color: '#3b82f6',
    accent_color: '#2563eb',
    background_color: '#0f172a',
    text_color: '#f8fafc'
  },
  corporate: {
    name: 'Corporate Blue',
    primary_color: '#1e40af',
    accent_color: '#1d4ed8',
    background_color: '#f8fafc',
    text_color: '#0f172a'
  }
};

const fontOptions = {
  heading: [
    { value: 'Inter', label: 'Inter (Modern)' },
    { value: 'Roboto', label: 'Roboto (Clean)' },
    { value: 'Open Sans', label: 'Open Sans (Friendly)' },
    { value: 'Poppins', label: 'Poppins (Rounded)' }
  ],
  body: [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' }
  ]
};

const BrandingCustomizationTab: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    primary_color: '#0066cc',
    accent_color: '#0052a3',
    background_color: '#ffffff',
    text_color: '#1f2937',
    font_family_heading: 'Inter',
    font_family_body: 'Inter',
    font_size_scale: 'medium',
    button_style: 'rounded'
  });

  const [menuItems, setMenuItems] = useState<MenuItemConfig[]>(defaultMenuItems);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = (file: File, type: 'logo' | 'favicon') => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, SVG)",
        variant: "destructive"
      });
      return;
    }

    const maxSize = type === 'favicon' ? 1 * 1024 * 1024 : 5 * 1024 * 1024; // 1MB for favicon, 5MB for logo
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${type === 'favicon' ? '1MB' : '5MB'}`,
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'logo') {
        setLogoPreview(result);
        setBrandingConfig(prev => ({ ...prev, logo_url: result }));
      } else {
        setFaviconPreview(result);
        setBrandingConfig(prev => ({ ...prev, favicon_url: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, type: 'logo' | 'favicon') => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const applyColorTheme = (themeKey: string) => {
    const theme = colorThemes[themeKey as keyof typeof colorThemes];
    if (theme) {
      setBrandingConfig(prev => ({
        ...prev,
        primary_color: theme.primary_color,
        accent_color: theme.accent_color,
        background_color: theme.background_color,
        text_color: theme.text_color
      }));
      toast({
        title: "Theme Applied",
        description: `${theme.name} theme has been applied`
      });
    }
  };

  const resetToDefaults = () => {
    setBrandingConfig({
      primary_color: '#0066cc',
      accent_color: '#0052a3',
      background_color: '#ffffff',
      text_color: '#1f2937',
      font_family_heading: 'Inter',
      font_family_body: 'Inter',
      font_size_scale: 'medium',
      button_style: 'rounded'
    });
    setLogoPreview(null);
    setFaviconPreview(null);
    setMenuItems(defaultMenuItems);
    toast({
      title: "Reset Complete",
      description: "All branding settings have been reset to defaults"
    });
  };

  const saveBrandingConfig = async () => {
    try {
      // Here you would typically save to your backend
      toast({
        title: "Settings Saved",
        description: "Branding configuration saved successfully"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save branding configuration",
        variant: "destructive"
      });
    }
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItemConfig>) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const moveMenuItem = (id: string, direction: 'up' | 'down') => {
    setMenuItems(prev => {
      const currentIndex = prev.findIndex(item => item.id === id);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newItems = [...prev];
      [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];
      
      return newItems.map((item, index) => ({ ...item, order: index + 1 }));
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Branding & UI Customization</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize your Envio platform's visual identity and user interface
        </p>
      </div>

      <Tabs defaultValue="logo" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logo">Logo & Assets</TabsTrigger>
          <TabsTrigger value="colors">Colors & Theme</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="menu">Menu Layout</TabsTrigger>
        </TabsList>

        <TabsContent value="logo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Application Logo
                </CardTitle>
                <CardDescription>
                  Upload your company logo (PNG, JPG, SVG - Max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDrop={(e) => handleDrop(e, 'logo')}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {logoPreview ? (
                    <div className="space-y-4">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="max-h-24 mx-auto object-contain"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Logo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLogoPreview(null);
                            setBrandingConfig(prev => ({ ...prev, logo_url: undefined }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Drop your logo here</p>
                        <p className="text-xs text-muted-foreground">or click to browse</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'logo');
                  }}
                />
              </CardContent>
            </Card>

            {/* Favicon Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Favicon
                </CardTitle>
                <CardDescription>
                  Upload favicon for browser tabs (PNG, ICO - Max 1MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {faviconPreview ? (
                    <div className="space-y-4">
                      <img 
                        src={faviconPreview} 
                        alt="Favicon preview" 
                        className="w-8 h-8 mx-auto object-contain"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => faviconInputRef.current?.click()}
                        >
                          Change
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFaviconPreview(null);
                            setBrandingConfig(prev => ({ ...prev, favicon_url: undefined }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => faviconInputRef.current?.click()}
                      >
                        Upload Favicon
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*,.ico"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'favicon');
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>
                Customize your platform's color palette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Templates */}
              <div className="space-y-3">
                <Label>Quick Themes</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(colorThemes).map(([key, theme]) => (
                    <Button
                      key={key}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start"
                      onClick={() => applyColorTheme(key)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: theme.primary_color }}
                        />
                        <span className="font-medium">{theme.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: theme.primary_color }}
                        />
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: theme.accent_color }}
                        />
                        <div 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: theme.background_color }}
                        />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={brandingConfig.primary_color}
                      onChange={(e) => setBrandingConfig(prev => ({
                        ...prev, 
                        primary_color: e.target.value
                      }))}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={brandingConfig.primary_color}
                      onChange={(e) => setBrandingConfig(prev => ({
                        ...prev, 
                        primary_color: e.target.value
                      }))}
                      placeholder="#0066cc"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={brandingConfig.accent_color}
                      onChange={(e) => setBrandingConfig(prev => ({
                        ...prev, 
                        accent_color: e.target.value
                      }))}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={brandingConfig.accent_color}
                      onChange={(e) => setBrandingConfig(prev => ({
                        ...prev, 
                        accent_color: e.target.value
                      }))}
                      placeholder="#0052a3"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background-color">Background</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background-color"
                      type="color"
                      value={brandingConfig.background_color}
                      onChange={(e) => setBrandingConfig(prev => ({
                        ...prev, 
                        background_color: e.target.value
                      }))}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={brandingConfig.background_color}
                      onChange={(e) => setBrandingConfig(prev => ({
                        ...prev, 
                        background_color: e.target.value
                      }))}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={brandingConfig.text_color}
                      onChange={(e) => setBrandingConfig(prev => ({
                        ...prev, 
                        text_color: e.target.value
                      }))}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={brandingConfig.text_color}
                      onChange={(e) => setBrandingConfig(prev => ({
                        ...prev, 
                        text_color: e.target.value
                      }))}
                      placeholder="#1f2937"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <Label>Color Preview</Label>
                <div 
                  className="border rounded-lg p-4"
                  style={{ 
                    backgroundColor: brandingConfig.background_color,
                    color: brandingConfig.text_color 
                  }}
                >
                  <h4 className="font-semibold mb-2">Sample Interface</h4>
                  <p className="text-sm mb-3">This is how your text will appear with the selected colors.</p>
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: brandingConfig.primary_color }}
                    >
                      Primary Button
                    </button>
                    <button 
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: brandingConfig.accent_color }}
                    >
                      Accent Button
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography Settings
              </CardTitle>
              <CardDescription>
                Configure fonts and text styling for your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="heading-font">Heading Font</Label>
                    <Select
                      value={brandingConfig.font_family_heading}
                      onValueChange={(value) => setBrandingConfig(prev => ({
                        ...prev, 
                        font_family_heading: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.heading.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body-font">Body Font</Label>
                    <Select
                      value={brandingConfig.font_family_body}
                      onValueChange={(value) => setBrandingConfig(prev => ({
                        ...prev, 
                        font_family_body: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.body.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size Scale</Label>
                    <Select
                      value={brandingConfig.font_size_scale}
                      onValueChange={(value) => setBrandingConfig(prev => ({
                        ...prev, 
                        font_size_scale: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>Typography Preview</Label>
                  <div className="border rounded-lg p-4 space-y-3">
                    <h1 
                      className="text-2xl font-bold"
                      style={{ fontFamily: brandingConfig.font_family_heading }}
                    >
                      Heading Example
                    </h1>
                    <h2 
                      className="text-lg font-semibold"
                      style={{ fontFamily: brandingConfig.font_family_heading }}
                    >
                      Subheading Example
                    </h2>
                    <p 
                      className="text-sm"
                      style={{ fontFamily: brandingConfig.font_family_body }}
                    >
                      This is sample body text that shows how your content will appear with the selected typography settings. It demonstrates readability and visual hierarchy.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                Navigation Menu
              </CardTitle>
              <CardDescription>
                Customize the visibility and order of navigation menu items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {menuItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.visible}
                          onCheckedChange={(checked) => updateMenuItem(item.id, { visible: checked })}
                        />
                        <span className={`font-medium ${!item.visible ? 'text-muted-foreground' : ''}`}>
                          {item.custom_name || item.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Custom name"
                        value={item.custom_name || ''}
                        onChange={(e) => updateMenuItem(item.id, { custom_name: e.target.value })}
                        className="w-32"
                      />
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveMenuItem(item.id, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveMenuItem(item.id, 'down')}
                          disabled={index === menuItems.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Changes
          </Button>
          <Button
            onClick={saveBrandingConfig}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrandingCustomizationTab;
