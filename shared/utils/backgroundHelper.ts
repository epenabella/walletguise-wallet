// backgroundHelper.ts
import type { Transaction } from "@solana/web3.js"
import type { BackgroundResponse, SendTransactionOptions } from "~shared/types/WalletGuiseConnect.types"

// Core messaging function
async function send<T>(type: string, data?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type, data },
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
  await send('walletguise#unlock', { password });
}

export async function restoreWallet(secretKey: string): Promise<void> {
  await send('walletguise#restore', { secretKey });
}

export async function disconnectWallet(): Promise<void> {
  await send('walletguise#disconnect');
}

// Wallet operations
export async function connectWallet(): Promise<string> {
  const { publicKey } = await send<{ publicKey: string }>('walletguise#connect');
  return publicKey;
}

export async function getBalance(): Promise<number> {
  const { lamports } = await send<{ lamports: number }>('walletguise#getBalance');
  return lamports;
}

// Transactions
export async function signAndSendTransaction(
  transaction: Transaction,
  options?: SendTransactionOptions
): Promise<string> {
  const serializedTx = transaction.serialize();
  const { signature } = await send<{ signature: string }>(
    'walletguise#signAndSend',
    {
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