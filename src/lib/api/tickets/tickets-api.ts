import { appApi } from '@/lib/api/app-api';
import type {
  ChangeTicketStatusRequest,
  CreateTicketRequest,
  TicketApiRecord,
  TicketListArgs,
  TicketListResponse,
  UpdateTicketRequest,
} from './types';

function ticketListUrl(args: TicketListArgs = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const query = params.toString();
  return `/tickets${query ? `?${query}` : ''}`;
}

export const ticketsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<TicketListResponse, TicketListArgs | void>({
      query: (args) => ticketListUrl(args ?? {}),
      providesTags: (result) => [
        { type: 'Ticket', id: 'LIST' },
        ...(result?.data.map(({ id }) => ({ type: 'Ticket' as const, id })) ?? []),
      ],
    }),
    getTicket: builder.query<TicketApiRecord, string>({
      query: (id) => `/tickets/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Ticket', id }],
    }),
    createTicket: builder.mutation<TicketApiRecord, CreateTicketRequest>({
      query: (body) => ({ url: '/tickets', method: 'POST', body }),
      invalidatesTags: [{ type: 'Ticket', id: 'LIST' }],
    }),
    updateTicket: builder.mutation<
      TicketApiRecord,
      { id: string; body: UpdateTicketRequest }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Ticket', id },
        { type: 'Ticket', id: 'LIST' },
      ],
    }),
    changeTicketStatus: builder.mutation<
      TicketApiRecord,
      { id: string; body: ChangeTicketStatusRequest }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${encodeURIComponent(id)}/status`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Ticket', id },
        { type: 'Ticket', id: 'LIST' },
      ],
    }),
    assignTicket: builder.mutation<
      TicketApiRecord,
      { id: string; assigneeId?: string }
    >({
      query: ({ id, assigneeId }) => ({
        url: `/tickets/${encodeURIComponent(id)}/assign`,
        method: 'POST',
        body: assigneeId ? { assigneeId } : {},
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Ticket', id },
        { type: 'Ticket', id: 'LIST' },
      ],
    }),
    addTicketComment: builder.mutation<
      TicketApiRecord,
      { id: string; body: string; isInternal: boolean }
    >({
      query: ({ id, body, isInternal }) => ({
        url: `/tickets/${encodeURIComponent(id)}/comments`,
        method: 'POST',
        body: { body, isInternal },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Ticket', id }],
    }),
    deleteTicket: builder.mutation<{ id: string; number: string }, string>({
      query: (id) => ({
        url: `/tickets/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Ticket', id },
        { type: 'Ticket', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useChangeTicketStatusMutation,
  useAssignTicketMutation,
  useAddTicketCommentMutation,
  useDeleteTicketMutation,
} = ticketsApi;
