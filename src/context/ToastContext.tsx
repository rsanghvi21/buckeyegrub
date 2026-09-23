/**
 * BuckeyeGrub Toast Context & Provider
 * Global, reactive toast notifications accessible throughout the application.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Toast, ToastType } from '../components/ui/Toast';

export interface ShowToastOptions {
  message: string;
  type?: ToastType;
  durationMs?: number;
}

export interface ToastContextValue {
  showToast: (options: ShowToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('scarlet');
  const [durationMs, setDurationMs] = useState(3000);

  const showToast = useCallback((options: ShowToastOptions | string) => {
    if (typeof options === 'string') {
      setMessage(options);
      setType('scarlet');
      setDurationMs(3000);
    } else {
      setMessage(options.message);
      setType(options.type || 'scarlet');
      setDurationMs(options.durationMs || 3000);
    }
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={visible}
        message={message}
        type={type}
        durationMs={durationMs}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
