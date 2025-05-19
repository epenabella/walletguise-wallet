import { derived, get, writable, type Writable } from "svelte/store"

import { getBalanceBackground } from "~shared/utils/backgroundHelper"
import { balanceTimer } from "~shared/utils/balanceTimer"
import { kpStore } from "~shared/utils/kpStore"
import { refreshSolPrice } from "~shared/utils/solana"

export const balanceStore = writable<number | null>(null)
export const loadingBalance = writable<boolean>(true)

export const sol = derived(balanceStore, ($balanceStore) =>
  $balanceStore === null ? null : $balanceStore / 1_000_000_000
)

export async function fetchBalance() {
  try {
    if (!get(kpStore)) return

    loadingBalance.set(true)

    const lamports = await getBalanceBackground()
    balanceTimer.restart()
    balanceStore.set(lamports)
    refreshSolPrice()
  } finally {
    loadingBalance.set(false)
  }
}
