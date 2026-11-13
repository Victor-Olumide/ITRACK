import type { CreateUserRequest } from './types'

export interface CreateUserFormValues {
  fullName: string
  email: string
  departmentId: string
  staffId: string
  password: string
  role: CreateUserRequest['role']
}

export function toCreateUserRequest(values: CreateUserFormValues): CreateUserRequest {
  const staffId = values.staffId.trim()
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    departmentId: values.departmentId,
    password: values.password,
    role: values.role,
    ...(staffId ? { staffId } : {}),
  }
}
