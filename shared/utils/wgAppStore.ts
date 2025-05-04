import { Storage } from "@plasmohq/storage"; // docs: framework/storage
import { SecureStorage } from "@plasmohq/storage/secure";

export const wgLocalSecureStore = new SecureStorage({area: 'local'});
export const wgLocalStorage = new Storage({ area: "local" })

export const STORAGE_KEYS = {
  HASH: "walletguise_password_hash",
  ENC_WALLET: "walletguise_encrypted_wallet",
  CLUSTER: "wg-selected-cluster"
} as const

export const set = <T>(key: string, value: T) => wgLocalSecureStore.set(key, value);
export const get = <T = unknown>(key: string) => wgLocalSecureStore.get<T>(key);
export const remove = (key: string) => wgLocalSecureStore.remove(key);
export const setPassword = (input: string) => wgLocalSecureStore.setPassword(input);