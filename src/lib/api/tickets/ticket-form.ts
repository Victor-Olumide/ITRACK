import type { AssignTicketRequest, CreateTicketRequest } from './types'

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

/** Body for POST /tickets/:id/assign; omits fields that were not provided. */
export function toAssignTicketBody({
  assigneeId,
  suggestedPriority,
}: AssignTicketRequest): AssignTicketRequest {
  return {
    ...(assigneeId ? { assigneeId } : {}),
    ...(suggestedPriority ? { suggestedPriority } : {}),
  }
}
