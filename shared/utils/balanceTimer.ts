// stores/balanceTimer.ts
import { writable } from "svelte/store"

interface BalanceTimer {
  isRunning: boolean
  intervalId: number | null
}

function createBalanceTimer() {
  const { subscribe, set, update } = writable<BalanceTimer>({
    isRunning: false,
    intervalId: null
  })

  let fetchBalanceCallback: (() => void) | null = null

  return {
    subscribe,

    // Start the timer with a fetch callback and interval (default 30 seconds)
    start: (fetchBalance: () => void, intervalMs: number = 30_000) => {
      // Store the callback for restarting
      fetchBalanceCallback = fetchBalance

      // Clear any existing interval
      update((state) => {
        if (state.intervalId) {
          clearInterval(state.intervalId)
        }
        return state
      })

      // Fetch immediately
      fetchBalance()

      // Set up the interval
      const intervalId = setInterval(fetchBalance, intervalMs) as any as number

      set({
        isRunning: true,
        intervalId
      })
    },

    // Stop the timer
    stop: () => {
      update((state) => {
        if (state.intervalId) {
          clearInterval(state.intervalId)
        }
        return {
          isRunning: false,
          intervalId: null
        }
      })
    },

    // Restart the timer with the same callback and interval
    restart: (intervalMs: number = 30_000) => {
      if (fetchBalanceCallback) {
        update((state) => {
          if (state.intervalId) {
            clearInterval(state.intervalId)
          }
          return state
        })

        // Fetch immediately
        // fetchBalanceCallback();

        // Set up new interval
        const intervalId = setInterval(
          fetchBalanceCallback,
          intervalMs
        ) as any as number

        set({
          isRunning: true,
          intervalId
        })
      }
    },

    // Refresh immediately (fetch now without restarting timer)
    refresh: () => {
      if (fetchBalanceCallback) {
        fetchBalanceCallback()
      }
    }
  }
}

export const balanceTimer = createBalanceTimer()
