
import { appApi } from '@/lib/api/app-api';

import type {
  AssetDetail,
  AssetListArgs,
  AssetListResponse,
  AssetApiRecord,
  AssetModelsResponse,
  AvailableAssetTagsResponse,
  CreateAssetMutationArgs,
  CreateAssetModelRequest,
  UpdateAssetRequest,
  AssetModelRecord,
  AssetType,
} from './types';

function assetListUrl(args: AssetListArgs = {}) {
  const params = new URLSearchParams();

  Object.entries(args).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return `/assets${query ? `?${query}` : ''}`;
}

function createAssetFormData({
  data,
  imageFile,
}: CreateAssetMutationArgs) {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });

  if (imageFile) {
    formData.append('imageFile', imageFile);
  }

  return formData;
}

function createAssetModelFormData(data: CreateAssetModelRequest) {
  const formData = new FormData();

  formData.append('type', data.type);
  formData.append('make', data.make);
  formData.append('model', data.model);

  if (data.modelFile) {
    formData.append('modelFile', data.modelFile);
  }

  if (data.imageFile) {
    formData.append('imageFile', data.imageFile);
  }

  return formData;
}

export const assetsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<AssetListResponse, AssetListArgs | void>({
      query: (args) => assetListUrl(args ?? {}),
      providesTags: (result) => [
        { type: 'Device', id: 'LIST' },
        ...(result?.data.map((asset) => ({
          type: 'Device' as const,
          id: asset.id,
        })) ?? []),
      ],
    }),

    getAsset: builder.query<AssetDetail, string>({
      query: (id) => `/assets/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [
        { type: 'Device', id },
      ],
    }),

    createAsset: builder.mutation<
      AssetApiRecord,
      CreateAssetMutationArgs
    >({
      query: (args) => ({
        url: '/assets',
        method: 'POST',
        body: createAssetFormData(args),
      }),
      invalidatesTags: (_result, _error, { data }) => [
        { type: 'Device', id: 'LIST' },
        { type: 'Device', id: `TAGS-${data.type}` },
      ],
    }),

    getAvailableAssetTags: builder.query<
      AvailableAssetTagsResponse,
      AssetType
    >({
      query: (type) =>
        `/assets/tags/available?type=${encodeURIComponent(type)}`,
      providesTags: (_result, _error, type) => [
        { type: 'Device', id: `TAGS-${type}` },
      ],
    }),

    getAssetModels: builder.query<
      AssetModelsResponse,
      AssetType | void
    >({
      query: (type) =>
        type
          ? `/assets/models?type=${encodeURIComponent(type)}`
          : '/assets/models',
      providesTags: (_result, _error, type) => [
        { type: 'Device', id: `MODELS-${type ?? 'ALL'}` },
      ],
    }),

    createAssetModel: builder.mutation<
      AssetModelRecord,
      CreateAssetModelRequest
    >({
      query: (data) => ({
        url: '/assets/models',
        method: 'POST',
        body: createAssetModelFormData(data),
      }),
      invalidatesTags: [
        { type: 'Device', id: 'MODELS-ALL' },
        { type: 'Device', id: 'MODELS-LAPTOP' },
        { type: 'Device', id: 'MODELS-DESKTOP' },
        { type: 'Device', id: 'MODELS-PRINTER' },
        { type: 'Device', id: 'MODELS-NETWORK' },
        { type: 'Device', id: 'MODELS-OTHER' },
      ],
    }),

    updateAsset: builder.mutation<
      AssetApiRecord,
      { id: string; body: UpdateAssetRequest }
    >({
      query: ({ id, body }) => ({
        url: `/assets/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Device', id },
        { type: 'Device', id: 'LIST' },
      ],
    }),

    retireAsset: builder.mutation<AssetApiRecord, string>({
      query: (id) => ({
        url: `/assets/${encodeURIComponent(id)}/retire`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Device', id },
        { type: 'Device', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAssetsQuery,
  useGetAssetQuery,
  useCreateAssetMutation,
  useGetAvailableAssetTagsQuery,
  useGetAssetModelsQuery,
  useCreateAssetModelMutation,
  useUpdateAssetMutation,
  useRetireAssetMutation,
} = assetsApi;
