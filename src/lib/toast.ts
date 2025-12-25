import toast from 'react-hot-toast';

/**
 * Toast notification utility wrapper for react-hot-toast
 * Provides consistent styling and behavior across the application
 */

export const showToast = {
  /**
   * Show a success toast notification
   */
  success: (message: string) => {
    return toast.success(message, {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#10B981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
      icon: '✓',
    });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string) => {
    return toast.error(message, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#EF4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
      icon: '✕',
    });
  },

  /**
   * Show a loading toast notification
   */
  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-center',
      style: {
        background: '#3B82F6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },

  /**
   * Show an info toast notification
   */
  info: (message: string) => {
    return toast(message, {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#3B82F6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
      },
      icon: 'ℹ',
    });
  },

  /**
   * Show a promise toast that updates based on promise state
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        position: 'top-center',
        style: {
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
        },
      }
    );
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};

