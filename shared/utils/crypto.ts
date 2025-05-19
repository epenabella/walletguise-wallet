import {
  generateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic
} from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english"
import type { SolanaSignInInputWithRequiredFields } from "@solana/wallet-standard-util/src/signIn"
import { Keypair } from "@solana/web3.js"
import { derivePath } from "ed25519-hd-key" // tiny lib, Phantom uses it

import type { SolanaSignInInput } from "~shared/types/WalletGuiseConnect.types"

export async function sha256(msg: string): Promise<string> {
  const buf = new TextEncoder().encode(msg)
  const hash = await crypto.subtle.digest("SHA-256", buf)
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// AES‑GCM helpers – enough for local, *not* production‑grade key‑stretching.
const ivLength = 12 // 96‑bit nonce

async function getKeyFromPassword(password: string) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("walletguise-salt"),
      iterations: 50_000,
      hash: "SHA-256"
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function encrypt(
  data: Uint8Array,
  password: string
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(ivLength))
  const key = await getKeyFromPassword(password)
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(cipher)))}`
}

export async function decrypt(
  cipherText: string,
  password: string
): Promise<Uint8Array> {
  const [ivB64, dataB64] = cipherText.split(".")
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0))
  const data = Uint8Array.from(atob(dataB64), (c) => c.charCodeAt(0))
  const key = await getKeyFromPassword(password)
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)
  return new Uint8Array(plain)
}

export function importFromMnemonic(
  mnemonic: string,
  account = 0
): { keypair: Keypair } {
  if (!validateMnemonic(mnemonic, wordlist)) throw new Error("Invalid phrase")
  const seed = mnemonicToSeedSync(mnemonic.trim(), "")
  const path = `m/44'/501'/${account}'/0'` // ← add /0'   // Solflare path

  const hexString = Buffer.from(seed).toString("hex")
  const { key } = derivePath(path, hexString)

  const keypair = Keypair.fromSeed(key)

  console.log("keypair imported public: ", keypair.publicKey.toString())
  console.log("keypair imported private: ", keypair.secretKey.toString())

  return { keypair }
}

export function generateNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function createSignInMessageText(
  input: SolanaSignInInputWithRequiredFields
): string {
  // ${domain} wants you to sign in with your Solana account:
  // ${address}
  //
  // ${statement}
  //
  // URI: ${uri}
  // Version: ${version}
  // Chain ID: ${chain}
  // Nonce: ${nonce}
  // Issued At: ${issued-at}
  // Expiration Time: ${expiration-time}
  // Not Before: ${not-before}
  // Request ID: ${request-id}
  // Resources:
  // - ${resources[0]}
  // - ${resources[1]}
  // ...
  // - ${resources[n]}

  let message = `${input.domain} wants you to sign in with your Solana account:\n`
  message += `${input.address}`

  if (input.statement) {
    message += `\n\n${input.statement}`
  }

  const fields: string[] = []
  if (input.uri) {
    fields.push(`URI: ${input.uri}`)
  }
  if (input.version) {
    fields.push(`Version: ${input.version}`)
  }
  if (input.chainId) {
    fields.push(`Chain ID: ${input.chainId}`)
  }
  if (input.nonce) {
    fields.push(`Nonce: ${input.nonce}`)
  }
  if (input.issuedAt) {
    fields.push(`Issued At: ${input.issuedAt}`)
  }
  if (input.expirationTime) {
    fields.push(`Expiration Time: ${input.expirationTime}`)
  }
  if (input.notBefore) {
    fields.push(`Not Before: ${input.notBefore}`)
  }
  if (input.requestId) {
    fields.push(`Request ID: ${input.requestId}`)
  }
  if (input.resources) {
    fields.push(`Resources:`)
    for (const resource of input.resources) {
      fields.push(`- ${resource}`)
    }
  }
  if (fields.length) {
    message += `\n\n${fields.join("\n")}`
  }

  return message
}

const DOMAIN =
  "(?<domain>[^\\n]+?) wants you to sign in with your Solana account:\\n"
const ADDRESS = "(?<address>[^\\n]+)(?:\\n|$)"
const STATEMENT = "(?:\\n(?<statement>[\\S\\s]*?)(?:\\n|$))??"
const URI = "(?:\\nURI: (?<uri>[^\\n]+))?"
const VERSION = "(?:\\nVersion: (?<version>[^\\n]+))?"
const CHAIN_ID = "(?:\\nChain ID: (?<chainId>[^\\n]+))?"
const NONCE = "(?:\\nNonce: (?<nonce>[^\\n]+))?"
const ISSUED_AT = "(?:\\nIssued At: (?<issuedAt>[^\\n]+))?"
const EXPIRATION_TIME = "(?:\\nExpiration Time: (?<expirationTime>[^\\n]+))?"
const NOT_BEFORE = "(?:\\nNot Before: (?<notBefore>[^\\n]+))?"
const REQUEST_ID = "(?:\\nRequest ID: (?<requestId>[^\\n]+))?"
const RESOURCES = "(?:\\nResources:(?<resources>(?:\\n- [^\\n]+)*))?"
const FIELDS = `${URI}${VERSION}${CHAIN_ID}${NONCE}${ISSUED_AT}${EXPIRATION_TIME}${NOT_BEFORE}${REQUEST_ID}${RESOURCES}`
const MESSAGE = new RegExp(`^${DOMAIN}${ADDRESS}${STATEMENT}${FIELDS}\\n*$`)

export function createSignInMessage(
  input: SolanaSignInInput,
  address: string
): Uint8Array {
  // Enforce required fields
  const fullInput: SolanaSignInInputWithRequiredFields = {
    domain: input.domain || window.location.host,
    address, // MUST come from connected account
    // uri: input.uri || window.location.origin,
    // version: input.version || "1",
    // chainId: input.chainId || "solana:mainnet",
    // nonce: input.nonce || crypto.randomUUID(),
    // issuedAt: input.issuedAt || new Date().toISOString(),
    ...input
  }

  // Use official message builder
  return new TextEncoder().encode(createSignInMessageText(fullInput))
}

export function parseSignInMessage(
  message: Uint8Array
): SolanaSignInInputWithRequiredFields | null {
  const text = new TextDecoder().decode(message)
  return parseSignInMessageText(text)
}

export function parseSignInMessageText(
  text: string
): SolanaSignInInputWithRequiredFields | null {
  const match = MESSAGE.exec(text)
  if (!match) return null
  const groups = match.groups
  if (!groups) return null

  return {
    domain: groups.domain!,

    address: groups.address!,
    statement: groups.statement,
    uri: groups.uri,
    version: groups.version,
    nonce: groups.nonce,
    chainId: groups.chainId,
    issuedAt: groups.issuedAt,
    expirationTime: groups.expirationTime,
    notBefore: groups.notBefore,
    requestId: groups.requestId,
    resources: groups.resources?.split("\n- ").slice(1)
  }
}

export function formatPublicKey(
  publicKey: string | null | undefined,
  startChars: number = 4,
  endChars: number = 4
): string {
  // Handle null, undefined, or empty string
  if (!publicKey || typeof publicKey !== "string") {
    return ""
  }

  // If the string is short enough, return as-is
  if (publicKey.length <= startChars + endChars + 3) {
    return publicKey
  }

  // Create the shortened format with dots
  const start = publicKey.substring(0, startChars)
  const end = publicKey.substring(publicKey.length - endChars)

  return `${start}.....${end}`
}

// no pass-phrase
//const keypair = Keypair.fromSeed(seed.slice(0, 32));
