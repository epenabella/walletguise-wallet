import { PublicKey } from "@solana/web3.js"

export const STORAGE_KEYS = {
  HASH: "walletguise_password_hash",
  ENC_WALLET: "walletguise_encrypted_wallet",
  CLUSTER: "wg-selected-cluster",
  SESSION_WALLET: "wg_session_wallet"
} as const

export const LOADING_MESSAGES = ["loading...", "solving puzzles..."]

export const CLIENT_PUBLIC_KEY = new PublicKey('73mi7xq7neWW8FdbPsLx5sAmD3nDW1ob3sx8kwqS14Mh');