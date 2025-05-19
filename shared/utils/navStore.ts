import { writable } from "svelte/store"

export type AuthTab =
  | "balance"
  | "send"
  | "history"
  | "settings"
  | "receive"
  | "nfts"

export const selectedAuthTab = writable<AuthTab>("balance")
