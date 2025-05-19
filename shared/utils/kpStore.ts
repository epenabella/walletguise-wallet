import { type Keypair } from "@solana/web3.js"
import { writable } from "svelte/store"

export const kpStore = writable<Keypair | null>(null)

export const isClueGrinding = writable<boolean>(false)

export const showMoneyGif = writable<boolean>(false)

export const showMnemonicModal = writable<boolean>(false)
