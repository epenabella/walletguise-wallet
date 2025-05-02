import { type Keypair } from "@solana/web3.js"
import { STORAGE_KEYS } from "~shared/utils/secureStore"
import bs58 from "bs58"
import { sha256 } from "~shared/utils/crypto"
import { writable } from "svelte/store"
import { SecureStorage } from "@plasmohq/storage/secure"

export const kpStore = writable<Keypair | null>(null);

export async function saveNewWallet(keypair: Keypair, password: string, secureStorage: SecureStorage) {
  await secureStorage.setPassword(password);   // stores the symmetric key in RAM
  await secureStorage.set(STORAGE_KEYS.ENC_WALLET, bs58.encode(keypair.secretKey));
  await secureStorage.set(STORAGE_KEYS.HASH, await sha256(password));
}