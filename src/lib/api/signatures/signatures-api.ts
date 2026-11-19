import { appApi } from '../app-api'

// Server contracts for /me/signature (itrack-server src/signatures).
export interface MySignature {
  hasPin: boolean
  signature: {
    image: string
    sha256: string
    setAt: string
    usedOnPasses: number
  } | null
}

export const signaturesApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getMySignature: builder.query<MySignature, void>({
      query: () => '/me/signature',
      providesTags: ['Signature'],
    }),
    saveMySignature: builder.mutation<MySignature, { image: string; pin: string; newPin?: string }>({
      query: (body) => ({ url: '/me/signature', method: 'PUT', body }),
      invalidatesTags: ['Signature'],
    }),
    removeMySignature: builder.mutation<MySignature, { pin: string }>({
      query: (body) => ({ url: '/me/signature', method: 'DELETE', body }),
      invalidatesTags: ['Signature'],
    }),
  }),
})

export const {
  useGetMySignatureQuery,
  useSaveMySignatureMutation,
  useRemoveMySignatureMutation,
} = signaturesApi
