import { type Keypair } from "@solana/web3.js"
import { writable } from "svelte/store"

export const kpStore = writable<Keypair | null>(null);