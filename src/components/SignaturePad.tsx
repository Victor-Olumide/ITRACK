import { useRef, useState } from 'react'
import type { ChangeEvent, PointerEvent } from 'react'
import { Eraser, Upload } from 'lucide-react'

// Keep exports under the server's 64 KB signature limit (base64 adds ~33%).
const MAX_DATA_URL_LENGTH = 86_000
const WIDTH = 520
const HEIGHT = 150
const INK = '#1C2E9E'

function exportCanvas(canvas: HTMLCanvasElement) {
  const png = canvas.toDataURL('image/png')
  if (png.length <= MAX_DATA_URL_LENGTH) return png
  // Photos of signatures can be large as PNG: flatten on white and use JPEG instead.
  const flat = document.createElement('canvas')
  flat.width = canvas.width
  flat.height = canvas.height
  const context = flat.getContext('2d')
  if (!context) return null
  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, flat.width, flat.height)
  context.drawImage(canvas, 0, 0)
  for (const quality of [0.85, 0.7, 0.55]) {
    const jpeg = flat.toDataURL('image/jpeg', quality)
    if (jpeg.length <= MAX_DATA_URL_LENGTH) return jpeg
  }
  return null
}

interface SignaturePadProps {
  /** Called with a PNG/JPEG data URL after each stroke or upload, or null when cleared. */
  onChange: (dataUrl: string | null) => void
  label?: string
  allowUpload?: boolean
}

/** D17 signature pad: draw with a mouse, pen or finger, or upload an image of a signature. */
export default function SignaturePad({
  onChange,
  label = 'Signature pad. Draw with your mouse, pen or finger.',
  allowUpload = true,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)
  const [error, setError] = useState('')

  const context = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return null
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = INK
    return { canvas, ctx }
  }

  const pointAt = (event: PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const box = canvas.getBoundingClientRect()
    return [
      ((event.clientX - box.left) * canvas.width) / box.width,
      ((event.clientY - box.top) * canvas.height) / box.height,
    ] as const
  }

  const emit = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = exportCanvas(canvas)
    if (!dataUrl) {
      setError('That signature image is too detailed. Draw it instead, or upload a smaller image.')
      onChange(null)
      return
    }
    setError('')
    onChange(dataUrl)
  }

  const handleDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const surface = context()
    if (!surface) return
    drawing.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    const [x, y] = pointAt(event, surface.canvas)
    surface.ctx.beginPath()
    surface.ctx.moveTo(x, y)
    surface.ctx.lineTo(x + 0.1, y + 0.1)
    surface.ctx.stroke()
  }

  const handleMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const surface = context()
    if (!surface) return
    const [x, y] = pointAt(event, surface.canvas)
    surface.ctx.lineTo(x, y)
    surface.ctx.stroke()
  }

  const handleUp = () => {
    if (!drawing.current) return
    drawing.current = false
    setHasInk(true)
    emit()
  }

  const clear = () => {
    const surface = context()
    surface?.ctx.clearRect(0, 0, surface.canvas.width, surface.canvas.height)
    setHasInk(false)
    setError('')
    onChange(null)
  }

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Upload a PNG or JPEG image of your signature.')
      return
    }
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const surface = context()
      if (surface) {
        const { canvas, ctx } = surface
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const scale = Math.min((canvas.width - 24) / image.width, (canvas.height - 16) / image.height, 1)
        const width = image.width * scale
        const height = image.height * scale
        ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
        setHasInk(true)
        emit()
      }
      URL.revokeObjectURL(url)
    }
    image.onerror = () => {
      setError('That image could not be read.')
      URL.revokeObjectURL(url)
    }
    image.src = url
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-[14px] border-[1.5px] border-dashed border-[#9AA6CC] bg-[#FAFBFE]">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          role="img"
          aria-label={label}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          className="block aspect-[52/15] w-full cursor-crosshair touch-none"
        />
        <span className="pointer-events-none absolute bottom-[22%] left-6 right-6 border-t border-[#C3CADF]" />
        <span className="pointer-events-none absolute bottom-2 left-6 text-[11px] text-[#8F9BCB]">
          {hasInk ? 'Signature captured' : 'Sign above the line'}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={clear}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-[#CBD2E6] bg-white px-3.5 text-xs font-semibold text-[#0E1430] hover:bg-slate-50"
        >
          <Eraser size={14} aria-hidden="true" /> Clear
        </button>
        {allowUpload && (
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-[#CBD2E6] bg-white px-3.5 text-xs font-semibold text-[#0E1430] hover:bg-slate-50 focus-within:outline-2 focus-within:outline-[#3155ff]">
            <Upload size={14} aria-hidden="true" /> Upload image
            <input type="file" accept="image/png,image/jpeg" onChange={upload} className="sr-only" />
          </label>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  )
}
