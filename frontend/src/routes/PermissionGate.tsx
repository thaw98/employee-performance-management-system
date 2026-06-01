import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePermissionState } from '../features/permission';

interface PermissionGateProps {
  moduleKey: string;
  actionKey?: string;
  children: ReactNode;
}

export function PermissionGate({ moduleKey, actionKey = 'view', children }: PermissionGateProps) {
  const location = useLocation();
  const { isReady, hasPermission } = usePermissionState();

  if (!isReady) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading permissions...
      </div>
    );
  }

  if (!hasPermission(moduleKey, actionKey)) {
    return <Navigate to=".." replace state={{ deniedFrom: location }} />;
  }

  return <>{children}</>;
}

