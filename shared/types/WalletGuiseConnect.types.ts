import type { Commitment, PublicKey, Transaction } from "@solana/web3.js"

export const ERROR_LOCKED = "locked"

export type BackgroundResponse<T> = T | { error: string };

export interface SendTransactionOptions {
  skipPreflight?: boolean;
  preflightCommitment?: Commitment;  // Now properly typed
}

export interface WalletGuiseWallet {
  /** Opens the extension’s prompt and resolves with the selected account */
  connect(): Promise<PublicKey>
  /** Ends the session in both web‑app & extension */
  disconnect(): Promise<void>
  /** Subscribe to provider events – mirrors Solflare */
  on(
    event: "connect" | "disconnect",
    callback: (publicKey: PublicKey | null) => void
  ): void
  /** Sign + send a serialized transaction */
  signAndSendTransaction(
    transaction: Transaction,
    options?: SendTransactionOptions
  ): Promise<{ signature: string }>
  /** Reactive props – updated internally */
  readonly isConnected: boolean
  readonly publicKey: PublicKey | null
}
