import { appApi } from '../app-api'

export type ServerTicketPriority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW' | 'P5_PLANNING'

export interface TicketCategory {
  id: string
  name: string
  defaultPriority: ServerTicketPriority
  keywords: string[]
  ticketCount: number
  createdAt: string
  updatedAt: string
}

export interface CategoryInput {
  name: string
  defaultPriority: ServerTicketPriority
  keywords: string[]
}

export interface SlaTarget {
  priority: ServerTicketPriority
  responseMinutes: number | null
  resolveMinutes: number | null
  isDefault: boolean
  updatedAt: string | null
}

export interface SlaTargetInput {
  priority: ServerTicketPriority
  responseMinutes: number | null
  resolveMinutes: number
}

export const catalogApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<TicketCategory[], void>({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation<TicketCategory, CategoryInput>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category', 'Audit'],
    }),
    updateCategory: builder.mutation<TicketCategory, { id: string } & Partial<CategoryInput>>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Category', 'Ticket', 'Audit'],
    }),
    deleteCategory: builder.mutation<{ id: string; deleted: true }, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category', 'Audit'],
    }),
    getSlaTargets: builder.query<SlaTarget[], void>({
      query: () => '/sla-targets',
      providesTags: [{ type: 'Category', id: 'SLA' }],
    }),
    // New targets change which tickets are overdue, so tickets and the dashboard refetch.
    updateSlaTargets: builder.mutation<SlaTarget[], SlaTargetInput[]>({
      query: (targets) => ({ url: '/sla-targets', method: 'PUT', body: { targets } }),
      invalidatesTags: [{ type: 'Category', id: 'SLA' }, 'Ticket', 'Dashboard', 'Audit'],
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetSlaTargetsQuery,
  useUpdateSlaTargetsMutation,
} = catalogApi
