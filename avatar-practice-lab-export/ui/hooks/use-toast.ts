import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastState {
  toasts: Toast[];
}

let toastCount = 0;

function generateId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

const toastListeners: Set<(toasts: Toast[]) => void> = new Set();
let memoryState: ToastState = { toasts: [] };

function dispatch(toast: Toast) {
  memoryState = {
    toasts: [...memoryState.toasts, toast].slice(-5),
  };
  toastListeners.forEach((listener) => listener(memoryState.toasts));
}

function dismiss(toastId?: string) {
  memoryState = {
    toasts: toastId
      ? memoryState.toasts.filter((t) => t.id !== toastId)
      : [],
  };
  toastListeners.forEach((listener) => listener(memoryState.toasts));
}

export function toast({
  title,
  description,
  variant = "default",
}: Omit<Toast, "id">) {
  const id = generateId();
  dispatch({ id, title, description, variant });
  
  setTimeout(() => {
    dismiss(id);
  }, 5000);

  return {
    id,
    dismiss: () => dismiss(id),
  };
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState.toasts);

  const subscribe = useCallback((callback: (toasts: Toast[]) => void) => {
    toastListeners.add(callback);
    return () => {
      toastListeners.delete(callback);
    };
  }, []);

  useState(() => {
    const unsubscribe = subscribe(setToasts);
    return unsubscribe;
  });

  return {
    toasts,
    toast,
    dismiss,
  };
}
