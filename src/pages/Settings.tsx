import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Bell, PenLine, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SignaturePad from '../components/SignaturePad'
import {
  useGetMySignatureQuery,
  useRemoveMySignatureMutation,
  useSaveMySignatureMutation,
} from '../lib/api/signatures/signatures-api'
import { getApiErrorMessage } from '../lib/api/error-message'
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  type NotificationPreferences,
} from '../lib/api/notifications/notifications-api'
import { useToast } from '@/hooks/use-toast'
import type { UserRole } from '../types/types'
import { formatDay, shortHash } from '../lib/api/gates/gate-pass-format'

const PIN_PATTERN = /^\d{4,6}$/

function PinInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-xs font-semibold text-[#3E4766]">
      {label}
      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        className="h-10 w-32 rounded-xl border border-[#D4DAEA] px-3 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100"
      />
    </label>
  )
}

/** D17 "My signature": goes on every gate pass the user issues or signs for. */
function SignatureSection({ role }: { role: string }) {
  const signatureQuery = useGetMySignatureQuery()
  const [save, saveState] = useSaveMySignatureMutation()
  const [remove, removeState] = useRemoveMySignatureMutation()
  const [drawn, setDrawn] = useState<string | null>(null)
  const [padKey, setPadKey] = useState(0)
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [changingPin, setChangingPin] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const hasPin = signatureQuery.data?.hasPin ?? false
  const current = signatureQuery.data?.signature ?? null
  const issuesPasses = role === 'IT Admin' || role === 'Technician'

  const reset = () => {
    setDrawn(null)
    setPadKey((key) => key + 1)
    setPin('')
    setNewPin('')
    setChangingPin(false)
  }

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    if (!drawn) {
      setMessage({ type: 'error', text: 'Draw or upload your signature first.' })
      return
    }
    try {
      await save({ image: drawn, pin, ...(changingPin && newPin ? { newPin } : {}) }).unwrap()
      reset()
      setMessage({ type: 'success', text: 'Saved. New passes use this signature.' })
    } catch (error) {
      setMessage({ type: 'error', text: getApiErrorMessage(error, 'Your signature could not be saved.') })
    }
  }

  const removeSignature = async () => {
    setMessage(null)
    if (!PIN_PATTERN.test(pin)) {
      setMessage({ type: 'error', text: 'Enter your PIN to remove your signature.' })
      return
    }
    try {
      await remove({ pin }).unwrap()
      reset()
      setMessage({ type: 'success', text: 'Signature removed. Passes you already signed keep their copy.' })
    } catch (error) {
      setMessage({ type: 'error', text: getApiErrorMessage(error, 'Your signature could not be removed.') })
    }
  }

  const canSave = Boolean(drawn) && PIN_PATTERN.test(pin) && (!changingPin || PIN_PATTERN.test(newPin))

  return (
    <section id="signature" className="flex flex-col gap-6 rounded-[18px] bg-white p-5 sm:p-6 lg:flex-row lg:items-start">
      <form onSubmit={submit} className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <PenLine size={18} className="text-[#3155ff]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[#0E1430]">My signature</h2>
        </div>
        <p className="max-w-xl text-[13px] text-[#5B6480]">
          {issuesPasses
            ? 'Goes on every gate pass you issue. '
            : 'Use it to sign for items when you collect them for a gate pass. '}
          Applying it always asks for your PIN. Passes you already signed keep the old copy if you change it.
        </p>

        <SignaturePad key={padKey} onChange={setDrawn} />

        <div className="flex flex-wrap items-end gap-3">
          <PinInput id="signing-pin" label={hasPin ? 'PIN' : 'Choose a 4–6 digit PIN'} value={pin} onChange={setPin} />
          {hasPin && changingPin && (
            <PinInput id="new-signing-pin" label="New PIN" value={newPin} onChange={setNewPin} />
          )}
          <button
            type="submit"
            disabled={!canSave || saveState.isLoading}
            className="h-10 rounded-full bg-[#2F4BF5] px-4 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C3CADF]"
          >
            {saveState.isLoading ? 'Saving…' : 'Save signature'}
          </button>
          {hasPin && !changingPin && (
            <button type="button" onClick={() => setChangingPin(true)} className="h-10 text-xs font-semibold text-[#3155ff] hover:underline">
              Change PIN too
            </button>
          )}
        </div>

        {message && (
          <p
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`max-w-xl rounded-lg px-3 py-2 text-xs font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-[#12733A]'}`}
          >
            {message.text}
          </p>
        )}
      </form>

      <aside className="flex w-full flex-col gap-1.5 rounded-[14px] bg-[#F7F8FC] p-4 text-xs lg:w-64">
        <b className="text-[13px] text-[#0E1430]">Current signature</b>
        {signatureQuery.isLoading ? (
          <p role="status" className="text-slate-500">Loading…</p>
        ) : signatureQuery.isError ? (
          <p role="alert" className="text-red-700">{getApiErrorMessage(signatureQuery.error, 'Your signature could not be loaded.')}</p>
        ) : current ? (
          <>
            <img src={current.image} alt="Your saved signature" className="h-14 w-full rounded-md bg-white object-contain" />
            <span className="text-[#3E4766]">
              Set {formatDay(current.setAt)}
              {issuesPasses ? ` · used on ${current.usedOnPasses} pass${current.usedOnPasses === 1 ? '' : 'es'}` : ''}
            </span>
            <span className="font-mono text-[#5B6480]">sha256 {shortHash(current.sha256)}</span>
            <span className="text-[#5B6480]">Only you can replace it. IT Admin can revoke it if you leave.</span>
            <button
              type="button"
              onClick={() => void removeSignature()}
              disabled={removeState.isLoading}
              className="mt-1 self-start text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
            >
              {removeState.isLoading ? 'Removing…' : 'Remove (enter your PIN first)'}
            </button>
          </>
        ) : (
          <p className="text-[#5B6480]">
            No signature saved yet. {issuesPasses ? 'You need one to approve gate passes.' : 'You can still sign on screen at handover.'}
          </p>
        )}
      </aside>
    </section>
  )
}

export default function Settings() {
  const { user } = useAuth()

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <header>
        <div className="flex items-center gap-2">
          <UserRound size={19} className="text-[#3155ff]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Settings</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Your account and the signature ITrack puts on gate passes.</p>
      </header>

      <div className="mt-5 flex max-w-5xl flex-col gap-4">
        <SignatureSection role={user?.role ?? 'Employee'} />

        <section className="rounded-2xl border border-[#e9edf6] bg-white p-5 sm:p-6">
          <h2 className="text-base font-bold text-[#111a38]">Account</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ['Full name', user?.name],
              ['Email', user?.email],
              ['Role', user?.role],
              ['Department', user?.department],
              ['Staff ID', user?.staffId],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-[#202844]">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>

        <NotificationPreferencesSection role={user?.role ?? 'Employee'} />
        {/* TODO(v2): Desktop start-up preferences (D17) belong to the desktop app. */}
      </div>
    </main>
  )
}

const PREFERENCE_OPTIONS: Array<{ key: keyof NotificationPreferences; label: string; hint: string; roles?: UserRole[] }> = [
  { key: 'ticketUpdates', label: 'Ticket updates', hint: 'New tickets, assignments, replies and status changes.' },
  { key: 'gatePassUpdates', label: 'Gate passes', hint: 'Approvals, handovers, exits and returns.' },
  { key: 'assetRequestUpdates', label: 'Equipment requests', hint: 'Requests you made or need to review.' },
  { key: 'stockAlerts', label: 'Low stock alerts', hint: 'When an item drops to its reorder level.', roles: ['IT Admin'] },
]

// W19: choose which in-app notifications to receive. Account notices always arrive.
function NotificationPreferencesSection({ role }: { role: UserRole }) {
  const toast = useToast()
  const query = useGetNotificationPreferencesQuery()
  const [update, updateState] = useUpdateNotificationPreferencesMutation()
  const options = PREFERENCE_OPTIONS.filter((option) => !option.roles || option.roles.includes(role))

  const toggle = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      await update({ [key]: value }).unwrap()
      toast(value ? 'Notifications turned on.' : 'Notifications turned off.')
    } catch (error) {
      toast(getApiErrorMessage(error, 'Your preference could not be saved.'), 'error')
    }
  }

  return (
    <section className="rounded-2xl border border-[#e9edf6] bg-white p-5 sm:p-6" aria-labelledby="notification-preferences">
      <div className="flex items-center gap-2">
        <Bell size={17} className="text-[#3155ff]" />
        <h2 id="notification-preferences" className="text-base font-bold text-[#111a38]">Notifications</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">Choose what appears in your notification bell. Account and password notices always arrive.</p>
      {query.isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Loading preferences…</p>
      ) : query.isError || !query.data ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{getApiErrorMessage(query.error, 'Preferences could not be loaded.')}</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#eef1f7]">
          {options.map((option) => {
            const checked = query.data[option.key]
            return (
              <li key={option.key} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#202844]">{option.label}</p>
                  <p className="text-xs text-slate-500">{option.hint}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-label={option.label}
                  disabled={updateState.isLoading}
                  onClick={() => void toggle(option.key, !checked)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? 'bg-[#3155ff]' : 'bg-slate-300'}`}
                >
                  {/* Anchored left: a button centres its content, which pushed the knob off the track. */}
                  <span aria-hidden="true" className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
