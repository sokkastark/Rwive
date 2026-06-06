'use client';

import React, { useEffect } from 'react';

export const PwaRegistration: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('[Rwive] SW registered:', registration.scope);

      // When a new SW is waiting, reload immediately to apply the update
      const onUpdateFound = () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Rwive] New build available — reloading...');
            window.location.reload();
          }
        });
      };

      registration.addEventListener('updatefound', onUpdateFound);

      // Also check for an already-waiting worker on first load
      if (registration.waiting && navigator.serviceWorker.controller) {
        console.log('[Rwive] SW waiting — reloading...');
        window.location.reload();
      }
    }).catch((err) => {
      console.error('[Rwive] SW registration failed:', err);
    });

    // Reload when the controlling SW changes (after skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  return null;
};
