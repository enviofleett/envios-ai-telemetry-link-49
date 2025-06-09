
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Car, 
  MapPin, 
  Navigation, 
  Settings, 
  FileText, 
  RefreshCw, 
  Download,
  Eye,
  Wrench,
  AlertTriangle,
  Clock
} from 'lucide-react';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<any>;
  category: 'vehicles' | 'actions' | 'navigation' | 'reports';
  shortcut?: string;
  handler: () => void;
  vehicle?: Vehicle;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onVehicleSelect: (vehicle: Vehicle) => void;
  onRefresh: () => void;
  onExport?: () => void;
  onNavigate?: (path: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  vehicles,
  onVehicleSelect,
  onRefresh,
  onExport,
  onNavigate
}) => {
  const [searchValue, setSearchValue] = useState('');

  // Clear search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchValue('');
    }
  }, [isOpen]);

  // Generate command actions
  const actions = useMemo((): CommandAction[] => {
    const vehicleActions: CommandAction[] = vehicles
      .filter(vehicle => 
        !searchValue || 
        vehicle.devicename.toLowerCase().includes(searchValue.toLowerCase()) ||
        vehicle.deviceid.toLowerCase().includes(searchValue.toLowerCase())
      )
      .slice(0, 8) // Limit to first 8 results for performance
      .map(vehicle => ({
        id: `vehicle-${vehicle.deviceid}`,
        label: vehicle.devicename,
        description: `Device ID: ${vehicle.deviceid}`,
        icon: Car,
        category: 'vehicles' as const,
        vehicle,
        handler: () => {
          onVehicleSelect(vehicle);
          onClose();
        }
      }));

    const fleetActions: CommandAction[] = [
      {
        id: 'refresh-all',
        label: 'Refresh All Data',
        description: 'Sync latest vehicle positions from GP51',
        icon: RefreshCw,
        category: 'actions',
        shortcut: '⌘R',
        handler: () => {
          onRefresh();
          onClose();
        }
      },
      {
        id: 'export-data',
        label: 'Export Fleet Data',
        description: 'Download current fleet information',
        icon: Download,
        category: 'actions',
        shortcut: '⌘E',
        handler: () => {
          onExport?.();
          onClose();
        }
      }
    ];

    const navigationActions: CommandAction[] = [
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'Fleet overview and metrics',
        icon: Navigation,
        category: 'navigation',
        handler: () => {
          onNavigate?.('/dashboard');
          onClose();
        }
      },
      {
        id: 'nav-enhanced-tracking',
        label: 'Enhanced Live Tracking',
        description: 'Advanced tracking with analytics',
        icon: MapPin,
        category: 'navigation',
        handler: () => {
          onNavigate?.('/enhanced-tracking');
          onClose();
        }
      },
      {
        id: 'nav-admin',
        label: 'Admin Settings',
        description: 'System configuration and management',
        icon: Settings,
        category: 'navigation',
        handler: () => {
          onNavigate?.('/admin');
          onClose();
        }
      }
    ];

    const reportActions: CommandAction[] = [
      {
        id: 'generate-fleet-report',
        label: 'Generate Fleet Report',
        description: 'Comprehensive fleet analytics',
        icon: FileText,
        category: 'reports',
        handler: () => {
          // This would trigger report generation
          onClose();
        }
      }
    ];

    return [...vehicleActions, ...fleetActions, ...navigationActions, ...reportActions];
  }, [vehicles, searchValue, onVehicleSelect, onRefresh, onExport, onNavigate, onClose]);

  // Filter actions based on search
  const filteredActions = useMemo(() => {
    if (!searchValue) return actions;
    
    return actions.filter(action =>
      action.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      action.description?.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [actions, searchValue]);

  // Group actions by category
  const groupedActions = useMemo(() => {
    const groups = filteredActions.reduce((acc, action) => {
      if (!acc[action.category]) {
        acc[action.category] = [];
      }
      acc[action.category].push(action);
      return acc;
    }, {} as Record<string, CommandAction[]>);

    return groups;
  }, [filteredActions]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'vehicles': return 'Vehicles';
      case 'actions': return 'Actions';
      case 'navigation': return 'Navigation';
      case 'reports': return 'Reports';
      default: return category;
    }
  };

  const getVehicleStatus = (vehicle?: Vehicle) => {
    if (!vehicle?.lastPosition?.updatetime) return 'offline';
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-2xl top-[20%] translate-y-0">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search vehicles, actions, or type a command..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for vehicles, actions, or navigation
                </p>
              </div>
            </CommandEmpty>

            {Object.entries(groupedActions).map(([category, categoryActions]) => (
              <CommandGroup key={category} heading={getCategoryLabel(category)}>
                {categoryActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem
                      key={action.id}
                      onSelect={action.handler}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{action.label}</span>
                          {action.vehicle && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(getVehicleStatus(action.vehicle))}`}
                            >
                              {getVehicleStatus(action.vehicle)}
                            </Badge>
                          )}
                        </div>
                        {action.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {action.description}
                          </p>
                        )}
                      </div>
                      {action.shortcut && (
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                          {action.shortcut}
                        </kbd>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
