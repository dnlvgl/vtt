import { create } from "zustand";

export interface Toast {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: string) => void;
}

const MAX_TOASTS = 5;
let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = String(++nextId);
    set((s) => ({
      toasts: [...s.toasts.slice(-(MAX_TOASTS - 1)), { id, type, message }],
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
