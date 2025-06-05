
export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  creater: string;
  groupid: number;
  deviceenable: 0 | 1;
  loginenable: 0 | 1;
  timezone: number;
  calmileageway: 0 | 1 | 2;
  loginname?: string;
  remark?: string;
  icon?: number;
  simnum?: string;
  needloctype?: 1 | 2 | 7;
}

export interface CreateDeviceRequest {
  deviceid: string;
  devicename: string;
  devicetype: number;
  creater: string;
  groupid: number;
  deviceenable: 0 | 1;
  loginenable: 0 | 1;
  timezone: number;
  calmileageway: 0 | 1 | 2;
}

export interface EditDeviceRequest {
  deviceid: string;
  devicename: string;
  loginname: string;
  remark: string;
  icon: number;
  simnum: string;
  needloctype: 1 | 2 | 7;
}

export interface DeviceType {
  defaultidlength: number;
  defaultofflinedelay: number;
  devicetypeid: number;
  functions: number;
  functionslong: number;
  price: number;
  price3: number;
  price5: number;
  price10: number;
  remark: string;
  remarken: string;
  typecode: string;
  typename: string;
}

export interface QueryDeviceTypesResponse extends GP51ApiResponse {
  devicetypes?: DeviceType[];
}

export interface CreateDeviceResponse extends GP51ApiResponse {
  device?: GP51Device;
}
