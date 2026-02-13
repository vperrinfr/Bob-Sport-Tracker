import { Toaster } from 'react-hot-toast';

/**
 * Toast notification component with custom styling
 * Uses react-hot-toast for elegant notifications
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-color)',
          border: '1px solid var(--toast-border)',
          borderRadius: '0.75rem',
          padding: '1rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
          style: {
            background: 'var(--toast-success-bg)',
            color: 'var(--toast-success-color)',
            border: '1px solid var(--toast-success-border)',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
          style: {
            background: 'var(--toast-error-bg)',
            color: 'var(--toast-error-color)',
            border: '1px solid var(--toast-error-border)',
          },
        },
        loading: {
          iconTheme: {
            primary: '#0ea5e9',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}

// Made with Bob
