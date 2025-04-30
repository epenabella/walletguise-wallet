import { SecureStorage } from "@plasmohq/storage/secure"; // docs: framework/storage

export const secureStore = new SecureStorage({area: 'local'});

export const STORAGE_KEYS = {
    HASH: "walletguise_password_hash",
    ENC_WALLET: "walletguise_encrypted_wallet"
} as const;

export const set = <T>(key: string, value: T) => secureStore.set(key, value);
export const get = <T = unknown>(key: string) => secureStore.get<T>(key);
export const remove = (key: string) => secureStore.remove(key);
export const setPassword = (input: string) => secureStore.setPassword(input);
