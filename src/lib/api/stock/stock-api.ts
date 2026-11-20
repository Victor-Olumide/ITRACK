import { appApi } from '../app-api'

export type StockKind = 'ACCESSORY' | 'PART' | 'CONSUMABLE' | 'LICENCE'
export type LicenceStatus = 'OK' | 'EXPIRING' | 'EXPIRED'

export interface StockItem {
  id: string
  kind: StockKind
  name: string
  sku: string | null
  unit: string
  // On-hand count; for licences, unassigned seats.
  quantity: number
  reorderLevel: number
  location: string | null
  vendor: string | null
  licenceExpiresAt: string | null
  notes: string | null
  isArchived: boolean
  isLow: boolean
  licenceStatus: LicenceStatus | null
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  delta: number
  quantityAfter: number
  reason: string
  createdAt: string
  actor: { id: string; fullName: string }
}

export interface StockItemDetail extends StockItem {
  movements: StockMovement[]
}

export interface StockSummary {
  totalItems: number
  lowStock: number
  licencesExpiringSoon: number
  licencesExpired: number
}

export interface StockQuery {
  kind?: StockKind
  q?: string
  lowStock?: boolean
  includeArchived?: boolean
}

export interface CreateStockItem {
  kind: StockKind
  name: string
  sku?: string | null
  unit?: string
  quantity?: number
  reorderLevel?: number
  location?: string | null
  vendor?: string | null
  licenceExpiresAt?: string | null
  notes?: string | null
}

export type UpdateStockItem = Partial<Omit<CreateStockItem, 'kind' | 'quantity'>> & { isArchived?: boolean }

export const stockApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query<StockItem[], StockQuery>({
      query: (params) => {
        const search = new URLSearchParams()
        if (params.kind) search.set('kind', params.kind)
        if (params.q) search.set('q', params.q)
        if (params.lowStock) search.set('lowStock', 'true')
        if (params.includeArchived) search.set('includeArchived', 'true')
        const qs = search.toString()
        return `/stock${qs ? `?${qs}` : ''}`
      },
      providesTags: ['Stock'],
    }),
    getStockSummary: builder.query<StockSummary, void>({
      query: () => '/stock/summary',
      providesTags: ['Stock'],
    }),
    getStockItem: builder.query<StockItemDetail, string>({
      query: (id) => `/stock/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Stock', id }],
    }),
    createStockItem: builder.mutation<StockItem, CreateStockItem>({
      query: (body) => ({ url: '/stock', method: 'POST', body }),
      invalidatesTags: ['Stock', 'Audit'],
    }),
    updateStockItem: builder.mutation<StockItem, { id: string } & UpdateStockItem>({
      query: ({ id, ...body }) => ({ url: `/stock/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => ['Stock', { type: 'Stock', id }, 'Audit'],
    }),
    adjustStock: builder.mutation<StockItem, { id: string; delta: number; reason: string }>({
      query: ({ id, ...body }) => ({ url: `/stock/${id}/adjust`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => ['Stock', { type: 'Stock', id }, 'Audit', 'Notification'],
    }),
  }),
})

export const {
  useGetStockQuery,
  useGetStockSummaryQuery,
  useGetStockItemQuery,
  useCreateStockItemMutation,
  useUpdateStockItemMutation,
  useAdjustStockMutation,
} = stockApi
