export type AssetType = 'LAPTOP' | 'DESKTOP' | 'PRINTER' | 'NETWORK' | 'OTHER';
export type AssetCondition = 'NEW' | 'GOOD' | 'FAIR' | 'FAULTY' | 'RETIRED';

export interface AssetUser {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  role: string;
}

export interface AssetApiRecord {
  id: string;
  assetTag: string;
  serialNumber: string;
  type: AssetType;
  make: string;
  model: string;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  condition: AssetCondition;
  notes: string | null;
  assignedToId: string | null;
  assignedTo?: AssetUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDetail extends AssetApiRecord {
  tickets: Array<{
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

export interface AssetListArgs {
  q?: string;
  type?: AssetType;
  condition?: AssetCondition;
  assignedToId?: string | 'unassigned';
  page?: number;
  pageSize?: number;
}

export interface AssetListResponse {
  data: AssetApiRecord[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateAssetRequest {
  assetTag: string;
  serialNumber: string;
  type: AssetType;
  make: string;
  model: string;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  condition?: AssetCondition;
  notes?: string | null;
  assignedToId?: string | null;
}

export type UpdateAssetRequest = Partial<CreateAssetRequest>;
