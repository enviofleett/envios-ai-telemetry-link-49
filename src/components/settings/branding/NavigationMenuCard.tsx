
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Menu, GripVertical } from 'lucide-react';

interface MenuItemConfig {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
  custom_name?: string;
}

interface NavigationMenuCardProps {
  menuItems: MenuItemConfig[];
  updateMenuItem: (id: string, updates: Partial<MenuItemConfig>) => void;
  moveMenuItem: (id: string, direction: 'up' | 'down') => void;
}

const NavigationMenuCard: React.FC<NavigationMenuCardProps> = ({
  menuItems,
  updateMenuItem,
  moveMenuItem
}) => {
  return (
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
  );
};

export default NavigationMenuCard;
