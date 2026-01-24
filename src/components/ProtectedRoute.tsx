import { forwardRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(
  function ProtectedRoute({ children, requireAdmin = false }, ref) {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
      return (
        <div ref={ref} className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/auth" replace />;
    }

    if (requireAdmin && !isAdmin) {
      return <Navigate to="/" replace />;
    }

    return <div ref={ref}>{children}</div>;
  }
);
