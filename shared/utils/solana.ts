import { writable } from "svelte/store"

export const solPrice = writable<number | null>(null)
let lastFetch = 0

export async function refreshSolPrice() {
  try {
    if (Date.now() - lastFetch < 30000) return // 30-second cache

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    )
    const data = await response.json()
    solPrice.set(data.solana.usd)
    lastFetch = Date.now()
  } catch (err) {
    console.error("Price update failed:", err)
  }
}
