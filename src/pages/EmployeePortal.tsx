// Employee self-service home, ticket reporting, ticket status, and pass requests.

import { useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  Check,
  Laptop,
  Plus,
  Send,
  Ticket,
} from 'lucide-react'

import Badge from '../components/Badge'
import AssetTag from '../components/AssetTag'
import FileUpload from '../components/FileUpload'
import { useAuth } from '../contexts/AuthContext'
import type { PublicUser } from '../types/types'
import { useGetAssetsQuery } from '../lib/api/assets/assets-api'
import {
  useAddTicketCommentMutation,
  useChangeTicketStatusMutation,
  useCreateTicketMutation,
  useGetTicketQuery,
  useGetTicketsQuery,
  useUploadTicketAttachmentsMutation,
} from '../lib/api/tickets/tickets-api'
import { toCreateTicketRequest } from '../lib/api/tickets/ticket-form'
import { toClientTicket } from '../lib/api/tickets/ticket-mappers'
import {
  PRIORITY_SELECTED_CLASS,
  TICKET_PRIORITY_OPTIONS,
  toCreatePriorityFields,
  type SelectableTicketPriority,
} from '../lib/api/tickets/ticket-priority'
import { getApiErrorMessage } from '../lib/api/error-message'

function PageTitle({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Home({ viewer }: { viewer: PublicUser }) {
  const ticketsQuery = useGetTicketsQuery({ page: 1, pageSize: 100 })
  const assetsQuery = useGetAssetsQuery({ page: 1, pageSize: 100 })

  const myTickets = useMemo(
    () => (ticketsQuery.data?.data ?? []).map(toClientTicket),
    [ticketsQuery.data],
  )

  const employeeDevices = assetsQuery.data?.data ?? []
  const activeTickets = myTickets.filter(
    (ticket) => !['Resolved', 'Closed'].includes(ticket.status),
  )

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3155ff]">
            Employee home
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111a3b]">
            Good morning, {viewer.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {today} ·{' '}
            {ticketsQuery.isLoading
              ? 'Loading tickets…'
              : `${activeTickets.length} ticket${activeTickets.length === 1 ? '' : 's'} being worked on`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900">
            Gate passes unavailable
          </span>
          <Link
            to="/employee/report"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={14} /> Report a problem
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <section className="space-y-3 xl:col-span-3">
          <article className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#18203e]">
                Tickets in progress
              </h2>
              <Link
                to="/employee/tickets"
                className="text-xs font-semibold text-[#3155ff] hover:underline"
              >
                All my tickets
              </Link>
            </div>

            <div className="divide-y divide-[#edf0f7]">
              {ticketsQuery.isLoading ? (
                <p
                  role="status"
                  className="py-8 text-center text-sm text-slate-500"
                >
                  Loading tickets…
                </p>
              ) : ticketsQuery.isError ? (
                <div role="alert" className="p-4 text-center">
                  <p className="text-sm text-red-700">
                    {getApiErrorMessage(
                      ticketsQuery.error,
                      'Tickets could not be loaded.',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => void ticketsQuery.refetch()}
                    className="mt-2 text-xs font-semibold text-[#3155ff] hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                activeTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/employee/tickets?ticket=${ticket.id}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf1ff] text-[#3155ff]">
                      <Ticket size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#202844]">
                        {ticket.title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {ticket.status === 'Resolved' ? 'Closed' : ticket.status}{' '}
                        · {ticket.id}
                        {ticket.assigneeName
                          ? ` · ${ticket.assigneeName.split(' ')[0]}`
                          : ''}
                      </span>
                    </span>
                    <Badge
                      label={
                        ticket.status === 'In progress'
                          ? 'Being fixed'
                          : ticket.status
                      }
                    />
                  </Link>
                ))
              )}

              {!ticketsQuery.isLoading &&
                !ticketsQuery.isError &&
                activeTickets.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No open tickets right now.
                  </p>
                )}
            </div>
          </article>

          <article className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#18203e]">Gate passes</h2>
            </div>
            <p
              role="status"
              className="border-t border-[#edf0f7] py-5 text-sm leading-6 text-slate-600"
            >
              Gate-pass records and requests are not supported by the current
              v1 API.
            </p>
          </article>
        </section>

        <section className="space-y-3 xl:col-span-2">
          <article className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-bold text-[#18203e]">
              My devices
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Devices assigned to {viewer.name.split(' ')[0]}.
            </p>

            <div className="space-y-2">
              {assetsQuery.isError ? (
                <p role="alert" className="text-xs text-red-700">
                  Assigned devices could not be loaded.
                </p>
              ) : assetsQuery.isLoading ? (
                <p className="text-xs text-slate-500">Loading devices…</p>
              ) : (
                employeeDevices.map((device) => (
                  <Link
                    key={device.id}
                    to={`/employee/devices/${device.assetTag}`}
                    className="flex items-center gap-3 rounded-xl border border-[#edf0f7] p-3 transition hover:border-blue-200"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f3fb] text-slate-500">
                      <Laptop size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-[#202844]">
                        {device.make} {device.model}
                      </span>
                      <span className="mt-1 block">
                        <AssetTag tag={device.assetTag} size="sm" />
                      </span>
                    </span>
                    <ArrowRight size={14} className="text-slate-400" />
                  </Link>
                ))
              )}
            </div>

            <div className="mt-3 rounded-xl bg-[#f8f9fc] p-3 text-xs text-slate-500">
              Something missing?{' '}
              <Link
                to="/employee/report"
                className="font-semibold text-[#3155ff] hover:underline"
              >
                Tell IT
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
            <h2 className="text-sm font-bold text-[#202844]">
              Need help fast?
            </h2>
            <p className="mt-2 text-sm text-slate-600">IT desk · ext. 2040</p>
            <p className="mt-1 text-xs text-slate-500">
              Mon–Fri, 07:30–18:00
            </p>
          </article>
        </section>
      </div>
    </div>
  )
}

function ReportProblem({ viewer }: { viewer: PublicUser }) {
  const [createTicket, createTicketState] = useCreateTicketMutation()
  const [uploadTicketAttachments, uploadAttachmentsState] =
    useUploadTicketAttachmentsMutation()

  const assetsQuery = useGetAssetsQuery({ page: 1, pageSize: 100 })

  const [submitError, setSubmitError] = useState('')
  const [attachmentUploadError, setAttachmentUploadError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedTicketId, setSubmittedTicketId] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [category, setCategory] = useState('')
  const [selectedIssue, setSelectedIssue] = useState('')
  const [title, setTitle] = useState('')
  const [titleWasEdited, setTitleWasEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<SelectableTicketPriority | ''>('')

  const issueOptions = [
    {
      label: 'My computer is running slowly',
      detail: 'It takes a long time to start or open things.',
      category: 'PC hardware',
      title: 'Computer is running slowly',
      prompt:
        'When did it start? Is the whole computer slow, or only one app?',
    },
    {
      label: 'My computer will not turn on',
      detail: 'It does not start or show anything on the screen.',
      category: 'PC hardware',
      title: 'Computer will not turn on',
      prompt:
        'Does anything happen when you press the power button? Are any lights showing?',
    },
    {
      label: 'My computer is overheating',
      detail: 'It gets unusually hot or shuts down.',
      category: 'PC hardware',
      title: 'Computer is overheating',
      prompt:
        'When does it get hot? Does it shut down or make unusual noise?',
    },
    {
      label: 'I cannot connect to Wi-Fi or the internet',
      detail: 'The network is unavailable or keeps disconnecting.',
      category: 'Network / Wi-Fi',
      title: 'Unable to connect to the internet',
      prompt:
        'Can other devices connect to the same network? When did the connection problem begin?',
    },
    {
      label: 'I cannot sign in',
      detail: 'My password or account is not being accepted.',
      category: 'Account or password',
      title: 'Unable to sign in to my account',
      prompt:
        'Which account or application are you trying to access? What error message do you see?',
    },
    {
      label: 'An application is not working',
      detail: 'It crashes, freezes, or shows an error.',
      category: 'Software',
      title: 'Application is not working',
      prompt:
        'Which application is affected? What happens when you try to use it?',
    },
    {
      label: 'The printer is not working',
      detail: 'It will not print or the printout is incorrect.',
      category: 'Printer',
      title: 'Printer is not working',
      prompt:
        'Is the printer powered on and connected? Do you see an error message?',
    },
    {
      label: 'I need something from IT',
      detail: 'I need access, equipment, or another IT-related request.',
      category: 'Request something',
      title: 'IT assistance request',
      prompt: 'What do you need, and how will it help you with your work?',
    },
    {
      label: 'Something else',
      detail: 'My issue is not listed or I am not sure which option fits.',
      category: '',
      title: '',
      prompt:
        'What were you trying to do, what happened instead, and when did it start?',
    },
  ] as const

  const selectedIssueDetails = issueOptions.find(
    (issue) => issue.label === selectedIssue,
  )

  const availableAssets = assetsQuery.data?.data ?? []

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Check size={26} />
        </span>

        <h1 className="mt-5 text-2xl font-bold text-[#111a3b]">
          Your report is with IT
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Ticket {submittedTicketId} was saved. Follow updates from My tickets.
        </p>

        {attachmentUploadError && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm leading-6 text-amber-900"
          >
            Your ticket was created successfully, but the attachments could
            not be uploaded. Please contact IT and provide your ticket number.
            <span className="mt-1 block text-xs">{attachmentUploadError}</span>
          </p>
        )}

        <Link
          to={`${viewer.role === 'Employee' ? '/employee/tickets' : viewer.role === 'Department Head' ? '/department/tickets' : '/tickets'}?ticket=${submittedTicketId}`}
          className="mt-6 inline-flex rounded-full bg-[#3155ff] px-5 py-2.5 text-sm font-semibold text-white"
        >
          View tickets
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageTitle
        title="Report a problem"
        description="Three quick steps. IT sees it straight away."
      />

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(250px,0.7fr)]">
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            setSubmitError('')
            setAttachmentUploadError('')

            if (!priority) {
              setSubmitError('Choose how serious the problem is.')
              return
            }

            try {
              const request = toCreateTicketRequest(
                {
                  title: title.trim(),
                  description: description.trim(),
                  category:
                    category === 'Request something' ? 'Request' : category,
                  type:
                    category === 'Request something' ? 'REQUEST' : 'PROBLEM',
                  ...toCreatePriorityFields(priority),
                },
                selectedAssetId,
              )

              // Step 1: Create the ticket.
              const response = await createTicket(request).unwrap()

              setSubmittedTicketId(response.number)

              // Step 2: Upload attachments against the newly created ticket.
              // Use response.id, not response.number.
              if (selectedFiles.length > 0) {
                try {
                  await uploadTicketAttachments({
                    ticketId: response.id,
                    files: selectedFiles,
                  }).unwrap()
                } catch (error) {
                  setAttachmentUploadError(
                    getApiErrorMessage(
                      error,
                      'The ticket was created, but its attachments could not be uploaded.',
                    ),
                  )
                }
              }

              // The ticket is considered submitted even if attachment upload fails.
              setSubmitted(true)
            } catch (error) {
              setSubmitError(
                error && typeof error === 'object' && 'data' in error
                  ? String(
                      (error as {
                        data?: { error?: { message?: string } }
                      }).data?.error?.message ??
                        'Ticket could not be submitted. Try again.',
                    )
                  : 'Ticket could not be submitted. Check your connection and try again.',
              )
            }
          }}
          className="space-y-4"
        >
          <section className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
            <h2 className="text-sm font-bold text-[#202844]">
              1 · Which device?
            </h2>

            <label className="mt-3 block text-xs font-semibold text-slate-600">
              Link an asset (optional)
              <select
                value={selectedAssetId}
                onChange={(event) => setSelectedAssetId(event.target.value)}
                disabled={
                  assetsQuery.isLoading || availableAssets.length === 0
                }
                className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-400 disabled:bg-slate-50"
              >
                <option value="">No specific device</option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetTag} · {asset.make} {asset.model}
                  </option>
                ))}
              </select>
            </label>

            {assetsQuery.isLoading && (
              <p role="status" className="mt-2 text-xs text-slate-500">
                Loading available assets…
              </p>
            )}

            {assetsQuery.isError && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                Available assets could not be loaded. You can still submit
                without linking an asset.
              </p>
            )}

            {!assetsQuery.isLoading &&
              !assetsQuery.isError &&
              availableAssets.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No assets are currently assigned or available to link. You
                  can still submit your report.
                </p>
              )}
          </section>

          <section className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
            <h2 className="text-sm font-bold text-[#202844]">
              2 · What do you need help with?
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Choose the option that sounds closest to your problem. You do
              not need to know the technical name.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {issueOptions.map((issue) => (
                <button
                  key={issue.label}
                  type="button"
                  aria-pressed={selectedIssue === issue.label}
                  onClick={() => {
                    setSelectedIssue(issue.label)
                    setCategory(issue.category)
                    if (!titleWasEdited) setTitle(issue.title)
                  }}
                  className={`rounded-xl border p-3 text-left transition ${
                    selectedIssue === issue.label
                      ? 'border-[#3155ff] bg-[#f2f5ff] ring-1 ring-[#3155ff]'
                      : 'border-[#e4e9f2] bg-white hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`block text-xs font-semibold ${
                      selectedIssue === issue.label
                        ? 'text-[#3155ff]'
                        : 'text-[#202844]'
                    }`}
                  >
                    {issue.label}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                    {issue.detail}
                  </span>
                </button>
              ))}
            </div>

            {selectedIssue === 'Something else' && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  Which area is closest?
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Printer',
                    'Network / Wi-Fi',
                    'PC hardware',
                    'Software',
                    'Account or password',
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={category === item}
                      onClick={() => setCategory(item)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium ${
                        category === item
                          ? 'border-[#3155ff] bg-[#edf1ff] text-[#3155ff]'
                          : 'border-[#e4e9f2] bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-slate-500">
              Choose the closest match. You can explain the details in the next
              step.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
            <h2 className="text-sm font-bold text-[#202844]">
              3 · Tell us more
            </h2>

            <label className="mt-3 block text-xs font-semibold text-slate-600">
              Short title
              <input
                required
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setTitleWasEdited(true)
                }}
                placeholder="A short summary of the problem"
                className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-400"
              />
            </label>

            <label className="mt-3 block text-xs font-semibold text-slate-600">
              What happened?
              <textarea
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what happened, when it started, and what you have tried so far."
                rows={4}
                className="mt-1.5 w-full resize-y rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-400"
              />
              {selectedIssueDetails && (
                <span className="mt-1.5 block font-normal text-slate-500">
                  Helpful details: {selectedIssueDetails.prompt}
                </span>
              )}
            </label>

            <fieldset className="mt-4">
              <legend className="text-xs font-semibold text-slate-600">
                How serious is it?
              </legend>
              <p className="mt-1 text-xs text-slate-500">
                Your first assessment. IT may adjust it after reviewing the
                problem.
              </p>

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TICKET_PRIORITY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-xs transition focus-within:ring-2 focus-within:ring-blue-100 ${
                      priority === option.value
                        ? PRIORITY_SELECTED_CLASS[option.value]
                        : 'border-[#e4e9f2] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ticket-priority"
                      value={option.value}
                      checked={priority === option.value}
                      onChange={() => setPriority(option.value)}
                      className="mt-0.5 accent-current"
                    />
                    <span>
                      <span className="block font-semibold">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block font-normal opacity-80">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Attachments are uploaded after the ticket has been created. */}
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold text-slate-600">
                Attach photos or documents (optional)
              </p>
              <FileUpload
                files={selectedFiles}
                onChange={setSelectedFiles}
                maxFiles={5}
                maxFileSize={10 * 1024 * 1024}
                disabled={
                  createTicketState.isLoading ||
                  uploadAttachmentsState.isLoading
                }
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Images and PDF files only. Maximum 5 files, 10 MB each.
              </p>
            </div>

            <button
              type="submit"
              disabled={
                !category ||
                !priority ||
                title.trim().length < 5 ||
                description.trim().length < 10 ||
                createTicketState.isLoading ||
                uploadAttachmentsState.isLoading
              }
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3155ff] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Send size={15} />
              {createTicketState.isLoading
                ? 'Creating ticket…'
                : uploadAttachmentsState.isLoading
                  ? 'Uploading attachments…'
                  : 'Send to IT'}
            </button>

            {submitError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {submitError}
              </p>
            )}
          </section>
        </form>

        <aside className="space-y-3">
          <section className="rounded-2xl border border-[#e9edf6] bg-white p-4">
            <h2 className="text-sm font-bold text-[#202844]">
              What happens next
            </h2>
            <ol className="mt-3 space-y-3 text-xs leading-5 text-slate-500">
              <li>
                <strong className="text-[#202844]">1 · Sent to IT</strong>
                <br />
                Your team can see the details straight away.
              </li>
              <li>
                <strong className="text-[#202844]">2 · Someone picks it up</strong>
                <br />
                We’ll let you know when work begins.
              </li>
              <li>
                <strong className="text-[#202844]">3 · Track the fix</strong>
                <br />
                Reply to your ticket if anything changes.
              </li>
            </ol>
          </section>

          <section className="rounded-2xl border border-[#e9edf6] bg-white p-4">
            <h2 className="text-sm font-bold text-[#202844]">IT desk</h2>
            <p className="mt-2 text-xs text-slate-500">
              For urgent issues call ext. 2040, Mon–Fri 07:30–18:00.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}

function MyTickets() {
  const [status, setStatus] = useState('Open')
  const [searchParams, setSearchParams] = useSearchParams()
  const ticketsQuery = useGetTicketsQuery({ page: 1, pageSize: 100 })

  const requestedTicketId = searchParams.get('ticket')
  const [selectedId, setSelectedId] = useState(requestedTicketId ?? '')
  const [query, setQuery] = useState('')

  const myTickets = useMemo(
    () => (ticketsQuery.data?.data ?? []).map(toClientTicket),
    [ticketsQuery.data],
  )

  const activeSelectedId =
    requestedTicketId ?? (selectedId || myTickets[0]?.id || '')

  const detailQuery = useGetTicketQuery(activeSelectedId, {
    skip: !activeSelectedId,
  })

  const [changeStatus, changeStatusState] = useChangeTicketStatusMutation()
  const [addComment, addCommentState] = useAddTicketCommentMutation()

  const [reply, setReply] = useState('')
  const [actionError, setActionError] = useState('')

  const selected =
    myTickets.find((ticket) => ticket.id === requestedTicketId) ??
    (detailQuery.data
      ? toClientTicket(detailQuery.data)
      : myTickets.find((ticket) => ticket.id === activeSelectedId))

  const filtered = useMemo(
    () =>
      myTickets.filter((ticket) => {
        const statusMatches =
          status === 'All' ||
          (status === 'Open'
            ? !['Resolved', 'Closed'].includes(ticket.status)
            : ['Resolved', 'Closed'].includes(ticket.status))

        return (
          statusMatches &&
          `${ticket.title} ${ticket.id}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      }),
    [myTickets, status, query],
  )

  const openCount = myTickets.filter(
    (ticket) => !['Resolved', 'Closed'].includes(ticket.status),
  ).length

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageTitle
        title="My tickets"
        description={
          ticketsQuery.isLoading
            ? 'Loading tickets…'
            : `${openCount} open · ${myTickets.length - openCount} closed`
        }
      >
        <Link
          to="/employee/report"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={14} /> Report a problem
        </Link>
      </PageTitle>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#e9edf6] bg-white">
          <div className="flex flex-wrap gap-1 border-b border-[#edf0f7] p-3">
            {['Open', 'Closed', 'All'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${
                  status === item
                    ? 'bg-[#101c52] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item}
              </button>
            ))}

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search my tickets"
              className="ml-auto min-w-20 flex-1 rounded-full bg-[#f6f7fb] px-3 py-2 text-xs outline-none sm:flex-none"
            />
          </div>

          <div className="divide-y divide-[#edf0f7]">
            {ticketsQuery.isFetching && !ticketsQuery.isLoading && (
              <p role="status" className="px-4 py-2 text-xs text-slate-500">
                Updating tickets…
              </p>
            )}

            {ticketsQuery.isLoading ? (
              <p
                role="status"
                className="p-8 text-center text-sm text-slate-500"
              >
                Loading tickets…
              </p>
            ) : ticketsQuery.isError ? (
              <div role="alert" className="p-8 text-center">
                <p className="text-sm text-red-700">
                  {getApiErrorMessage(
                    ticketsQuery.error,
                    'Tickets could not be loaded.',
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => void ticketsQuery.refetch()}
                  className="mt-2 text-xs font-semibold text-[#3155ff] hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              filtered.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(ticket.id)
                    setSearchParams({ ticket: ticket.id })
                  }}
                  className={`w-full px-4 py-4 text-left transition hover:bg-[#f8faff] ${
                    activeSelectedId === ticket.id ? 'bg-[#f5f7ff]' : ''
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-[#202844]">
                      {ticket.title}
                    </span>
                    <Badge
                      label={
                        ticket.status === 'In progress'
                          ? 'Being fixed'
                          : ticket.status
                      }
                    />
                  </span>
                  <span className="mt-1.5 block text-xs text-slate-500">
                    {ticket.id} · Updated today
                  </span>
                </button>
              ))
            )}

            {!ticketsQuery.isLoading &&
              !ticketsQuery.isError &&
              filtered.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-500">
                  No tickets match this view.
                </p>
              )}
          </div>
        </section>

        {selected ? (
          <section className="rounded-2xl border border-[#e9edf6] bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {selected.id}
              </span>
              <Badge label={selected.priority} />
              <Badge label={selected.category} />
            </div>

            <h2 className="mt-3 text-xl font-bold text-[#18203e]">
              {selected.title}
            </h2>

            <div className="mt-5 flex flex-wrap gap-2 text-[8px] font-semibold">
              {['Sent', 'Picked up', 'Being fixed', 'Fixed'].map(
                (step, index) => (
                  <span
                    key={step}
                    className={`rounded-full px-3 py-2 ${
                      index <= (selected.status === 'Resolved' ? 3 : 2)
                        ? 'bg-[#edf1ff] text-[#3155ff]'
                        : 'bg-[#f2f4f8] text-slate-400'
                    }`}
                  >
                    {step}
                  </span>
                ),
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f8f9fc] p-3">
                <p className="text-[8px] text-slate-500">Working on it</p>
                <p className="mt-1 text-sm font-semibold text-[#202844]">
                  {selected.assigneeName ?? 'Waiting for someone'}
                </p>
              </div>
              <div className="rounded-xl bg-[#f8f9fc] p-3">
                <p className="text-[8px] text-slate-500">Resolution target</p>
                <p className="mt-1 text-sm font-semibold text-[#202844]">
                  {selected.resolution}
                </p>
              </div>
            </div>

            <p className="mt-4 rounded-xl border border-[#edf0f7] p-4 text-sm leading-6 text-slate-600">
              {selected.description}
            </p>

            <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">
              Updates
            </h3>

            <div className="mt-2 space-y-2">
              {selected.history.map((entry, index) => (
                <div
                  key={`${entry.time}-${index}`}
                  className="rounded-xl bg-[#f8f9fc] p-3"
                >
                  <p className="text-[8px] font-semibold text-slate-500">
                    {entry.time}
                  </p>
                  <p className="mt-1 text-xs text-[#202844]">{entry.text}</p>
                </div>
              ))}
            </div>

            {selected.status === 'Resolved' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={changeStatusState.isLoading}
                  onClick={() =>
                    void changeStatus({
                      id: selected.serverId ?? selected.id,
                      body: { to: 'CLOSED' },
                    })
                      .unwrap()
                      .catch(() =>
                        setActionError('Could not confirm ticket closure.'),
                      )
                  }
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Confirm resolved
                </button>

                <button
                  type="button"
                  disabled={changeStatusState.isLoading || !reply.trim()}
                  onClick={() =>
                    void changeStatus({
                      id: selected.serverId ?? selected.id,
                      body: { to: 'IN_PROGRESS', comment: reply.trim() },
                    })
                      .unwrap()
                      .then(() => setReply(''))
                      .catch(() =>
                        setActionError('Could not reopen ticket.'),
                      )
                  }
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  Reopen
                </button>
              </div>
            )}

            <div className="mt-4">
              <label
                className="block text-xs font-semibold text-slate-600"
                htmlFor="ticket-reply"
              >
                Reply to IT
              </label>
              <textarea
                id="ticket-reply"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
              />

              <button
                type="button"
                disabled={!reply.trim() || addCommentState.isLoading}
                onClick={() =>
                  void addComment({
                    id: selected.serverId ?? selected.id,
                    body: reply.trim(),
                    isInternal: false,
                  })
                    .unwrap()
                    .then(() => setReply(''))
                    .catch(() => setActionError('Could not send reply.'))
                }
                className="mt-2 rounded-full bg-[#3155ff] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Send reply
              </button>

              {actionError && (
                <p role="alert" className="mt-2 text-xs text-red-700">
                  {actionError}
                </p>
              )}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
            Select a ticket to view its updates.
          </div>
        )}
      </div>
    </div>
  )
}

function Passes({ request = false }: { request?: boolean }) {
  // TODO(v2): Restore this prototype when persistent gate-pass APIs are available.
  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <PageTitle
        title={request ? 'Request a gate pass' : 'Gate passes'}
        description="Gate-pass actions are disabled until they are supported by the server API."
      >
        {request && (
          <Link
            to="/employee"
            className="rounded-full border border-[#dce2ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#202844] hover:bg-slate-50"
          >
            Back to home
          </Link>
        )}
      </PageTitle>

      <section
        role="status"
        className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
      >
        <h2 className="text-sm font-semibold">Not available yet</h2>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          The current v1 API does not provide persistent gate-pass records,
          approvals, or security movement checks. No request or pass has been
          saved.
        </p>
      </section>
    </div>
  )
}

export default function EmployeePortal({
  section,
  viewer,
}: {
  section: string
  viewer?: PublicUser | null
}) {
  const { user } = useAuth()
  const activeViewer = viewer ?? user

  if (!activeViewer) return <Navigate to="/login" replace />
  if (section === 'report') return <ReportProblem viewer={activeViewer} />
  if (section === 'tickets') return <MyTickets />
  if (section === 'passes') return <Passes />
  if (section === 'pass-form') return <Passes request />

  return <Home viewer={activeViewer} />
}
