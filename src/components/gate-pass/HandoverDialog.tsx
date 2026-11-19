import { useState } from 'react'
import type { FormEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import SignaturePad from '../SignaturePad'
import { useHandoverGatePassMutation } from '../../lib/api/gates/gates-api'
import type { GatePass } from '../../lib/api/gates/types'
import { getApiErrorMessage } from '../../lib/api/error-message'

interface HandoverDialogProps {
  pass: GatePass | null
  /** True when the person signing is the requester on their own account. */
  signingAsRequester: boolean
  onClose: () => void
}

/**
 * W14 step 3 / M17 "Sign for items at handover": the person taking the items
 * accepts them and their condition, by signing on screen or with their saved signature and PIN.
 */
export default function HandoverDialog({ pass, signingAsRequester, onClose }: HandoverDialogProps) {
  const [handover, state] = useHandoverGatePassMutation()
  const [mode, setMode] = useState<'draw' | 'saved'>('draw')
  const [drawn, setDrawn] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const close = () => {
    setMode('draw')
    setDrawn(null)
    setPin('')
    setError('')
    onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pass) return
    setError('')
    try {
      await handover(
        mode === 'draw'
          ? { id: pass.id, signature: drawn ?? undefined }
          : { id: pass.id, useSavedSignature: true, pin },
      ).unwrap()
      close()
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'The handover could not be signed.'))
    }
  }

  const name = pass?.requester.fullName ?? 'the requester'
  const ready = mode === 'draw' ? Boolean(drawn) : /^\d{4,6}$/.test(pin)

  return (
    <Dialog open={Boolean(pass)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sign for items · {pass?.code}</DialogTitle>
          <DialogDescription>
            {signingAsRequester
              ? 'Sign to accept these items in the condition stated. Security then checks every item at the gate.'
              : `Hand the screen to ${name}. They sign to accept the items and their condition.`}
          </DialogDescription>
        </DialogHeader>

        {pass && (
          <form onSubmit={submit} className="space-y-4">
            <ul className="divide-y divide-slate-100 rounded-xl border border-[#E3E7F2] text-sm">
              {pass.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                  <b className="text-[#0E1430]">{item.name}</b>
                  {item.assetTag && (
                    <span className="rounded bg-[#D6F25B] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#1A2200]">{item.assetTag}</span>
                  )}
                  <span className="text-xs text-slate-500">{item.makeModel}</span>
                  <span className="ml-auto font-mono text-xs text-[#3E4766]">SN {item.serialNumber ?? 'None printed'}</span>
                  <span className="w-full text-xs text-slate-500">Qty {item.quantity} · {item.conditionOut ?? 'Condition not recorded'}</span>
                </li>
              ))}
            </ul>

            <div role="radiogroup" aria-label="How to sign" className="inline-flex rounded-full bg-[#EEF1F8] p-1">
              {(['draw', 'saved'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={mode === option}
                  onClick={() => setMode(option)}
                  className={`h-8 rounded-full px-3.5 text-xs font-bold ${mode === option ? 'bg-[#0F1A4A] text-white' : 'text-[#3E4766]'}`}
                >
                  {option === 'draw' ? 'Sign on screen' : `Use ${signingAsRequester ? 'my' : 'their'} saved signature`}
                </button>
              ))}
            </div>

            {mode === 'draw' ? (
              <SignaturePad onChange={setDrawn} allowUpload={false} label={`Signature pad for ${name}`} />
            ) : (
              <label className="flex max-w-xs flex-col gap-1.5 text-xs font-semibold text-[#3E4766]">
                {signingAsRequester ? 'Your signing PIN' : `${name}'s signing PIN`}
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                  className="h-10 rounded-xl border border-[#D4DAEA] px-3 text-sm font-normal outline-none focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100"
                />
              </label>
            )}

            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={close} className="h-10 rounded-full border-[1.5px] border-[#CBD2E6] px-4 text-sm font-semibold text-[#0E1430]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!ready || state.isLoading}
                className="h-10 rounded-full bg-[#2F4BF5] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C3CADF]"
              >
                {state.isLoading ? 'Signing…' : 'Accept items and sign'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
