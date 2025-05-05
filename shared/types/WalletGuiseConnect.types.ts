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
import type {
  SolanaSignAndSendTransactionInput,
  SolanaSignAndSendTransactionOutput,
  SolanaSignMessageInput, SolanaSignMessageOutput, SolanaSignTransactionInput, SolanaSignTransactionOutput
} from "@solana/wallet-standard-features"

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

export interface SolanaSignInInput {
  domain?: string;         // The domain requesting the sign-in
  statement?: string;      // Human-readable statement for the user to approve
  uri?: string;            // URI for the sign-in request
  version?: string;        // Version of SIWS being used (default is "1")
  chainId?: string;        // Chain ID (e.g., "solana:mainnet")
  nonce?: string;          // Random string to prevent replay attacks
  address?: string;        // Optional Solana address for sign-in
  issuedAt?: string;       // ISO timestamp of when the request was issued
  expirationTime?: string; // Optional expiration time
  notBefore?: string;      // Optional not-before time
  requestId?: string;      // Optional request ID
  resources?: string[];    // Optional array of resources
}

// Output interface returned from signIn
export interface SolanaSignInOutput {
  account: WalletAccount;
  signature: Uint8Array;    // The signature bytes
  signedMessage: Uint8Array; // The message that was signed
}

export type SolanaSignInInputWithRequiredFields = SolanaSignInInput &
  Required<Pick<SolanaSignInInput, 'domain' | 'address'>>;

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

  signIn(input?: SolanaSignInInput): Promise<SolanaSignInOutput[]>
  signTransaction(
    ...inputs: SolanaSignTransactionInput[]
  ): Promise<readonly SolanaSignTransactionOutput[]>

  //(...inputs: readonly SolanaSignMessageInput[]) => Promise<readonly SolanaSignMessageOutput[]>;

  signMessage(
    ...inputs: readonly SolanaSignMessageInput[]
  ): Promise<readonly SolanaSignMessageOutput[]>
  /** Sign + send a serialized transaction */
  signAndSendTransaction(
    ...inputs: SolanaSignAndSendTransactionInput[]
  ): Promise<readonly SolanaSignAndSendTransactionOutput[]>

  /** Reactive props – updated internally */
  readonly isConnected: boolean
  readonly publicKey: PublicKey | null
}
