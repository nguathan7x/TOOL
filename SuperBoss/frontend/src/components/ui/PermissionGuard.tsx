import type { PropsWithChildren, ReactNode } from 'react';

type PermissionGuardProps = PropsWithChildren<{
  allowed: boolean;
  fallback?: ReactNode;
}>;

export function PermissionGuard({ allowed, fallback = null, children }: PermissionGuardProps) {
  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

