import { motion } from 'framer-motion';
import { Check, Moon, Sun, Monitor, Palette, Type, LayoutGrid, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAppSettings, ACCENT_PRESETS, type Density } from '@/hooks/useAppSettings';
import { cn } from '@/lib/utils';
import techSettings from '@/assets/tech-settings.jpg';

const densityOptions: { id: Density; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: 'More on screen, tighter spacing' },
  { id: 'comfortable', label: 'Comfortable', desc: 'Balanced spacing (default)' },
  { id: 'spacious', label: 'Spacious', desc: 'Generous breathing room' },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, density, setDensity } = useAppSettings();

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl p-6 md:p-10 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8"
        >
          <img
            src={techSettings}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 object-contain opacity-60 dark:opacity-30"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card via-card/90 to-transparent" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
              <Sparkles className="h-3 w-3" />
              App Settings
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
              Appearance
            </h1>
            <p className="mt-2 text-muted-foreground">
              Personalize the look and feel of your workspace.
            </p>
          </div>
        </motion.div>

        {/* Theme */}
        <SettingsSection
          icon={Sun}
          title="Theme"
          description="Choose how the interface looks across the app."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ThemeCard
              active={theme === 'light'}
              onClick={() => setTheme('light')}
              icon={Sun}
              label="Light"
              preview="bg-gradient-to-br from-white to-slate-100 border-slate-200"
            />
            <ThemeCard
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
              icon={Moon}
              label="Dark"
              preview="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800"
            />
            <ThemeCard
              active={false}
              onClick={() => {
                const m = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setTheme(m ? 'dark' : 'light');
              }}
              icon={Monitor}
              label="System"
              preview="bg-gradient-to-br from-white via-slate-200 to-slate-900 border-slate-300"
            />
          </div>
        </SettingsSection>

        {/* Accent */}
        <SettingsSection
          icon={Palette}
          title="Accent color"
          description="Pick a primary color that flows through buttons, links, and highlights."
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ACCENT_PRESETS.map((p) => {
              const isActive = accent === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setAccent(p.id)}
                  className={cn(
                    'group relative rounded-2xl border-2 p-4 transition-all duration-300 text-left',
                    isActive
                      ? 'border-primary shadow-lg shadow-primary/20 bg-primary/5'
                      : 'border-border hover:border-primary/40 bg-card'
                  )}
                >
                  <div
                    className="h-10 w-10 rounded-xl shadow-md mb-3"
                    style={{
                      background: `linear-gradient(135deg, hsl(${p.primary}), hsl(${p.glow}))`,
                    }}
                  />
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  {isActive && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </SettingsSection>

        {/* Density */}
        <SettingsSection
          icon={LayoutGrid}
          title="Interface density"
          description="Control how much spacing surrounds content."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {densityOptions.map((opt) => {
              const isActive = density === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setDensity(opt.id)}
                  className={cn(
                    'rounded-2xl border-2 p-5 text-left transition-all duration-300',
                    isActive
                      ? 'border-primary shadow-lg shadow-primary/15 bg-primary/5'
                      : 'border-border hover:border-primary/40 bg-card'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-base font-semibold text-foreground">{opt.label}</span>
                    {isActive && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                  <div className="mt-3 space-y-1">
                    <div className={cn('h-1.5 rounded-full bg-primary/30', opt.id === 'compact' ? 'w-3/4' : opt.id === 'spacious' ? 'w-1/2' : 'w-2/3')} />
                    <div className={cn('h-1.5 rounded-full bg-muted', opt.id === 'compact' ? 'w-1/2' : opt.id === 'spacious' ? 'w-1/3' : 'w-2/5')} />
                  </div>
                </button>
              );
            })}
          </div>
        </SettingsSection>

        {/* Typography preview */}
        <SettingsSection
          icon={Type}
          title="Typography"
          description="Brand typography is fixed across the workspace."
        >
          <Card className="p-6 bg-gradient-to-br from-card to-muted/30">
            <h3 className="font-display text-3xl font-bold text-foreground">Urbanist Display</h3>
            <p className="mt-2 text-base text-muted-foreground leading-relaxed">
              Epilogue is used for body text — a clean geometric sans designed for clarity at every size.
            </p>
          </Card>
        </SettingsSection>
      </div>
    </MainLayout>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function ThemeCard({
  active,
  onClick,
  icon: Icon,
  label,
  preview,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  preview: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative rounded-2xl border-2 p-4 text-left transition-all duration-300',
        active
          ? 'border-primary shadow-lg shadow-primary/20 bg-primary/5'
          : 'border-border hover:border-primary/40 bg-card'
      )}
    >
      <div className={cn('h-20 w-full rounded-xl border mb-3', preview)} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        {active && (
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}
