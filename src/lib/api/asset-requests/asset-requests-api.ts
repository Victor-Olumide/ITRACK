import { appApi } from '../app-api'

export type AssetRequestType = 'NEW_DEVICE' | 'REPLACEMENT' | 'PERFORMANCE_UPGRADE' | 'ACCESSORY'
export type AssetRequestStatus = 'PENDING_DEPARTMENT_APPROVAL' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'PROCUREMENT_REQUIRED' | 'CANCELLED'
export type RequestAssetType = 'LAPTOP' | 'DESKTOP' | 'PRINTER' | 'NETWORK' | 'OTHER'

export interface AssetRequest {
  id: string
  type: AssetRequestType
  assetType: RequestAssetType | null
  customType: string | null
  requestedMake: string | null
  requestedModel: string | null
  requestedSpecs: string
  justification: string
  neededBy: string | null
  status: AssetRequestStatus
  reviewNote: string | null
  reviewedAt: string | null
  fulfilledAt: string | null
  procurementNote: string | null
  createdAt: string
  requester: { id: string; staffId: string; fullName: string; email: string; department: { id: string; name: string } }
  department: { id: string; name: string; code: string }
  departmentReviewer: { id: string; fullName: string; email: string } | null
  fulfiller: { id: string; fullName: string; email: string } | null
  assignedAsset: { id: string; assetTag: string; make: string; model: string; type: string; serialNumber: string } | null
}

export type CreateAssetRequest = {
  type: AssetRequestType
  assetType?: RequestAssetType | null
  customType?: string | null
  requestedMake?: string | null
  requestedModel?: string | null
  requestedSpecs: string
  justification: string
  neededBy?: string | null
}

export const assetRequestsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssetRequests: builder.query<AssetRequest[], void>({
      query: () => '/asset-requests',
      providesTags: ['AssetRequest'],
    }),
    createAssetRequest: builder.mutation<AssetRequest, CreateAssetRequest>({
      query: (body) => ({ url: '/asset-requests', method: 'POST', body }),
      invalidatesTags: ['AssetRequest'],
    }),
    reviewAssetRequest: builder.mutation<AssetRequest, { id: string; status: 'APPROVED' | 'REJECTED'; reviewNote?: string }>({
      query: ({ id, ...body }) => ({ url: `/asset-requests/${id}/review`, method: 'PATCH', body }),
      invalidatesTags: ['AssetRequest'],
    }),
    fulfillAssetRequest: builder.mutation<AssetRequest, { id: string; action: 'ASSIGN_EXISTING' | 'PROCUREMENT_REQUIRED'; assetId?: string; procurementNote?: string }>({
      query: ({ id, ...body }) => ({ url: `/asset-requests/${id}/fulfill`, method: 'POST', body }),
      invalidatesTags: ['AssetRequest', 'Device', 'Dashboard'],
    }),
  }),
})

export const {
  useGetAssetRequestsQuery,
  useCreateAssetRequestMutation,
  useReviewAssetRequestMutation,
  useFulfillAssetRequestMutation,
} = assetRequestsApi
