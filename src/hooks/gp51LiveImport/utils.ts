
import { GP51LiveData, GP51LiveImportConfig } from './types';

export const createDefaultImportConfig = (): GP51LiveImportConfig => ({
  importUsers: true,
  importDevices: true,
  userTypes: [1, 2, 3, 4], // All user types by default
  deviceTypes: [],
  dateRange: {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  },
  conflictResolution: 'update',
  selectedUserIds: [],
  selectedDeviceIds: []
});

export const processLiveDataForConfig = (
  liveData: GP51LiveData,
  currentConfig: GP51LiveImportConfig
): Partial<GP51LiveImportConfig> => {
  const { users, devices } = liveData;
  
  const uniqueDeviceTypes: number[] = Array.from(
    new Set(devices.map(d => parseInt(String(d.devicetype), 10)).filter(type => !isNaN(type)))
  );

  return {
    selectedUserIds: users.map(u => u.username),
    selectedDeviceIds: devices.map(d => d.deviceid),
    deviceTypes: uniqueDeviceTypes
  };
};

export const calculateStatistics = (users: any[], devices: any[]) => {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  return {
    totalUsers: users.length,
    totalDevices: devices.length,
    activeUsers: users.filter(u => u.lastactivetime > thirtyDaysAgo).length,
    activeDevices: devices.filter(d => d.lastactivetime > thirtyDaysAgo).length
  };
};
