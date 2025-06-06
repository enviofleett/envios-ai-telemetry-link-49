
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import LogoUploadCard from './branding/LogoUploadCard';
import ColorSchemeCard from './branding/ColorSchemeCard';
import TypographyCard from './branding/TypographyCard';
import NavigationMenuCard from './branding/NavigationMenuCard';
import BrandingActions from './branding/BrandingActions';

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
          <LogoUploadCard
            logoPreview={logoPreview}
            faviconPreview={faviconPreview}
            onLogoChange={(file) => handleFileUpload(file, 'logo')}
            onFaviconChange={(file) => handleFileUpload(file, 'favicon')}
            onLogoRemove={() => {
              setLogoPreview(null);
              setBrandingConfig(prev => ({ ...prev, logo_url: undefined }));
            }}
            onFaviconRemove={() => {
              setFaviconPreview(null);
              setBrandingConfig(prev => ({ ...prev, favicon_url: undefined }));
            }}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
      />
    </div>
  );
};

export default BrandingCustomizationTab;
