// <model-viewer> with a working load-failure callback. React does not forward
// `onError` to this web component, so a broken .glb link used to leave a blank
// viewer forever; listening for its `error` event directly fixes that.
import type { ComponentProps } from 'react'

type ModelViewerProps = Omit<ComponentProps<'model-viewer'>, 'onError' | 'ref'> & {
  src: string
  onLoadError?: () => void
}

export default function ModelViewer({ onLoadError, ...props }: ModelViewerProps) {
  return (
    <model-viewer
      {...props}
      ref={(element: HTMLElement | null) => {
        if (!element || !onLoadError) return
        const handleError = () => onLoadError()
        element.addEventListener('error', handleError)
        return () => element.removeEventListener('error', handleError)
      }}
    />
  )
}
