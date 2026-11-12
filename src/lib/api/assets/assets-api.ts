import { appApi } from '@/lib/api/app-api';
import type {
  AssetDetail,
  AssetListArgs,
  AssetListResponse,
  AssetApiRecord,
  CreateAssetRequest,
  UpdateAssetRequest,
} from './types';

function assetListUrl(args: AssetListArgs = {}) {
  const params = new URLSearchParams();
  Object.entries(args).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return `/assets${query ? `?${query}` : ''}`;
}

export const assetsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<AssetListResponse, AssetListArgs | void>({
      query: (args) => assetListUrl(args ?? {}),
      providesTags: (result) => [
        { type: 'Device', id: 'LIST' },
        ...(result?.data.map((asset) => ({ type: 'Device' as const, id: asset.id })) ?? []),
      ],
    }),
    getAsset: builder.query<AssetDetail, string>({
      query: (id) => `/assets/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Device', id }],
    }),
    createAsset: builder.mutation<AssetApiRecord, CreateAssetRequest>({
      query: (body) => ({ url: '/assets', method: 'POST', body }),
      invalidatesTags: [{ type: 'Device', id: 'LIST' }],
    }),
    updateAsset: builder.mutation<AssetApiRecord, { id: string; body: UpdateAssetRequest }>({
      query: ({ id, body }) => ({ url: `/assets/${encodeURIComponent(id)}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Device', id }, { type: 'Device', id: 'LIST' }],
    }),
    retireAsset: builder.mutation<AssetApiRecord, string>({
      query: (id) => ({ url: `/assets/${encodeURIComponent(id)}/retire`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Device', id }, { type: 'Device', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAssetsQuery,
  useGetAssetQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useRetireAssetMutation,
} = assetsApi;
