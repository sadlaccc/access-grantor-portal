import { useEffect, useState, useCallback } from 'react';

export type AccentPreset = {
  id: string;
  name: string;
  primary: string; // hsl values "H S% L%"
  glow: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'intellinks', name: 'Intellinks Blue', primary: '197 100% 44%', glow: '197 100% 58%' },
  { id: 'indigo', name: 'Indigo', primary: '239 84% 60%', glow: '239 84% 72%' },
  { id: 'emerald', name: 'Emerald', primary: '160 84% 39%', glow: '160 84% 52%' },
  { id: 'violet', name: 'Violet', primary: '270 91% 60%', glow: '270 91% 72%' },
  { id: 'rose', name: 'Rose', primary: '346 87% 55%', glow: '346 87% 68%' },
  { id: 'amber', name: 'Amber', primary: '32 95% 50%', glow: '32 95% 62%' },
];

export type Density = 'comfortable' | 'compact' | 'spacious';

const ACCENT_KEY = 'intellinks-accent';
const DENSITY_KEY = 'intellinks-density';

function applyAccent(id: string) {
  const preset = ACCENT_PRESETS.find((p) => p.id === id) || ACCENT_PRESETS[0];
  const root = document.documentElement;
  root.style.setProperty('--primary', preset.primary);
  root.style.setProperty('--primary-glow', preset.glow);
  root.style.setProperty('--ring', preset.primary);
  root.style.setProperty('--sidebar-primary', preset.primary);
  root.style.setProperty('--sidebar-ring', preset.primary);
}

function applyDensity(d: Density) {
  const root = document.documentElement;
  root.dataset.density = d;
  const scale = d === 'compact' ? '0.92' : d === 'spacious' ? '1.08' : '1';
  root.style.setProperty('--density-scale', scale);
  root.style.fontSize = `${parseFloat(scale) * 16}px`;
}

export function initAppSettings() {
  const accent = localStorage.getItem(ACCENT_KEY) || 'intellinks';
  const density = (localStorage.getItem(DENSITY_KEY) as Density) || 'comfortable';
  applyAccent(accent);
  applyDensity(density);
}

export function useAppSettings() {
  const [accent, setAccentState] = useState<string>(
    () => localStorage.getItem(ACCENT_KEY) || 'intellinks'
  );
  const [density, setDensityState] = useState<Density>(
    () => (localStorage.getItem(DENSITY_KEY) as Density) || 'comfortable'
  );

  useEffect(() => { applyAccent(accent); localStorage.setItem(ACCENT_KEY, accent); }, [accent]);
  useEffect(() => { applyDensity(density); localStorage.setItem(DENSITY_KEY, density); }, [density]);

  const setAccent = useCallback((id: string) => setAccentState(id), []);
  const setDensity = useCallback((d: Density) => setDensityState(d), []);

  return { accent, setAccent, density, setDensity };
}
