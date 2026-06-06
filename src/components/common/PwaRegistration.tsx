'use client';

import React, { useEffect } from 'react';

export const PwaRegistration: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Rwive Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error('Rwive Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
};
