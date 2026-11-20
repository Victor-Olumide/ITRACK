import { useEffect, useMemo } from 'react'

// A temporary browser URL for a picked file, so it can be previewed before
// upload. useMemo is semantic here: each URL is a browser resource that must be
// created once per file and revoked when the file changes or on unmount.
export function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])
  return url
}
