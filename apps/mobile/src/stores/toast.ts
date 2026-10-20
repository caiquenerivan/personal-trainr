import { create } from 'zustand';

type ToastState = {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
};

let timer: ReturnType<typeof setTimeout> | null = null;

// Aviso curto no topo da tela, como os toasts do web.
export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    if (timer) clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => set({ message: null }), 4000);
  },
  hide: () => set({ message: null }),
}));

export const showToast = (message: string) => useToast.getState().show(message);
