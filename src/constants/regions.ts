// Predefined delivery region/area options
// Used in both AddStoreModal (for selection) and HistoryPage (for filtering)
export const REGION_OPTIONS = [
  'Kelampaian',
  'Cempaka',
  'Sekumpul',
  'Karangso',
  'Guntung Manggis'
] as const;

export type RegionName = typeof REGION_OPTIONS[number];

// Color configuration for each region pin
// Each entry has: primary gradient start, gradient end, and glow/shadow color
export const REGION_COLORS: Record<string, { primary: string; gradient: string; shadow: string; label: string }> = {
  'Sekumpul':       { primary: '#22c55e', gradient: '#16a34a', shadow: 'rgba(34,197,94,0.4)',   label: 'Hijau' },
  'Kelampaian':     { primary: '#eab308', gradient: '#ca8a04', shadow: 'rgba(234,179,8,0.4)',    label: 'Kuning' },
  'Cempaka':        { primary: '#3b82f6', gradient: '#2563eb', shadow: 'rgba(59,130,246,0.4)',   label: 'Biru' },
  'Karangso':       { primary: '#ef4444', gradient: '#dc2626', shadow: 'rgba(239,68,68,0.4)',    label: 'Merah' },
  'Guntung Manggis':{ primary: '#f97316', gradient: '#ea580c', shadow: 'rgba(249,115,22,0.4)',   label: 'Orange' },
};

// Default color for stores without a region
export const DEFAULT_PIN_COLOR = { primary: '#6366f1', gradient: '#4f46e5', shadow: 'rgba(99,102,241,0.4)', label: 'Ungu' };

// Helper to get pin color config by region name
export function getRegionColor(region?: string) {
  if (!region) return DEFAULT_PIN_COLOR;
  return REGION_COLORS[region] || DEFAULT_PIN_COLOR;
}
