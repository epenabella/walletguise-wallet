// backgroundHelper.ts
import { type Transaction } from "@solana/web3.js"
import type { BackgroundResponse, SendTransactionOptions } from "~shared/types/WalletGuiseConnect.types"
import { clusterStore, rpcUrl } from "~shared/utils/networkStore"
import { get } from "svelte/store"

type message = { type: string } & any;

// Core messaging function
async function send<T>(message): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      message,
      (response: BackgroundResponse<T>) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          // @ts-ignore
          if (response && "error" in response) {
            reject(new Error(response.error))
          } else {
            resolve(response as T)
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
  const { publicKey } = await send<{ publicKey: string }>({type: 'walletguise#connect'});
  return publicKey;
}

export async function getBalance(): Promise<number> {
  const { lamports } = await send<{ lamports: number }>({
    type: 'walletguise#getBalance',
    rpcUrl: get(rpcUrl),
  });
  return lamports;
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