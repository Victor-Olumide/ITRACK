// W20 offline state: tell the user their changes won't reach ITrack until the
// connection returns.
import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

export default function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  if (online) return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-300 px-4 py-2 text-xs font-semibold text-[#16214b]">
      <WifiOff size={14} aria-hidden="true" />
      You're offline. Changes can't be saved until your connection returns.
    </div>
  )
}
