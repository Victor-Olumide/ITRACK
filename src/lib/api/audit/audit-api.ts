import { appApi } from '../app-api'

export const AUDIT_ENTITY_TYPES = [
  'ticket',
  'gate-pass',
  'asset-request',
  'asset',
  'asset-model',
  'user',
  'category',
  'sla',
  'stock',
] as const

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number]

export interface AuditEvent {
  id: string
  actorId: string | null
  actorName: string | null
  action: string
  entityType: AuditEntityType
  entityId: string | null
  summary: string
  metadata: unknown
  createdAt: string
}

export interface AuditQuery {
  entityType?: AuditEntityType
  q?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface AuditResponse {
  items: AuditEvent[]
  total: number
  page: number
  pageSize: number
}

export const auditApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditEvents: builder.query<AuditResponse, AuditQuery>({
      query: (params) => {
        const search = new URLSearchParams()
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== '') search.set(key, String(value))
        }
        return `/audit?${search.toString()}`
      },
      providesTags: ['Audit'],
    }),
  }),
})

export const { useGetAuditEventsQuery } = auditApi
