
export interface ReportQuery {
  vehicleIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  reportType: string;
  status?: string;
  geofenceIds?: string[];
  alertTypes?: string[];
  limit?: number;
}
