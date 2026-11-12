export type UserRole = 'EMPLOYEE' | 'TECHNICIAN' | 'IT_ADMIN' | 'SECURITY';

export interface OrganizationInfo {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentListResponse {
  departments: DepartmentInfo[];
}

export interface AuthenticatedUser {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organization: OrganizationInfo;
  departmentId: string;
  department: DepartmentInfo;
  phone: string | null;
  address: string | null;
  isActive: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
}

export interface RefreshResponse {
  user: AuthenticatedUser;
}

export interface LogoutResponse {
  message: string;
}

export interface MeResponse {
  user: AuthenticatedUser;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
