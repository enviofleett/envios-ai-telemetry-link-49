
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from './branding/ThemeProvider';
import { themePresets } from './branding/ThemePresets';
import { validateThemeConfig } from './branding/ThemeValidator';
import { FontLoader } from './branding/FontLoader';
import LogoUploadCard from './branding/LogoUploadCard';
import ColorSchemeCard from './branding/ColorSchemeCard';
import TypographyCard from './branding/TypographyCard';
import NavigationMenuCard from './branding/NavigationMenuCard';
import BrandingActions from './branding/BrandingActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useBrandingSettings } from '@/hooks/useBrandingSettings';
import { 
  Palette, 
  Type, 
  Layout, 
  Monitor,
  Smartphone,
  Save,
  RotateCcw,
  Download,
  Upload,
  Eye,
  Settings
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

const BrandingCustomizationTab: React.FC = () => {
  const { toast } = useToast();
  const { currentTheme, setTheme, resetTheme, applyTheme, isLoading: themeLoading } = useTheme();
  const { settings, isLoading, updateSettings, isUpdating, uploadAsset, isUploading } = useBrandingSettings();
  
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    primary_color: '#3b82f6',
    accent_color: '#2563eb',
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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [workingTheme, setWorkingTheme] = useState(currentTheme);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync with backend settings
  useEffect(() => {
    if (settings) {
      setBrandingConfig({
        logo_url: settings.logo_url,
        favicon_url: settings.favicon_url,
        primary_color: settings.primary_color,
        accent_color: settings.accent_color,
        background_color: settings.background_color,
        text_color: settings.text_color,
        font_family_heading: settings.font_family_heading,
        font_family_body: settings.font_family_body,
        font_size_scale: settings.font_size_scale,
        button_style: settings.button_style
      });
      setLogoPreview(settings.logo_url || null);
      setFaviconPreview(settings.favicon_url || null);
    }
  }, [settings]);

  // Sync working theme with current theme
  useEffect(() => {
    setWorkingTheme(currentTheme);
  }, [currentTheme]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(workingTheme) !== JSON.stringify(currentTheme);
    setHasUnsavedChanges(hasChanges);
  }, [workingTheme, currentTheme]);

  const handlePresetSelect = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (preset) {
      const newTheme = {
        ...preset,
        id: workingTheme.id,
        name: preset.name
      };
      setWorkingTheme(newTheme);
      applyTheme(newTheme); // Apply immediately for preview
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    try {
      const url = await new Promise<string>((resolve, reject) => {
        uploadAsset(file, {
          onSuccess: resolve,
          onError: reject
        });
      });

      if (type === 'logo') {
        setLogoPreview(url);
        setBrandingConfig(prev => ({ ...prev, logo_url: url }));
        updateSettings({ logo_url: url });
      } else {
        setFaviconPreview(url);
        setBrandingConfig(prev => ({ ...prev, favicon_url: url }));
        updateSettings({ favicon_url: url });
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
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

  const resetToDefaults = () => {
    resetTheme();
    setLogoPreview(null);
    setFaviconPreview(null);
    setMenuItems(defaultMenuItems);
    updateSettings({
      logo_url: '',
      favicon_url: '',
      primary_color: '#3b82f6',
      secondary_color: '#6366f1',
      accent_color: '#2563eb',
      background_color: '#ffffff',
      text_color: '#1f2937',
      border_color: '#e5e7eb',
      muted_color: '#6b7280',
      font_family_heading: 'Inter',
      font_family_body: 'Inter',
      font_size_scale: 'medium',
      button_style: 'rounded',
      custom_css: ''
    });
  };

  const saveBrandingConfig = async () => {
    try {
      await setTheme(workingTheme);
      updateSettings({
        ...brandingConfig,
        primary_color: workingTheme.colors.primary,
        secondary_color: workingTheme.colors.secondary,
        accent_color: workingTheme.colors.accent,
        background_color: workingTheme.colors.background,
        text_color: workingTheme.colors.text,
        border_color: workingTheme.colors.border,
        muted_color: workingTheme.colors.muted,
        font_family_heading: workingTheme.typography.fontFamily,
        font_family_body: workingTheme.typography.fontFamily,
        custom_css: workingTheme.customCSS || ''
      });
    } catch (error) {
      console.error('Failed to save branding config:', error);
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

  const exportTheme = () => {
    const dataStr = JSON.stringify(workingTheme, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workingTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTheme = JSON.parse(e.target?.result as string);
        const validatedTheme = validateThemeConfig(importedTheme);
        
        if (validatedTheme) {
          setWorkingTheme(validatedTheme);
          applyTheme(validatedTheme);
          toast({
            title: "Theme Imported",
            description: "Theme has been imported successfully."
          });
        } else {
          toast({
            title: "Import Failed",
            description: "Invalid theme file format.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid theme file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  if (isLoading || themeLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FontLoader />
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Branding & UI Customization</h3>
          <p className="text-sm text-muted-foreground">
            Customize your Envio platform's visual identity and user interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="secondary">Unsaved Changes</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
            className="flex items-center gap-2"
          >
            {previewMode === 'desktop' ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
            {previewMode === 'desktop' ? 'Desktop' : 'Mobile'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="presets" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Presets
          </TabsTrigger>
          <TabsTrigger value="logo" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Menu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {themePresets.map((preset) => (
              <div
                key={preset.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  workingTheme.name === preset.name ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handlePresetSelect(preset.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{preset.name}</h4>
                  </div>
                  <div className="flex gap-1">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: preset.colors.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: preset.colors.background }}
                    />
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: preset.colors.text }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logo" className="space-y-4">
          <LogoUploadCard
            logoPreview={logoPreview}
            faviconPreview={faviconPreview}
            onLogoChange={(file) => handleFileUpload(file, 'logo')}
            onFaviconChange={(file) => handleFileUpload(file, 'favicon')}
            onLogoRemove={() => {
              setLogoPreview(null);
              setBrandingConfig(prev => ({ ...prev, logo_url: '' }));
              updateSettings({ logo_url: '' });
            }}
            onFaviconRemove={() => {
              setFaviconPreview(null);
              setBrandingConfig(prev => ({ ...prev, favicon_url: '' }));
              updateSettings({ favicon_url: '' });
            }}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isUploading={isUploading}
          />
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <ColorSchemeCard
            brandingConfig={brandingConfig}
            setBrandingConfig={setBrandingConfig}
          />
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <TypographyCard
            brandingConfig={brandingConfig}
            setBrandingConfig={setBrandingConfig}
          />
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <NavigationMenuCard
            menuItems={menuItems}
            updateMenuItem={updateMenuItem}
            moveMenuItem={moveMenuItem}
          />
        </TabsContent>
      </Tabs>

      <BrandingActions
        onReset={resetToDefaults}
        onSave={saveBrandingConfig}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default BrandingCustomizationTab;
