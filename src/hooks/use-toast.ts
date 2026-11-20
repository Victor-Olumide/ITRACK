import { useAppDispatch } from '@/lib/stores/hooks'
import { showToast, type ToastTone } from '@/lib/stores/toast-slice'

// Shows a W23 toast: `toast('Saved.')` or `toast('Could not save.', 'error')`.
export function useToast() {
  const dispatch = useAppDispatch()
  return (message: string, tone: ToastTone = 'success') => dispatch(showToast({ message, tone }))
}
