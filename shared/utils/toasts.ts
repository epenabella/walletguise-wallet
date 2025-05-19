// stores/toasts.ts
import { writable, type Writable } from "svelte/store"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

function createToastStore() {
  const { subscribe, update }: Writable<Toast[]> = writable<Toast[]>([])

  const remove = (id: string): void => {
    update((toasts) => toasts.filter((t) => t.id !== id))
  }

  return {
    subscribe,
    add: (
      message: string,
      type: ToastType = "success",
      duration = 5000
    ): void => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: Toast = { id, message, type, duration }

      update((toasts) => [...toasts, newToast])

      if (duration > 0) {
        setTimeout(() => {
          remove(id)
        }, duration)
      }
    },
    remove
  }
}

export const toasts = createToastStore()

// For type inference when using the store
export type ToastStore = ReturnType<typeof createToastStore>
