/**
 * Global In-App Toast System
 * Allows showing beautiful, responsive, and themed notification toasts inside the app.
 */

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export const showToast = (
  message: string, 
  type: ToastType = 'info', 
  duration: number = 4000
) => {
  const event = new CustomEvent('fid_show_toast', {
    detail: {
      id: 'toast_' + Date.now() + Math.random().toString(36).substring(2, 7),
      type,
      message,
      duration
    }
  });
  window.dispatchEvent(event);
};
