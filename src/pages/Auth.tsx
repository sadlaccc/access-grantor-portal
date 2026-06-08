import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowRight, Shield, Zap, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import intellinksLogo from '@/assets/intellinks-logo.png';

const Auth = () => {
  const { user, loading, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try { await signIn(email, password); } catch {} finally { setIsLoading(false); }
  };

  const features = [
    { icon: Shield, title: 'Enterprise security', desc: 'Role-based access with full audit trails' },
    { icon: Zap, title: 'Built-in AI assistant', desc: 'Context-aware help inside every module' },
    { icon: Workflow, title: 'Unified operations', desc: 'Helpdesk, projects, finance & more' },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[hsl(215_50%_5%)]">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.6), transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary-glow) / 0.5), transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(197 100% 55% / 0.5), transparent 70%)' }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Left - Branding */}
      <div className="relative z-10 hidden w-[55%] flex-col justify-between p-12 lg:flex">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-2 shadow-2xl">
            <img src={intellinksLogo} alt="" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Intellinks East Africa</p>
            <p className="text-xs text-white/50">Enterprise Portal</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-[hsl(var(--primary-glow))]" />
            <span>Powered by intelligent workflows</span>
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-white">
            One workspace.
            <br />
            <span className="bg-gradient-to-r from-[hsl(var(--primary-glow))] via-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] bg-clip-text text-transparent">
              Every operation.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
            Helpdesk, projects, finance, HR and AI — unified into a single, beautifully crafted experience.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))]/30 to-[hsl(var(--primary-glow))]/10 ring-1 ring-white/10">
                  <f.icon className="h-4 w-4 text-[hsl(var(--primary-glow))]" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="flex items-center justify-between text-xs text-white/40">
          <p>© 2026 Intellinks East Africa</p>
          <p>www.intellinksea.com</p>
        </div>
      </div>

      {/* Right - Glass form card */}
      <div className="relative z-10 flex w-full items-center justify-center p-6 lg:w-[45%] lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-1.5">
              <img src={intellinksLogo} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Intellinks EA</p>
              <p className="text-xs text-white/50">Enterprise Portal</p>
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-2xl">
            {/* subtle inner glow */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-50"
              style={{ background: 'radial-gradient(ellipse at top, hsl(var(--primary) / 0.08), transparent 60%)' }}
            />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-white/50">
                Sign in to access your workspace.
              </p>

              <form onSubmit={handleSignIn} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@intellinks.co.ke"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-white/30 focus-visible:border-[hsl(var(--primary))]/50 focus-visible:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary))]/40 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-11 pr-11 text-white placeholder:text-white/30 focus-visible:border-[hsl(var(--primary))]/50 focus-visible:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary))]/40 focus-visible:ring-offset-0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))] text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--primary))]/30 transition-all hover:shadow-xl hover:shadow-[hsl(var(--primary))]/40"
                  disabled={isLoading}
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Button>
              </form>

              <div className="mt-8 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <p className="text-[11px] uppercase tracking-wider text-white/30">Secure access</p>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="mt-6 text-center text-xs text-white/40">
                Contact your administrator to request account access.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
