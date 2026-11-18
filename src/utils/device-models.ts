import type { AssetType } from '../lib/api/assets/types';

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
