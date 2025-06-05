
export interface GP51UserType {
  COMPANY_ADMIN: 1;
  SUB_ADMIN: 2;
  END_USER: 3;
  DEVICE_USER: 4;
}

export interface GP51User {
  username: string;
  creater: string;
  showname: string;
  usertype: 1 | 2 | 3 | 4;
  multilogin: 0 | 1;
  companyname?: string;
  companyaddr?: string;
  cardname?: string;
  email?: string;
  wechat?: string;
  phone?: string;
  qq?: string;
}

export interface CreateUserRequest {
  creater: string;
  username: string;
  usertype: 1 | 2 | 3 | 4;
  password: string;
  multilogin: 0 | 1;
  showname?: string;
  companyname?: string;
  companyaddr?: string;
  cardname?: string;
  email?: string;
  wechat?: string;
  phone?: string;
  qq?: string;
}

export interface EditUserRequest extends Partial<CreateUserRequest> {
  username: string;
}

export interface GP51ApiResponse {
  status: number;
  cause: string;
}

export interface CreateUserResponse extends GP51ApiResponse {
  // Additional response fields if any
}

export interface QueryUserResponse extends GP51ApiResponse {
  user?: GP51User;
}

export interface DeleteUserResponse extends GP51ApiResponse {
  // Additional response fields if any
}
