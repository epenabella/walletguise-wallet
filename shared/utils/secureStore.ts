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

// export function unlockLocalStorage(input: string) : boolean {
//   chrome.storage.local.get(null, items => {
//     let res = false;
//     Object.keys(items).forEach(key => {
//           console.log(`${key}: ${items[key]}`);
//           const maybeHashKey = key.split('|').at(-1);
//           if (maybeHashKey !== STORAGE_KEYS.HASH) return;
//
//           const hashValue = items[maybeHashKey];
//
//           res = input === hashValue;
//       })
//
//     throw Error(`no wallet`);
//   })
// }