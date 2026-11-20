import { useState } from 'react'

// Tries `primary` (e.g. an uploaded file), then `fallback` (a bundled asset).
// Call onError from the element's error event to move on; src is null once
// every candidate has failed. Resets naturally when the component remounts.
export function useFallbackSrc(primary: string | null | undefined, fallback: string | null | undefined) {
  const [failed, setFailed] = useState<string[]>([])
  const candidates = [primary, fallback].filter(
    (url, index, all): url is string => Boolean(url) && all.indexOf(url) === index,
  )
  const src = candidates.find((url) => !failed.includes(url)) ?? null

  return {
    src,
    usingFallback: Boolean(src && fallback && src === fallback && primary && primary !== fallback),
    onError: () => {
      if (src) setFailed((current) => (current.includes(src) ? current : [...current, src]))
    },
  }
}
