// backgroundHelper.ts
import { type Transaction } from "@solana/web3.js";
import { get } from "svelte/store";

import type { BackgroundResponse, SendTransactionOptions } from "~shared/types/WalletGuiseConnect.types";
import { ERROR_LOCKED } from '~shared/types/WalletGuiseConnect.types';
import { kpStore } from "~shared/utils/kpStore";
import { rpcUrl } from "~shared/utils/networkStore";



type message = { type: string } & any;

// Core messaging function
async function send<T>(message: message): Promise<T> {

  debugger;

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      message,
      (response: BackgroundResponse<T>) => {
        debugger;
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

export async function getBalance(): Promise<number> {
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
  const serializedTx = transaction.serialize();
  const { signature } = await send<{ signature: string }>(
    {
      type: 'walletguise#signAndSend',
      rpcUrl: get(rpcUrl),
      tx: Array.from(serializedTx),
      options
    }
  );
  return signature;
}

// UI functions
export async function openPopup(): Promise<void> {
  await send('walletguise#openPopup');
}