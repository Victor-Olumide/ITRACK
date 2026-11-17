import { appApi } from "@/lib/api/app-api";
import { toAssignTicketBody } from "./ticket-form";
import type {
  AssignTicketRequest,
  ChangeTicketStatusRequest,
  CreateTicketRequest,
  DeleteTicketAttachmentResponse,
  TicketApiAttachment,
  TicketApiAttachmentDetail,
  TicketApiRecord,
  TicketListArgs,
  TicketListResponse,
  UpdateTicketRequest,
  TicketSuggestionRequest,
  TicketSuggestionResponse,
} from "./types";

function ticketListUrl(args: TicketListArgs = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const query = params.toString();

  return `/tickets${query ? `?${query}` : ""}`;
}

export const ticketsApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<TicketListResponse, TicketListArgs | void>({
      query: (args) => ticketListUrl(args ?? {}),
      providesTags: (result) => [
        { type: "Ticket", id: "LIST" },
        ...(result?.data.map(({ id }) => ({
          type: "Ticket" as const,
          id,
        })) ?? []),
      ],
    }),

    getTicket: builder.query<TicketApiRecord, string>({
      query: (id) => `/tickets/${encodeURIComponent(id)}`,
      providesTags: (result, _error, id) => [
        { type: "Ticket", id },
        ...(result && result.id !== id
          ? [{ type: "Ticket" as const, id: result.id }]
          : []),
      ],
    }),

    createTicket: builder.mutation<TicketApiRecord, CreateTicketRequest>({
      query: (body) => ({
        url: "/tickets",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Ticket", id: "LIST" }],
    }),

    suggestTicket: builder.mutation<
      TicketSuggestionResponse,
      TicketSuggestionRequest
    >({
      query: (body) => ({
        url: "/tickets/suggest",
        method: "POST",
        body,
      }),
    }),

    updateTicket: builder.mutation<
      TicketApiRecord,
      { id: string; body: UpdateTicketRequest }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Ticket", id },
        { type: "Ticket", id: "LIST" },
      ],
    }),

    changeTicketStatus: builder.mutation<
      TicketApiRecord,
      { id: string; body: ChangeTicketStatusRequest }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${encodeURIComponent(id)}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Ticket", id },
        { type: "Ticket", id: "LIST" },
      ],
    }),

    assignTicket: builder.mutation<
      TicketApiRecord,
      { id: string } & AssignTicketRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/tickets/${encodeURIComponent(id)}/assign`,
        method: "POST",
        body: toAssignTicketBody(body),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Ticket", id },
        { type: "Ticket", id: "LIST" },
      ],
    }),

    addTicketComment: builder.mutation<
      TicketApiRecord,
      { id: string; body: string; isInternal: boolean }
    >({
      query: ({ id, body, isInternal }) => ({
        url: `/tickets/${encodeURIComponent(id)}/comments`,
        method: "POST",
        body: { body, isInternal },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Ticket", id }],
    }),

    uploadTicketAttachments: builder.mutation<
      TicketApiAttachment[],
      { ticketId: string; files: File[] }
    >({
      query: ({ ticketId, files }) => {
        const formData = new FormData();

        files.forEach((file) => {
          formData.append("files", file);
        });

        return {
          url: `/tickets/${encodeURIComponent(ticketId)}/attachments`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: "Ticket", id: ticketId },
        { type: "Ticket", id: "LIST" },
      ],
    }),

    getTicketAttachments: builder.query<TicketApiAttachment[], string>({
      query: (ticketId) =>
        `/tickets/${encodeURIComponent(ticketId)}/attachments`,
      providesTags: (_result, _error, ticketId) => [
        { type: "Ticket", id: ticketId },
      ],
    }),

    getTicketAttachment: builder.query<
      TicketApiAttachmentDetail,
      { ticketId: string; attachmentId: string }
    >({
      query: ({ ticketId, attachmentId }) =>
        `/tickets/${encodeURIComponent(ticketId)}/attachments/${encodeURIComponent(attachmentId)}`,
    }),

    deleteTicketAttachment: builder.mutation<
      DeleteTicketAttachmentResponse,
      { ticketId: string; attachmentId: string }
    >({
      query: ({ ticketId, attachmentId }) => ({
        url: `/tickets/${encodeURIComponent(ticketId)}/attachments/${encodeURIComponent(attachmentId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: "Ticket", id: ticketId },
        { type: "Ticket", id: "LIST" },
      ],
    }),

    deleteTicket: builder.mutation<{ id: string; number: string }, string>({
      query: (id) => ({
        url: `/tickets/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Ticket", id },
        { type: "Ticket", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useSuggestTicketMutation,
  useUpdateTicketMutation,
  useChangeTicketStatusMutation,
  useAssignTicketMutation,
  useAddTicketCommentMutation,
  useUploadTicketAttachmentsMutation,
  useGetTicketAttachmentsQuery,
  useGetTicketAttachmentQuery,
  useDeleteTicketAttachmentMutation,
  useDeleteTicketMutation,
} = ticketsApi;
