import { useEffect, useState, useCallback } from 'react';

export type AccentPreset = {
  id: string;
  name: string;
  primary: string; // hsl values "H S% L%"
  glow: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'intellinks', name: 'Ocean Blue', primary: '197 100% 44%', glow: '197 100% 58%' },
  { id: 'indigo', name: 'Indigo', primary: '239 84% 60%', glow: '239 84% 72%' },
  { id: 'emerald', name: 'Emerald', primary: '160 84% 39%', glow: '160 84% 52%' },
  { id: 'violet', name: 'Violet', primary: '270 91% 60%', glow: '270 91% 72%' },
  { id: 'rose', name: 'Rose', primary: '346 87% 55%', glow: '346 87% 68%' },
  { id: 'amber', name: 'Amber', primary: '32 95% 50%', glow: '32 95% 62%' },
];

export type Density = 'comfortable' | 'compact' | 'spacious';

const ACCENT_KEY = 'app-accent';
const DENSITY_KEY = 'app-density';
const COMPANY_NAME_KEY = 'app-company-name';
const COMPANY_LOGO_KEY = 'app-company-logo';
const COMPANY_TAGLINE_KEY = 'app-company-tagline';

export const DEFAULT_COMPANY_NAME = 'Intellinks East Africa';
export const DEFAULT_COMPANY_TAGLINE = 'Enterprise Portal';

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

// Notify all hook instances (and other tabs) when branding changes.
const BRANDING_EVENT = 'app-branding-change';

export function useAppSettings() {
  const [accent, setAccentState] = useState<string>(
    () => localStorage.getItem(ACCENT_KEY) || 'intellinks'
  );
  const [density, setDensityState] = useState<Density>(
    () => (localStorage.getItem(DENSITY_KEY) as Density) || 'comfortable'
  );
  const [companyName, setCompanyNameState] = useState<string>(
    () => localStorage.getItem(COMPANY_NAME_KEY) || DEFAULT_COMPANY_NAME
  );
  const [companyTagline, setCompanyTaglineState] = useState<string>(
    () => localStorage.getItem(COMPANY_TAGLINE_KEY) || DEFAULT_COMPANY_TAGLINE
  );
  const [companyLogo, setCompanyLogoState] = useState<string | null>(
    () => localStorage.getItem(COMPANY_LOGO_KEY)
  );

  useEffect(() => { applyAccent(accent); localStorage.setItem(ACCENT_KEY, accent); }, [accent]);
  useEffect(() => { applyDensity(density); localStorage.setItem(DENSITY_KEY, density); }, [density]);

  // Sync branding across tabs / hook instances
  useEffect(() => {
    const sync = () => {
      setCompanyNameState(localStorage.getItem(COMPANY_NAME_KEY) || DEFAULT_COMPANY_NAME);
      setCompanyTaglineState(localStorage.getItem(COMPANY_TAGLINE_KEY) || DEFAULT_COMPANY_TAGLINE);
      setCompanyLogoState(localStorage.getItem(COMPANY_LOGO_KEY));
    };
    window.addEventListener('storage', sync);
    window.addEventListener(BRANDING_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(BRANDING_EVENT, sync);
    };
  }, []);

  const setAccent = useCallback((id: string) => setAccentState(id), []);
  const setDensity = useCallback((d: Density) => setDensityState(d), []);

  const setCompanyName = useCallback((name: string) => {
    const v = name.trim() || DEFAULT_COMPANY_NAME;
    localStorage.setItem(COMPANY_NAME_KEY, v);
    setCompanyNameState(v);
    window.dispatchEvent(new Event(BRANDING_EVENT));
  }, []);

  const setCompanyTagline = useCallback((t: string) => {
    localStorage.setItem(COMPANY_TAGLINE_KEY, t);
    setCompanyTaglineState(t);
    window.dispatchEvent(new Event(BRANDING_EVENT));
  }, []);

  const setCompanyLogo = useCallback((dataUrl: string | null) => {
    if (dataUrl) localStorage.setItem(COMPANY_LOGO_KEY, dataUrl);
    else localStorage.removeItem(COMPANY_LOGO_KEY);
    setCompanyLogoState(dataUrl);
    window.dispatchEvent(new Event(BRANDING_EVENT));
  }, []);

  return {
    accent, setAccent,
    density, setDensity,
    companyName, setCompanyName,
    companyTagline, setCompanyTagline,
    companyLogo, setCompanyLogo,
  };
}
