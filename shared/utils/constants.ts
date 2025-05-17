import type { Cluster } from "@solana/web3.js"
import { PublicKey } from "@solana/web3.js"





export const STORAGE_KEYS = {
  HASH: "walletguise_password_hash",
  ENC_WALLET: "walletguise_encrypted_wallet",
  CLUSTER: "wg-selected-cluster",
  SESSION_WALLET: "wg_session_wallet"
} as const

export const LOADING_MESSAGES = ["loading...", "solving puzzles..."]

const CLIENT_PUBLIC_KEY_DEV = new PublicKey(
  "73mi7xq7neWW8FdbPsLx5sAmD3nDW1ob3sx8kwqS14Mh"
)
const CLIENT_PUBLIC_KEY_MAINNET = new PublicKey(
  "94MNrZnyojGPKzH3eVczt5ewdkNxKN2AUc7dUPraZeNN"
)

export function getClientPublicKey(cluster: Cluster): PublicKey {
  switch (cluster) {
    case "devnet":
      return CLIENT_PUBLIC_KEY_DEV
    case "mainnet-beta":
      return CLIENT_PUBLIC_KEY_MAINNET
    default:
      throw new Error(`Unsupported cluster: ${cluster}`)
  }
}


export const getClientKey = (cluster: Cluster) => {

}
