
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, AlertCircle, Wrench, Clock } from 'lucide-react';
import type { ReportData, TripReportData, GeofenceReportData, MaintenanceReportData, AlertReportData, MileageReportData } from '@/hooks/useAdvancedReports';

interface AdvancedReportTableProps {
  data: ReportData[];
  isLoading: boolean;
  type: string;
}

const AdvancedReportTable: React.FC<AdvancedReportTableProps> = ({ data, isLoading, type }) => {
  if (isLoading) {
    return (
      <div className="border border-gray-lighter rounded-lg">
        <div className="flex items-center justify-between bg-gray-background px-4 py-3 border-b border-gray-lighter">
          <h4 className="text-sm font-medium text-primary-dark">
            Loading {type} report...
          </h4>
        </div>
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border border-gray-lighter rounded-lg">
        <div className="flex items-center justify-between bg-gray-background px-4 py-3 border-b border-gray-lighter">
          <h4 className="text-sm font-medium text-primary-dark">
            {type.charAt(0).toUpperCase() + type.slice(1)} Report
          </h4>
        </div>
        <div className="p-8 text-center text-gray-mid">
          <p>No data available for the selected filters.</p>
          <p className="text-sm mt-2">Try adjusting your date range or vehicle selection.</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, type: string) => {
    let variant: 'default' | 'destructive' | 'secondary' = 'default';
    
    if (type === 'alerts' || type === 'geofence') {
      variant = status === 'Alert' || status === 'Violation' || status === 'active' || status === 'critical' ? 'destructive' : 'default';
    } else if (type === 'maintenance') {
      variant = status === 'overdue' ? 'destructive' : 'default';
    }
    
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {severity}
      </Badge>
    );
  };

  const renderTripTable = (tripData: TripReportData[]) => (
    <table className="w-full">
      <thead className="bg-gray-background">
        <tr className="border-b border-gray-lighter">
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Vehicle</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Start Time</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">End Time</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Duration</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Distance</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Avg Speed</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Fuel</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Status</th>
        </tr>
      </thead>
      <tbody>
        {tripData.map((row) => (
          <tr key={row.id} className="border-b border-gray-lighter hover:bg-gray-background/50">
            <td className="px-4 py-3">
              <div>
                <div className="text-sm font-medium text-primary-dark">{row.vehicleName}</div>
                <div className="text-xs text-gray-mid">{row.vehicleId}</div>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.startTime}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.endTime}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.duration}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.distance}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.averageSpeed}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.fuelConsumption}</td>
            <td className="px-4 py-3">{getStatusBadge(row.status, 'trip')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderGeofenceTable = (geofenceData: GeofenceReportData[]) => (
    <table className="w-full">
      <thead className="bg-gray-background">
        <tr className="border-b border-gray-lighter">
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Vehicle</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Geofence</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Event</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Time</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Duration</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Location</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Status</th>
        </tr>
      </thead>
      <tbody>
        {geofenceData.map((row) => (
          <tr key={row.id} className="border-b border-gray-lighter hover:bg-gray-background/50">
            <td className="px-4 py-3">
              <div>
                <div className="text-sm font-medium text-primary-dark">{row.vehicleName}</div>
                <div className="text-xs text-gray-mid">{row.vehicleId}</div>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.geofenceName}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-mid" />
                <span className="text-sm text-primary-dark capitalize">{row.eventType}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.eventTime}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.duration || '-'}</td>
            <td className="px-4 py-3 text-xs text-gray-mid">{row.location.lat.toFixed(4)}, {row.location.lng.toFixed(4)}</td>
            <td className="px-4 py-3">{getStatusBadge(row.status, 'geofence')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderMaintenanceTable = (maintenanceData: MaintenanceReportData[]) => (
    <table className="w-full">
      <thead className="bg-gray-background">
        <tr className="border-b border-gray-lighter">
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Vehicle</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Service Type</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Scheduled</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Completed</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Cost</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Next Service</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Status</th>
        </tr>
      </thead>
      <tbody>
        {maintenanceData.map((row) => (
          <tr key={row.id} className="border-b border-gray-lighter hover:bg-gray-background/50">
            <td className="px-4 py-3">
              <div>
                <div className="text-sm font-medium text-primary-dark">{row.vehicleName}</div>
                <div className="text-xs text-gray-mid">{row.vehicleId}</div>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-gray-mid" />
                <span className="text-sm text-primary-dark">{row.maintenanceType}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.scheduledDate}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.completedDate || '-'}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.cost || '-'}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.nextServiceDue || '-'}</td>
            <td className="px-4 py-3">{getStatusBadge(row.status, 'maintenance')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderAlertsTable = (alertsData: AlertReportData[]) => (
    <table className="w-full">
      <thead className="bg-gray-background">
        <tr className="border-b border-gray-lighter">
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Vehicle</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Alert Type</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Time</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Severity</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Description</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Acknowledged</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Status</th>
        </tr>
      </thead>
      <tbody>
        {alertsData.map((row) => (
          <tr key={row.id} className="border-b border-gray-lighter hover:bg-gray-background/50">
            <td className="px-4 py-3">
              <div>
                <div className="text-sm font-medium text-primary-dark">{row.vehicleName}</div>
                <div className="text-xs text-gray-mid">{row.vehicleId}</div>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-mid" />
                <span className="text-sm text-primary-dark">{row.alertType}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.alertTime}</td>
            <td className="px-4 py-3">{getSeverityBadge(row.severity)}</td>
            <td className="px-4 py-3 text-sm text-primary-dark max-w-xs truncate">{row.description}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.acknowledgedBy || '-'}</td>
            <td className="px-4 py-3">{getStatusBadge(row.status, 'alerts')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderMileageTable = (mileageData: MileageReportData[]) => (
    <table className="w-full">
      <thead className="bg-gray-background">
        <tr className="border-b border-gray-lighter">
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Vehicle</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Period</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Total Distance</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Avg Distance</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Fuel Consumption</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Efficiency</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-dark">Utilization</th>
        </tr>
      </thead>
      <tbody>
        {mileageData.map((row) => (
          <tr key={row.id} className="border-b border-gray-lighter hover:bg-gray-background/50">
            <td className="px-4 py-3">
              <div>
                <div className="text-sm font-medium text-primary-dark">{row.vehicleName}</div>
                <div className="text-xs text-gray-mid">{row.vehicleId}</div>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-mid" />
                <span className="text-sm text-primary-dark">{row.period}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.totalDistance}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.averageDistance}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.fuelConsumption}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.fuelEfficiency}</td>
            <td className="px-4 py-3 text-sm text-primary-dark">{row.utilizationRate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTable = () => {
    switch (type) {
      case 'trip':
      case 'activity':
        return renderTripTable(data as TripReportData[]);
      case 'geofence':
        return renderGeofenceTable(data as GeofenceReportData[]);
      case 'maintenance':
        return renderMaintenanceTable(data as MaintenanceReportData[]);
      case 'alerts':
        return renderAlertsTable(data as AlertReportData[]);
      case 'mileage':
        return renderMileageTable(data as MileageReportData[]);
      default:
        return renderTripTable(data as TripReportData[]);
    }
  };

  return (
    <div className="border border-gray-lighter rounded-lg">
      {/* Table Header */}
      <div className="flex items-center justify-between bg-gray-background px-4 py-3 border-b border-gray-lighter">
        <h4 className="text-sm font-medium text-primary-dark">
          {type.charAt(0).toUpperCase() + type.slice(1)} Report ({data.length} records)
        </h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-gray-lighter text-primary-dark hover:bg-gray-background"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {renderTable()}
      </div>

      {/* Table Footer */}
      <div className="px-4 py-3 bg-gray-background border-t border-gray-lighter">
        <div className="flex items-center justify-between text-sm text-gray-mid">
          <span>Showing {data.length} of {data.length} records</span>
          <span>Generated at {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReportTable;
