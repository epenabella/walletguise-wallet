import { derived, type Writable, writable } from "svelte/store"
import { refreshSolPrice } from "~shared/utils/solana"

const ERROR_LOCKED = "locked"
export const balanceStore = writable<number | null>(null)

export const sol = derived(
  balanceStore,
  ($balanceStore) => $balanceStore === null ? null : $balanceStore / 1_000_000_000
);

export async function fetchBalance(loading?: Writable<boolean>) {
  try {
    if (typeof loading !== "undefined") {
      loading.set(true)
    }
    const { lamports, error } = await chrome.runtime.sendMessage({
      type: "walletguise#getBalance"
    })
    if (error === ERROR_LOCKED) {
      // User was logged out in another popup tab – force reload to Login
      console.log('LOCKED!!!!');
      location.reload()
      return
    }

    balanceStore.set(lamports)
    refreshSolPrice()
  } finally {
    if (typeof loading !== "undefined") {
      loading.set(false)
    }
  }
}