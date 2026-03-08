import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
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
    'Secure authentication & role-based access',
    'Integrated helpdesk & asset management',
    'AI-powered assistant for every user',
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden w-[55%] lg:flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-white/[0.05] blur-3xl" />
        <div className="absolute left-10 top-20 h-2 w-2 rounded-full bg-white/30 animate-float" />
        <div className="absolute right-32 top-40 h-1.5 w-1.5 rounded-full bg-white/20 animate-float" style={{ animationDelay: '1.5s' }} />

        {/* Top logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm p-2">
            <img src={intellinksLogo} alt="" className="h-full w-full object-contain" />
          </div>
        </motion.div>

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 max-w-lg"
        >
          <h1 className="font-display text-4xl font-bold text-white leading-tight tracking-tight">
            Enterprise Management<br />
            <span className="text-white/80">Portal</span>
          </h1>
          <p className="mt-4 text-base text-white/60 leading-relaxed max-w-sm">
            Streamline your operations with a unified platform for helpdesk, projects, finance, and more.
          </p>
          <div className="mt-10 space-y-3">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3 text-white/80"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs text-white/30">Intellinks East Africa © 2026</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-[45%] bg-background">
        {/* Mobile logo */}
        <div className="mb-10 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary p-2">
              <img src={intellinksLogo} alt="" className="h-full w-full object-contain brightness-0 invert" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">Intellinks EA</h1>
              <p className="text-xs text-muted-foreground">Enterprise Portal</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@intellinks.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl gradient-primary text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Contact your administrator for account access
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
