
// Stub implementation for GP51 user management
export interface GP51User {
  userid: number;
  username: string;
  usertype: number;
  showname: string;
  email: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  usertype: number;
  creater: string;
  multilogin: number;
  showname: string;
  email: string;
}

export class GP51UserManagementApi {
  async createUser(userData: CreateUserRequest): Promise<any> {
    console.log('GP51 user creation not implemented:', userData);
    return { status: -1, cause: 'GP51 integration not available' };
  }

  async assignVehicleToGroup(deviceId: string, groupId: number): Promise<any> {
    console.log('Vehicle group assignment not implemented:', { deviceId, groupId });
    return { status: -1, cause: 'GP51 integration not available' };
  }

  async removeVehicleFromGroup(deviceId: string, groupId: number): Promise<any> {
    console.log('Vehicle group removal not implemented:', { deviceId, groupId });
    return { status: -1, cause: 'GP51 integration not available' };
  }
}

export const gp51UserApi = new GP51UserManagementApi();
