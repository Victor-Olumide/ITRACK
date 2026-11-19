import { appApi } from '../app-api'
import type {
  CreateGatePassRequest,
  GateAssetLookup,
  GateCheckResult,
  GateLog,
  GatePass,
  HandoverGatePassRequest,
  MyGateAsset,
  ReviewGatePassRequest,
} from './types'

const passTags = (id: string) => [{ type: 'GatePass' as const, id }, { type: 'GatePass' as const, id: 'LIST' }, 'Dashboard' as const]

export const gatesApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getGatePasses: builder.query<GatePass[], void>({
      query: () => '/gate-passes',
      providesTags: [{ type: 'GatePass', id: 'LIST' }],
    }),
    getGatePass: builder.query<GatePass, string>({
      query: (id) => `/gate-passes/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'GatePass', id }],
    }),
    getMyGateAssets: builder.query<MyGateAsset[], void>({
      query: () => '/gate-passes/my-assets',
      providesTags: [{ type: 'GatePass', id: 'MY_ASSETS' }],
    }),
    lookupGateAsset: builder.query<GateAssetLookup, string>({
      query: (tag) => ({ url: '/gate-passes/assets/lookup', params: { tag } }),
    }),
    gateCheck: builder.query<GateCheckResult, string>({
      query: (tag) => ({ url: '/gate-passes/gate-check', params: { tag } }),
      keepUnusedDataFor: 0,
    }),
    getGateLog: builder.query<GateLog, string | void>({
      query: (from) => ({ url: '/gate-passes/gate-log', params: from ? { from } : undefined }),
      providesTags: [{ type: 'GatePass', id: 'LOG' }],
    }),
    createGatePass: builder.mutation<GatePass, CreateGatePassRequest>({
      query: (body) => ({ url: '/gate-passes', method: 'POST', body }),
      invalidatesTags: [{ type: 'GatePass', id: 'LIST' }, { type: 'GatePass', id: 'MY_ASSETS' }, 'Dashboard'],
    }),
    reviewGatePass: builder.mutation<GatePass, ReviewGatePassRequest>({
      query: ({ id, ...body }) => ({ url: `/gate-passes/${id}/review`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [...passTags(id), { type: 'GatePass', id: 'MY_ASSETS' }, 'Signature'],
    }),
    handoverGatePass: builder.mutation<GatePass, HandoverGatePassRequest>({
      query: ({ id, ...body }) => ({ url: `/gate-passes/${id}/handover`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => passTags(id),
    }),
    markGateExit: builder.mutation<GatePass, { id: string; seenItemIds: string[]; gate?: string }>({
      query: ({ id, ...body }) => ({ url: `/gate-passes/${id}/exit`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => [...passTags(id), { type: 'GatePass', id: 'LOG' }],
    }),
    markGateReturn: builder.mutation<
      GatePass,
      { id: string; items: { id: string; returned: boolean; conditionIn?: string }[]; note?: string; gate?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/gate-passes/${id}/return`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => [
        ...passTags(id),
        { type: 'GatePass', id: 'LOG' },
        { type: 'GatePass', id: 'MY_ASSETS' },
      ],
    }),
    logGateStop: builder.mutation<unknown, { assetTag: string; note?: string; gate?: string }>({
      query: (body) => ({ url: '/gate-passes/stops', method: 'POST', body }),
      invalidatesTags: [{ type: 'GatePass', id: 'LOG' }],
    }),
  }),
})

export const {
  useGetGatePassesQuery,
  useGetGatePassQuery,
  useGetMyGateAssetsQuery,
  useLazyLookupGateAssetQuery,
  useLazyGateCheckQuery,
  useGetGateLogQuery,
  useCreateGatePassMutation,
  useReviewGatePassMutation,
  useHandoverGatePassMutation,
  useMarkGateExitMutation,
  useMarkGateReturnMutation,
  useLogGateStopMutation,
} = gatesApi
