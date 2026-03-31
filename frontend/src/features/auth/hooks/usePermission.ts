import { useAuth } from './useAuth';

export function usePermission() {
  const { user } = useAuth();
  const isSuperAdmin = user?.globalRole === 'SUPER_ADMIN';
  const canAccessControlConsole = Boolean(user?.email);

  return {
    user,
    isSuperAdmin,
    can(permission: 'admin.access' | 'control.access') {
      if (permission === 'admin.access') {
        return isSuperAdmin;
      }

      if (permission === 'control.access') {
        return canAccessControlConsole;
      }

      return false;
    }
  };
}
