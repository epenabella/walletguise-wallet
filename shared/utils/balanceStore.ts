import { derived, get, type Writable, writable } from "svelte/store"
import { refreshSolPrice } from "~shared/utils/solana"
import { getBalance } from "~shared/utils/backgroundHelper"
import { kpStore } from "~shared/utils/kpStore"

export const balanceStore = writable<number | null>(null)

export const sol = derived(
  balanceStore,
  ($balanceStore) => $balanceStore === null ? null : $balanceStore / 1_000_000_000
);

export async function fetchBalance(loading?: Writable<boolean>) {
  try {
    if (!get(kpStore)) return;
    if (typeof loading !== "undefined") {
      loading.set(true)
    }
    const lamports = await getBalance();

    balanceStore.set(lamports)
    refreshSolPrice()
  } finally {
    if (typeof loading !== "undefined") {
      loading.set(false)
    }
  }
}