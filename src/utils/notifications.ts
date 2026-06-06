/**
 * notifications.ts
 * Browser notification helper utilities.
 * All functions are client-side only.
 */

/**
 * Requests browser notification permission.
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Returns true if the browser supports and has granted notification permission.
 */
export function canSendNotification(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Sends a browser notification.
 * Silently no-ops if permission is not granted.
 */
export function sendNotification(title: string, body: string, tag?: string): void {
  if (!canSendNotification()) return;
  new Notification(title, {
    body,
    tag,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
}
