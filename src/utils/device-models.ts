import type { AssetType } from '../lib/api/assets/types';

// 3D models bundled with the web app (public/models). Devices and catalogue
// entries without an uploaded model fall back to the closest match here.
export const BUILT_IN_MODELS: ReadonlyArray<{ name: string; type: AssetType; url: string }> = [
  { name: 'Laptop', type: 'LAPTOP', url: '/models/gaming_laptop.glb' },
  { name: 'Desktop PC', type: 'DESKTOP', url: '/models/gaming_desktop_pc.glb' },
  { name: 'Office printer', type: 'PRINTER', url: '/models/mfp_office_printer.glb' },
  { name: 'Ultrawide monitor', type: 'OTHER', url: '/models/ultrawide_monitor.glb' },
  { name: 'Smartphone', type: 'OTHER', url: '/models/samsung_galaxy_s22_ultra.glb' },
];

const LOCAL_MODEL_BY_TYPE: Partial<Record<AssetType, string>> = {
  LAPTOP: '/models/gaming_laptop.glb',
  DESKTOP: '/models/gaming_desktop_pc.glb',
  PRINTER: '/models/mfp_office_printer.glb',
};

export function localDeviceModelUrl(
  type: AssetType,
  customType?: string | null,
  make?: string,
  model?: string,
): string | null {
  const searchable = `${customType ?? ''} ${make ?? ''} ${model ?? ''}`.toLowerCase();

  if (/monitor|display|ultrawide/.test(searchable)) return '/models/ultrawide_monitor.glb';
  if (/samsung|galaxy|phone|mobile/.test(searchable)) return '/models/samsung_galaxy_s22_ultra.glb';

  return LOCAL_MODEL_BY_TYPE[type] ?? null;
}
