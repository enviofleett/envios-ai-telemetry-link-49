
export interface WorkshopUser {
  id: string;
  workshop_id: string;
  envio_user_id?: string; // <-- NEW: Link to main user identity
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'technician' | 'inspector';
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkshopSession {
  id: string;
  workshop_user_id: string;
  workshop_id: string;
  expires_at: string;
  created_at: string;
}

export interface WorkshopLoginData {
  email: string;
  password: string;
  workshop_id?: string;
}

export interface CreateWorkshopUserData {
  workshop_id: string;
  envio_user_id?: string; // <-- NEW: for user creation
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'technician' | 'inspector';
  permissions: string[];
}
