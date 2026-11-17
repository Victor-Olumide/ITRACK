import '@google/model-viewer'

interface ModelViewerProps {
  src: string
  alt: string
  onLoad?: () => void
  onError?: () => void
}

export default function ModelViewer({ src, alt, onLoad, onError }: ModelViewerProps) {
  return (
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      auto-rotate
      shadow-intensity="1"
      className="h-64 w-full rounded-xl bg-slate-100"
      onLoad={onLoad}
      onError={onError}
    />
  )
}
