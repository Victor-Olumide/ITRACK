import type { AuthenticatedUser, UserRole } from '../auth/types';

export interface ListUsersResponse {
  users: AuthenticatedUser[];
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId: string;
  staffId?: string;
  phone?: string | null;
  address?: string | null;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserResponse {
  user: AuthenticatedUser;
}
