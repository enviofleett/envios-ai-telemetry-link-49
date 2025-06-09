
export interface GP51ConnectionStatus {
  connected: boolean;
  username?: string;
  apiUrl?: string;
  lastCheck?: string;
  error?: string;
}

export interface GP51LiveData {
  users: GP51User[];
  devices: GP51Device[];
  groups: GP51Group[];
  statistics: {
    totalUsers: number;
    totalDevices: number;
    activeUsers: number;
    activeDevices: number;
  };
}

export interface GP51User {
  username: string;
  usertype: number;
  usertypename: string;
  remark: string;
  phone: string;
  creater: string;
  createtime: number;
  lastactivetime: number;
  groupids: number[];
  deviceids: string[];
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum: string;
  overduetime: number;
  expirenotifytime: number;
  remark: string;
  creater: string;
  videochannelcount: number;
  lastactivetime: number;
  isfree: number;
  allowedit: number;
  icon: number;
  stared: number;
  loginame: string;
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  remark: string;
  devices: GP51Device[];
}

export interface GP51LiveImportConfig {
  importUsers: boolean;
  importDevices: boolean;
  userTypes: number[];
  deviceTypes: number[];
  dateRange: {
    from: Date;
    to: Date;
  };
  conflictResolution: 'skip' | 'update' | 'merge';
  selectedUserIds: string[];
  selectedDeviceIds: string[];
}

export interface GP51LiveImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  startedAt: string;
  completedAt?: string;
  results: {
    users: { created: number; updated: number; failed: number };
    devices: { created: number; updated: number; failed: number };
  };
  errors: string[];
}
