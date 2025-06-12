
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigation, Menu, X, MapPin, Clock, Gauge, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TrackingSidebar from '@/components/tracking/TrackingSidebar';
import TrackingHeader from '@/components/tracking/TrackingHeader';
import TrackingMapArea from '@/components/tracking/TrackingMapArea';
import TrackingRightPanel from '@/components/tracking/TrackingRightPanel';
import VehicleDetailsPanel from '@/components/tracking/VehicleDetailsPanel';
import type { VehicleData } from '@/types/vehicle';

const LiveTracking: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [detailsPanelExpanded, setDetailsPanelExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleVehicleSelect = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setDetailsPanelExpanded(true);
  };

  const handleCloseDetails = () => {
    setDetailsPanelExpanded(false);
    setSelectedVehicle(null);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="h-full overflow-hidden bg-slate-50">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-[auto_1fr_300px] grid-rows-[auto_1fr_auto] h-full">
            
            {/* Left Sidebar */}
            <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-white border-r border-slate-200 row-span-3`}>
              <TrackingSidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                selectedVehicle={selectedVehicle}
                onVehicleSelect={handleVehicleSelect}
              />
            </div>

            {/* Header Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <TrackingHeader />
            </div>

            {/* Right Panel */}
            <div className="bg-white border-l border-slate-200 px-4 py-4 row-span-2">
              <TrackingRightPanel />
            </div>

            {/* Main Map Area */}
            <div className="relative bg-slate-100 overflow-hidden">
              <TrackingMapArea
                selectedVehicle={selectedVehicle}
                onVehicleSelect={handleVehicleSelect}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
              />
              
              {/* Bottom Panel (overlaid on map) */}
              {detailsPanelExpanded && selectedVehicle && (
                <div className="absolute bottom-0 left-0 right-0 z-10">
                  <VehicleDetailsPanel
                    vehicle={selectedVehicle}
                    expanded={detailsPanelExpanded}
                    onClose={handleCloseDetails}
                    onToggle={() => setDetailsPanelExpanded(!detailsPanelExpanded)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default LiveTracking;
