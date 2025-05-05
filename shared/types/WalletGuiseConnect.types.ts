import type { Commitment, PublicKey, Transaction } from "@solana/web3.js"
import type {
  IdentifierArray,
  IdentifierRecord,
  Wallet,
  WalletAccount,
  WalletIcon,
  WalletVersion,
  StandardConnectInput,
  StandardConnectOutput
} from "wallet-standard"

export const ERROR_LOCKED = "locked"

export type BackgroundResponse<T> = T | { error: string };

export interface SendTransactionOptions {
  skipPreflight?: boolean;
  preflightCommitment?: Commitment;  // Now properly typed
}

export const WALLET_STANDARD_SOLANA_CHAIN_KEYS = {
  SOLANA_MAINNET: "solana:mainnet",
  SOLANA_DEVNET: "solana:devnet",
  SOLANA_TESTNET: "solana:testnet",
  SOLANA_LOCALNET: "solana:localnet"
}

export const WALLETGUISE_FEATURE_KEYS = {
  SOLANA_SIGN_AND_SEND_TRANSACTION: "solana:signAndSendTransaction",
  SOLANA_SIGN_IN: "solana:signIn",
  SOLANA_SIGN_TRANSACTION: "solana:signTransaction",
  SOLANA_SIGN_MESSAGE: "solana:signMessage"
}



export interface WalletGuiseFeatures {
  'wallet:connect': {
    version: '1.0.0';
    connect(): Promise<PublicKey>;
  };
  'wallet:disconnect': {
    version: '1.0.0';
    disconnect(): Promise<void>;
  };
  'wallet:signAndSendTransaction': {
    version: '1.0.0';
    signAndSendTransaction(
      transaction: Transaction,
      options?: SendTransactionOptions
    ): Promise<{ signature: string }>;
  };
  // You can add more custom features here
}

export interface WalletGuiseWallet extends Wallet {
  readonly version: WalletVersion;
  readonly name: string;
  readonly icon: WalletIcon;
  readonly chains: IdentifierArray;
  readonly features: IdentifierRecord<unknown>;
  readonly accounts: readonly WalletAccount[];

  /** Opens the extension’s prompt and resolves with the selected account */
  connect(input?: StandardConnectInput) : Promise<StandardConnectOutput>;
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
