import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '../../admin/api/adminApi';
import type { AppNotification, Invite } from '../../admin/types';
import { markSharedProjectAccepted } from '../../projects/shared-projects';

export function useNotificationsInbox(token: string | null | undefined, options?: { unreadOnly?: boolean; pollIntervalMs?: number; preserveDataOnRefresh?: boolean }) {
  const unreadOnly = options?.unreadOnly ?? true;
  const pollIntervalMs = options?.pollIntervalMs ?? 0;
  const preserveDataOnRefresh = options?.preserveDataOnRefresh ?? false;

  const [invites, setInvites] = useState<Invite[]>([]);
  const [signals, setSignals] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (mode: 'initial' | 'background' = 'initial') => {
    if (!token) {
      setInvites([]);
      setSignals([]);
      setIsLoading(false);
      setError(null);
      hasLoadedRef.current = false;
      return;
    }

    const shouldShowLoading = mode === 'initial' && (!preserveDataOnRefresh || !hasLoadedRef.current);

    if (shouldShowLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [inviteItems, signalResponse] = await Promise.all([
        adminApi.listMyInvites(token),
        adminApi.listMyNotifications(token, unreadOnly)
      ]);
      setInvites(inviteItems);
      setSignals(signalResponse.items);
      hasLoadedRef.current = true;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load notifications');
      if (!hasLoadedRef.current) {
        setInvites([]);
        setSignals([]);
      }
    } finally {
      if (shouldShowLoading) {
        setIsLoading(false);
      }
    }
  }, [preserveDataOnRefresh, token, unreadOnly]);

  useEffect(() => {
    let intervalId: ReturnType<typeof window.setInterval> | null = null;
    void load('initial');

    if (pollIntervalMs > 0) {
      intervalId = window.setInterval(() => {
        void load('background');
      }, pollIntervalMs);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [load, pollIntervalMs]);

  const acceptInvite = useCallback(async (invite: Invite) => {
    if (!token) {
      return;
    }

    setIsMutating(true);
    setError(null);

    try {
      await adminApi.acceptInvite(token, invite.id);
      if (invite.scopeType === 'PROJECT' && invite.projectId) {
        markSharedProjectAccepted(invite.projectId);
      }
      await load('background');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to accept invite');
      throw nextError;
    } finally {
      setIsMutating(false);
    }
  }, [load, token]);

  const declineInvite = useCallback(async (inviteId: string) => {
    if (!token) {
      return;
    }

    setIsMutating(true);
    setError(null);

    try {
      await adminApi.declineInvite(token, inviteId);
      await load('background');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to decline invite');
      throw nextError;
    } finally {
      setIsMutating(false);
    }
  }, [load, token]);

  const markSignalRead = useCallback(async (signalId: string, optimistic = false) => {
    if (!token) {
      return;
    }

    if (optimistic) {
      setSignals((current) => current.filter((signal) => signal.id !== signalId));
    }

    try {
      await adminApi.markNotificationRead(token, signalId);
      if (!optimistic) {
        await load('background');
      }
    } catch (nextError) {
      if (optimistic) {
        await load('background');
      }
      setError(nextError instanceof Error ? nextError.message : 'Failed to mark signal as read');
      throw nextError;
    }
  }, [load, token]);

  const counts = useMemo(() => ({
    invites: invites.length,
    signals: signals.length,
    total: invites.length + signals.length
  }), [invites.length, signals.length]);

  return {
    invites,
    signals,
    counts,
    isLoading,
    isMutating,
    error,
    reload: load,
    acceptInvite,
    declineInvite,
    markSignalRead,
    setError
  };
}
