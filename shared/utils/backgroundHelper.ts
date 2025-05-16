// backgroundHelper.ts
import { type Keypair, type Transaction } from "@solana/web3.js"
import { get } from "svelte/store";

import type { BackgroundResponse, SendTransactionOptions } from "~shared/types/WalletGuiseConnect.types";
import { ERROR_LOCKED } from '~shared/types/WalletGuiseConnect.types';
import { kpStore } from "~shared/utils/kpStore";
import { rpcUrl } from "~shared/utils/networkStore";
import bs58 from "bs58"
import { wgLocalSecureStore } from "~shared/utils/wgAppStore"
import type { WalletStandardConfirmationRequestType } from "~shared/utils/confirmationManager"


export type BackgroundMessage = { type: string, specificType?: WalletStandardConfirmationRequestType } & any;

// Core messaging function
async function send<T>(message: BackgroundMessage): Promise<T> {

  // debugger;

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      message,
      (response: BackgroundResponse<T>) => {
        // debugger;
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          // @ts-ignore
          if (response && "error" in response) {

            if (response.error?.toLowerCase() === ERROR_LOCKED) {
              kpStore.set(null);
            }
            reject(new Error(response.error))
            return;
          } else {
            resolve(response as T)
            return;
          }
        }
      }
    )
  });
}


// Auth functions
export async function unlockWallet(password: string): Promise<void> {
  await send(
    {
      type: 'walletguise#unlock',
      password,
    });
}

export async function saveWallet(password: string, privateKey: string, hash: string): Promise<void> {
  await send({ type: 'walletguise#saveWallet', password, privateKey, hash });
}

export async function restoreWallet(secretKey: string): Promise<void> {
  await send({ type: 'walletguise#restore', secretKey });
}

export async function disconnectWallet(): Promise<void> {
  await send({type: 'walletguise#disconnect'});
}

// Wallet operations
export async function connectWallet(): Promise<string> {
  const { publicKey } = await send<{ publicKey: string }>({
    type: "walletguise#connect"
  })
  return publicKey
}

export async function getBalanceBackground(): Promise<number> {
  const { lamports } = await send<{ lamports: number }>({
    type: "walletguise#getBalance",
    rpcUrl: get(rpcUrl)
  }).catch((e) => {
    console.error(JSON.stringify(e))
    return { lamports: -1 }
  })
  return lamports
}

// Transactions
export async function signAndSendTransaction(
  transaction: Transaction,
  options?: SendTransactionOptions
): Promise<string> {
  const serializedTx = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false
  });

  console.log(`backgroundHelper serializedTx`, serializedTx);

  const { signature } = await send<{ signature: string }>(
    {
      type: 'walletguise#signAndSend',
      rpcUrl: get(rpcUrl),
      tx: serializedTx,
      options
    }
  );
  return signature;
}

export async function deleteKeys(): Promise<void> {
  // Disconnect first so adapters can tidy up
  // await disconnectWallet().catch(() => {/* already disconnected */})
  await send({ type: "walletguise#deleteKeys" })
  // Local writable store that mirrors the background keypair
  await wgLocalSecureStore.clear();
  kpStore.set(null);
  await disconnectWallet();

}

// UI functions
// export async function openPopup(): Promise<void> {
//   await send('walletguise#openPopup');
// }