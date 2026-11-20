// W23 toasts: short confirmations and errors, announced to screen readers.
import { useEffect } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/stores/hooks'
import { dismissToast, type Toast, type ToastTone } from '@/lib/stores/toast-slice'

const TOAST_MS = 4500

const TONE_STYLES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-emerald-600' },
  error: { icon: XCircle, className: 'text-red-600' },
  info: { icon: Info, className: 'text-[#3155ff]' },
}

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch()
  const { icon: Icon, className } = TONE_STYLES[toast.tone]

  useEffect(() => {
    const timer = window.setTimeout(() => dispatch(dismissToast(toast.id)), TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [dispatch, toast.id])

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full items-start gap-2.5 rounded-xl border border-[#e9edf6] bg-white px-3.5 py-3 text-xs font-medium text-[#202844] shadow-lg shadow-slate-900/10"
    >
      <Icon size={16} className={`mt-px shrink-0 ${className}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
      <button
        type="button"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="-m-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function Toaster() {
  const toasts = useAppSelector((state) => state.toast.items)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:w-[360px]"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
