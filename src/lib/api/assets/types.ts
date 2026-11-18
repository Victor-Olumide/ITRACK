
export type AssetType =
  | 'LAPTOP'
  | 'DESKTOP'
  | 'PRINTER'
  | 'NETWORK'
  | 'OTHER';

export type AssetCondition =
  | 'NEW'
  | 'GOOD'
  | 'FAIR'
  | 'FAULTY'
  | 'RETIRED';

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
  customType: string | null;
  make: string;
  model: string;
  modelId?: string | null;
  imageFileName?: string | null;
  imageUrl?: string | null;
  modelFileName?: string | null;
  modelUrl?: string | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  condition: AssetCondition;
  notes: string | null;
  assignedToId: string | null;
  assignedTo?: AssetUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetModelRecord {
  id: string;
  type: AssetType;
  make: string;
  model: string;
  imageFileName: string | null;
  imageUrl: string | null;
  modelFileName: string | null;
  modelUrl: string | null;
}

export interface AssetModelsResponse {
  data: AssetModelRecord[];
  total: number;
}

export interface AvailableAssetTag {
  id: string;
  tag: string;
  type: AssetType;
  status: 'AVAILABLE';
}

export interface AvailableAssetTagsResponse {
  data: AvailableAssetTag[];
  total: number;
}

export interface AssetDetail extends AssetApiRecord {
  assignmentHistory: Array<{
    id: string;
    previousAssigneeId: string | null;
    previousAssigneeName: string | null;
    newAssigneeId: string | null;
    newAssigneeName: string | null;
    createdAt: string;
    changedBy: {
      id: string;
      fullName: string;
    };
  }>;
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
  assignedToId?: string | 'assigned' | 'unassigned';
  warrantyExpiringWithinDays?: number;
  includeRetired?: boolean;
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
  assetTag?: string;
  serialNumber: string;
  type: AssetType;
  customType?: string | null;
  make: string;
  model: string;
  modelId?: string | null;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  condition?: AssetCondition;
  notes?: string | null;
  assignedToId?: string | null;
}

export type UpdateAssetRequest = Partial<CreateAssetRequest>;

export interface CreateAssetMutationArgs {
  data: CreateAssetRequest;
  imageFile?: File | null;
}

export interface CreateAssetModelRequest {
  type: AssetType;
  make: string;
  model: string;
  modelFile?: File | null;
  imageFile?: File | null;
}
