import { appApi } from '../app-api'

export type GatePass = { id: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXITED' | 'RETURNED' | 'EXPIRED'; reason: string; destination: string; expectedReturnAt: string | null; createdAt: string; asset: { assetTag: string; make: string; model: string; type: string }; requester: { fullName: string; email: string; department: { name: string } } }
export const gatesApi = appApi.injectEndpoints({ endpoints: builder => ({
  getGatePasses: builder.query<GatePass[], void>({ query: () => '/gate-passes', providesTags: ['GatePass'] }),
  createGatePass: builder.mutation<GatePass, { assetId: string; reason: string; destination: string; expectedReturnAt?: string }>({ query: body => ({ url: '/gate-passes', method: 'POST', body }), invalidatesTags: ['GatePass', 'Dashboard'] }),
  reviewGatePass: builder.mutation<GatePass, { id: string; status: 'APPROVED' | 'REJECTED'; reviewNote?: string }>({ query: ({ id, ...body }) => ({ url: `/gate-passes/${id}/review`, method: 'PATCH', body }), invalidatesTags: ['GatePass', 'Dashboard'] }),
  markGateExit: builder.mutation<GatePass, string>({ query: id => ({ url: `/gate-passes/${id}/exit`, method: 'POST' }), invalidatesTags: ['GatePass', 'Dashboard'] }),
  markGateReturn: builder.mutation<GatePass, string>({ query: id => ({ url: `/gate-passes/${id}/return`, method: 'POST' }), invalidatesTags: ['GatePass', 'Dashboard'] }),
}) })
export const { useGetGatePassesQuery, useReviewGatePassMutation, useMarkGateExitMutation, useMarkGateReturnMutation } = gatesApi
