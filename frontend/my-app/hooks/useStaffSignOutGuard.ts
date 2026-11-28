'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clearStaffSession } from '@/lib/staff-auth';

interface UseStaffSignOutGuardOptions {
  enabled?: boolean;
  onConfirmSignOut?: () => void;
}

/**
 * Hook to guard browser back navigation from role-specific staff flows.
 * Displays confirmation dialog when user presses the browser back button.
 * If user cancels, keeps them on the same page.
 * If user confirms, clears staff session and navigates to /staff.
 */
export function useStaffSignOutGuard({
  enabled = true,
  onConfirmSignOut,
}: UseStaffSignOutGuardOptions = {}) {
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Push a dummy history state so that when user clicks Back, popstate fires
    // and we can intercept without immediately leaving the page.
    window.history.pushState({ staffGuard: true }, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // If we are programmatically navigating away after confirmation, allow it
      if (isNavigatingRef.current) {
        return;
      }

      // Re-push the current page state to counteract the back button movement
      window.history.pushState({ staffGuard: true }, '', window.location.href);

      // Open the confirmation dialog
      setShowConfirmDialog(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled]);

  const handleCancel = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const handleConfirmSignOut = useCallback(() => {
    isNavigatingRef.current = true;
    setShowConfirmDialog(false);
    clearStaffSession();

    if (onConfirmSignOut) {
      onConfirmSignOut();
    } else {
      router.push('/staff');
    }
  }, [router, onConfirmSignOut]);

  return {
    showConfirmDialog,
    handleCancel,
    handleConfirmSignOut,
  };
}
