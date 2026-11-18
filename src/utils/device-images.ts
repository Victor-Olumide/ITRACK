import type { AssetType } from '../lib/api/assets/types'

const DEVICE_IMAGES: Record<AssetType, string> = {
  LAPTOP: '/images/devices/laptop.webp',
  DESKTOP: '/images/devices/desktop.webp',
  PRINTER: '/images/devices/printer.webp',
  NETWORK: '/images/devices/router.webp',
  OTHER: '/images/devices/desktop.webp',
}

export function brandDeviceImage(type: AssetType, make?: string | null) {
  const manufacturer = make?.toLowerCase().trim() ?? ''

  if (type === 'LAPTOP' && manufacturer.includes('apple')) return '/images/devices/macbook.jpg'
  if (type === 'LAPTOP' && manufacturer.includes('dell')) return '/images/devices/dell.jpg'
  if (type === 'LAPTOP' && (manufacturer.includes('hp') || manufacturer.includes('hewlett'))) return '/images/devices/hp.jpg'

  return null
}

export function categoryDeviceImage(type: AssetType, customType?: string | null, make?: string | null) {
  const label = customType?.toLowerCase() ?? ''
  const manufacturerImage = brandDeviceImage(type, make)

  if (manufacturerImage) return manufacturerImage

  if (label.includes('server')) return '/images/devices/server.webp'
  if (label.includes('printer')) return '/images/devices/printer.webp'
  if (label.includes('router')) return '/images/devices/router.webp'
  if (label.includes('switch')) {
    return '/images/devices/network-switch.webp'
  }
  if (label.includes('laptop')) return '/images/devices/laptop.webp'

  return DEVICE_IMAGES[type]
}
