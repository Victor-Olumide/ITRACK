// src/components/AssetTag.jsx
// The distinct lime-green asset tag used across ITrack for device tags
// like "IT-LAP-0042". Bright chartreuse background, dark olive monospace text.

/**
 * @param {string} tag      The tag string, e.g. "IT-LAP-0042".
 * @param {string} [size]   "sm" | "md" (default) — controls padding/text size.
 * @param {string} [className] Extra classes appended to the tag.
 */
interface AssetTagProps {
  tag: string
  size?: 'sm' | 'md'
  className?: string
}

export default function AssetTag({ tag, size = 'md', className = '' }: AssetTagProps) {
  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
  }

  return (
    <span
      className={`inline-flex items-center rounded-md bg-[#d4f933] font-mono font-bold tracking-wide text-[#445b0f] ${sizes[size] ?? sizes.md} ${className}`}
    >
      {tag}
    </span>
  )
}
