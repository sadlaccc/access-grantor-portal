import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 gradient-primary lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-3 shadow-lg">
              <img src={intellinksLogo} alt="Intellinks East Africa" className="h-full w-full object-contain" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-white">
            Intellinks East Africa
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Enterprise Management Portal
          </p>
          <div className="mt-12 space-y-4 text-left">
            <div className="flex items-center gap-3 text-white/90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <CheckCircle className="h-4 w-4" />
              </div>
              <span>Secure authentication & role-based access</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <CheckCircle className="h-4 w-4" />
              </div>
              <span>Integrated helpdesk & asset management</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <CheckCircle className="h-4 w-4" />
              </div>
              <span>AI-powered assistant for every user</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 p-1">
              <img src={intellinksLogo} alt="Intellinks East Africa" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Intellinks East Africa</h1>
              <p className="text-sm text-muted-foreground">Enterprise Management Portal</p>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-md border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@intellinks.co.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Contact your administrator if you need an account
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          © 2024 Intellinks East Africa. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Auth;