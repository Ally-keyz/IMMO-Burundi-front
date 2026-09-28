import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAgentRole } from '../lib/roles';

export default function AgentRoute({ children }: { children: JSX.Element }): JSX.Element {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center text-brand-600">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (!isAgentRole(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}