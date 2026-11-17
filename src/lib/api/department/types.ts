import type { AssetCondition, AssetType } from '../assets/types';

export interface DepartmentHeadSummary {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
}

export interface DepartmentWorkspaceResponse {
  department: {
    id: string;
    name: string;
    code: string;
    headOfDepartment: DepartmentHeadSummary | null;
  };
  metrics: {
    employeeCount: number;
    assignedAssetCount: number;
    openTicketCount: number;
  };
}

export interface DepartmentEmployeesArgs {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface DepartmentEmployee {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { assignedAssets: number };
}

export interface DepartmentEmployeesResponse {
  data: DepartmentEmployee[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DepartmentAssetsArgs {
  q?: string;
  type?: AssetType;
  condition?: AssetCondition;
  page?: number;
  pageSize?: number;
}

export interface DepartmentAsset {
  id: string;
  assetTag: string;
  serialNumber: string;
  type: AssetType;
  customType: string | null;
  make: string;
  model: string;
  condition: AssetCondition;
  warrantyExpiry: string | null;
  assignedTo: {
    id: string;
    staffId: string;
    fullName: string;
    email: string;
    department: { id: string; name: string };
  };
}

export interface DepartmentAssetsResponse {
  data: DepartmentAsset[];
  page: number;
  pageSize: number;
  total: number;
}
