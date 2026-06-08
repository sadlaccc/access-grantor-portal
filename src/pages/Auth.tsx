import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import intellinksLogo from '@/assets/intellinks-logo.png';
import authHero from '@/assets/auth-hero.jpg';

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

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[hsl(215_50%_5%)]">
      {/* Left - Hero image */}
      <div className="relative hidden w-[55%] lg:block">
        <img
          src={authHero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(215_50%_5%)] via-[hsl(215_50%_5%)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(215_50%_5%)]/40 via-transparent to-[hsl(215_50%_5%)]/70" />

        {/* Logo top-left */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-10 left-10 z-10 flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-1.5 shadow-2xl">
            <img src={intellinksLogo} alt="" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Intellinks East Africa</p>
            <p className="text-[11px] text-white/50">Enterprise Portal</p>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="absolute bottom-10 left-10 right-10 z-10"
        >
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white">
            One workspace.
            <br />
            <span className="bg-gradient-to-r from-[hsl(var(--primary-glow))] to-[hsl(var(--primary))] bg-clip-text text-transparent">
              Every operation.
            </span>
          </h1>
        </motion.div>
      </div>

      {/* Right - Glass form card */}
      <div className="relative z-10 flex w-full items-center justify-center p-6 lg:w-[45%] lg:p-12">
        {/* Mobile background orb */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-1.5">
              <img src={intellinksLogo} alt="" className="h-full w-full object-contain" />
            </div>
            <p className="text-sm font-semibold text-white">Intellinks EA</p>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-2xl">
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-50"
              style={{ background: 'radial-gradient(ellipse at top, hsl(var(--primary) / 0.08), transparent 60%)' }}
            />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-white/50">Sign in to continue</p>

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

              <p className="mt-8 text-center text-xs text-white/40">
                © 2026 Intellinks East Africa
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
