
import { GP51LiveImportConfig, GP51LiveData, GP51Statistics } from './types';

export const createDefaultImportConfig = (): GP51LiveImportConfig => {
  return {
    importUsers: true,
    importDevices: true,
    userTypes: [1, 2, 3, 4], // All user types by default
    deviceTypes: [],
    dateRange: {
      from: new Date(),
      to: new Date()
    },
    conflictResolution: 'skip',
    selectedUserIds: [],
    selectedDeviceIds: []
  };
};

export const processLiveDataForConfig = (liveData: GP51LiveData, currentConfig: GP51LiveImportConfig): Partial<GP51LiveImportConfig> => {
  // Filter users by selected types and auto-select them
  const filteredUsers = liveData.users.filter(user => 
    currentConfig.userTypes.includes(user.usertype)
  );
  
  return {
    selectedUserIds: filteredUsers.map(u => u.username),
    selectedDeviceIds: liveData.devices.map(d => d.deviceid)
  };
};

export const calculateStatistics = (users: any[], devices: any[]): GP51Statistics => {
  return {
    totalUsers: users.length,
    activeUsers: users.filter(user => user.usertype && user.usertype > 0).length,
    totalDevices: devices.length,
    activeDevices: devices.filter(device => !device.isfree).length
  };
};
