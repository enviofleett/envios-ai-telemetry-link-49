
export interface GP51ApiResponse {
  status: number;
  cause: string;
  groups?: GP51Group[];
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  remark: string;
  devices: GP51Device[];
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
  isfree: number; // 1: normal, 2: experiencing, 3: disabled, 4: service fee overdue, 5: time expired
  allowedit: number; // 0: not allow, 1: allow
  icon: number;
  stared: number; // 0: not stare, 1: stared
  loginame: string;
}

export class GP51ApiValidator {
  static validateQueryMonitorListResponse(response: any): {
    isValid: boolean;
    error?: string;
    data?: GP51ApiResponse;
  } {
    if (!response) {
      return { isValid: false, error: 'Response is null or undefined' };
    }

    // Check required status field
    if (typeof response.status !== 'number') {
      return { isValid: false, error: 'Missing or invalid status field' };
    }

    // Check if the request failed (status !== 0 means error)
    if (response.status !== 0) {
      const errorMessage = response.cause || `GP51 API error with status: ${response.status}`;
      return { isValid: false, error: errorMessage };
    }

    // Validate success response structure
    if (!response.cause || response.cause !== 'OK') {
      return { isValid: false, error: 'Unexpected cause field in successful response' };
    }

    // Validate groups array
    if (!Array.isArray(response.groups)) {
      return { isValid: false, error: 'Groups field is missing or not an array' };
    }

    // Validate each group structure
    for (const group of response.groups) {
      const groupValidation = this.validateGroup(group);
      if (!groupValidation.isValid) {
        return { isValid: false, error: `Group validation failed: ${groupValidation.error}` };
      }
    }

    return { isValid: true, data: response as GP51ApiResponse };
  }

  private static validateGroup(group: any): { isValid: boolean; error?: string } {
    if (!group || typeof group !== 'object') {
      return { isValid: false, error: 'Group is not an object' };
    }

    const requiredFields = ['groupid', 'groupname', 'devices'];
    for (const field of requiredFields) {
      if (!(field in group)) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }

    if (!Array.isArray(group.devices)) {
      return { isValid: false, error: 'Devices field is not an array' };
    }

    // Validate each device in the group
    for (const device of group.devices) {
      const deviceValidation = this.validateDevice(device);
      if (!deviceValidation.isValid) {
        return { isValid: false, error: `Device validation failed: ${deviceValidation.error}` };
      }
    }

    return { isValid: true };
  }

  private static validateDevice(device: any): { isValid: boolean; error?: string } {
    if (!device || typeof device !== 'object') {
      return { isValid: false, error: 'Device is not an object' };
    }

    const requiredFields = ['deviceid', 'devicename', 'devicetype'];
    for (const field of requiredFields) {
      if (!(field in device)) {
        return { isValid: false, error: `Missing required device field: ${field}` };
      }
    }

    // Validate device status fields
    if (typeof device.isfree === 'number' && (device.isfree < 1 || device.isfree > 5)) {
      return { isValid: false, error: 'Invalid isfree value (must be 1-5)' };
    }

    if (typeof device.allowedit === 'number' && (device.allowedit < 0 || device.allowedit > 1)) {
      return { isValid: false, error: 'Invalid allowedit value (must be 0 or 1)' };
    }

    return { isValid: true };
  }

  static getDeviceStatusText(isfree: number): string {
    switch (isfree) {
      case 1: return 'normal';
      case 2: return 'experiencing';
      case 3: return 'disabled';
      case 4: return 'service fee overdue';
      case 5: return 'time expired';
      default: return 'unknown';
    }
  }

  static isDeviceActive(device: GP51Device): boolean {
    return device.isfree === 1; // Only normal devices are considered active
  }
}
