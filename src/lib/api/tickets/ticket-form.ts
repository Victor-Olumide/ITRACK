import type { CreateTicketRequest } from './types'

export type ReportTicketFields = Omit<CreateTicketRequest, 'assetId'>

export function toCreateTicketRequest(
  fields: ReportTicketFields,
  assetId: string,
): CreateTicketRequest {
  return {
    ...fields,
    ...(assetId ? { assetId } : {}),
  }
}
