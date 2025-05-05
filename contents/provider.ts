import { PublicKey, type Transaction } from "@solana/web3.js"
import type { PlasmoCSConfig } from "plasmo"
import nacl from "tweetnacl"
import {
  registerWallet,
  StandardConnect,
  StandardEvents,
  type IdentifierArray,
  type IdentifierRecord,
  type IdentifierString,
  type ReadonlyUint8Array,
  type StandardConnectFeature,
  type StandardConnectInput,
  type StandardConnectMethod,
  type StandardConnectOutput,
  type WalletAccount,
  type WalletIcon,
  type WalletVersion
} from "wallet-standard"

import { logoString } from "~shared/components/icons/logoString"
import {
  WALLET_STANDARD_SOLANA_CHAIN_KEYS,
  WALLETGUISE_FEATURE_KEYS,
  type SendTransactionOptions,
  type SolanaSignInInput,
  type SolanaSignInInputWithRequiredFields,
  type SolanaSignInOutput,
  type WalletGuiseFeatures,
  type WalletGuiseWallet
} from "~shared/types/WalletGuiseConnect.types"
import { createSignInMessageText, generateNonce, parseSignInMessage } from "~shared/utils/crypto"
import { createSignInMessage } from "@solana/wallet-standard-util"


export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN"
}

class WalletGuiseImpl implements WalletGuiseWallet {
  publicKey: PublicKey | null = null
  // isConnected = false
  private _accounts: WalletAccount[] = []
  get accounts(): readonly WalletAccount[] {
    return this._accounts
  }

  // readonly accounts: readonly WalletAccount[] = []
  readonly chains: IdentifierArray = [
    "solana:mainnet",
    "solana:testnet",
    "solana:devnet",
    "solana:localnet"
  ]
  readonly features: IdentifierRecord<unknown> = {
    [StandardConnect]: {
      version: "1.0.0",
      connect: this.connect.bind(this),
      disconnect: this.disconnect.bind(this)
    },
    [StandardEvents]: {
      version: "1.0.0",
      on: this.on.bind(this)
    },
    "solana:signAndSendTransaction": {
      version: "1.0.0",
      supportedTransactionVersions: ["legacy"],
      signAndSendTransaction: this.signAndSendTransaction.bind(this)
    },
    "solana:signIn": {
      version: "1.0.0",
      supportedTransactionVersions: ["legacy"],
      signIn: this.signIn.bind(this)
    },
    "solana:signTransaction": {
      version: "1.0.0",
      supportedTransactionVersions: ["legacy"],
      signTransaction: this.signAndSendTransaction.bind(this)
    },
    "solana:signMessage": {
      version: "1.0.0",
      supportedTransactionVersions: ["legacy"],
      signMessage: this.signMessage.bind(this)
    }
    // Add other features as needed
  }
  readonly icon: WalletIcon = logoString
  readonly name: string = "WalletGuise"
  readonly version: WalletVersion = "1.0.0"

  private listeners = {
    connect: new Set<(pk: PublicKey) => void>(),
    disconnect: new Set<() => void>(),
    change: new Set<() => void>()
  }

  /**
   * Low‑level request helper – uses window.postMessage to talk to the
   * bridge running in the extension’s isolated content‑script world.
   */
  private bridgeCall<T = any>(name: string, payload: any = {}): Promise<T> {
    return new Promise<T>((resolve) => {
      const id = crypto.randomUUID()
      const handler = (e: MessageEvent) => {
        if (e.data?.walletguiseResponse === id) {
          window.removeEventListener("message", handler)
          resolve(e.data.body as T)
        }
      }
      window.addEventListener("message", handler)
      window.postMessage({ walletguiseRequest: id, name, body: payload }, "*")
    })
  }

  /** Attempt to connect. If extension is locked, open the popup and
   *  wait for the user to finish unlock / onboarding. */
  async connect(input?: StandardConnectInput): Promise<StandardConnectOutput> {
    // if (this.isConnected && this.publicKey) return this.publicKey

    if (this.accounts[0]) return { accounts: this._accounts }

    debugger

    const attempt = async () =>
      this.bridgeCall<{ publicKey?: string; error?: string }>(
        "walletguise#connect"
      )

    debugger

    let { publicKey, error } = await attempt()
    if (error === "locked") {
      await this.bridgeCall("walletguise#openPopup")
      const deadline = Date.now() + 2 * 60 * 1000
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 500))
        ;({ publicKey, error } = await attempt())
        if (publicKey) break
      }
    }
    if (!publicKey) throw new Error(error ?? "Connection failed")

    this.publicKey = new PublicKey(publicKey)

    const account: WalletAccount = {
      address: publicKey,
      publicKey: this.publicKey.toBytes(),
      chains: this.chains,
      features: Object.keys(this.features).map(
        (featureKey) => featureKey as IdentifierString
      )
    }

    this._accounts.push(account)
    // this.isConnected = true
    this.emit("connect", this.publicKey)
    // return this.publicKey
    return { accounts: this._accounts }
  }

  async disconnect(): Promise<void> {
    // if (!this.isConnected) return
    await this.bridgeCall("walletguise#disconnect")
    this.publicKey = null
    // this.isConnected = false
    this.emit("disconnect", null)
  }

  on(event: "connect" | "disconnect", cb: (pk: PublicKey | null) => void) {
    this.listeners[event].add(cb as any)
  }

  async signAndSendTransaction(
    transaction: Transaction,
    options?: SendTransactionOptions
  ): Promise<{ signature: string }> {
    // if (!this.isConnected) throw new Error('Not connected');

    // Serialize transaction
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    })

    const { signature, error } = await this.bridgeCall<{
      signature: string
      error?: string
    }>("walletguise#signAndSend", {
      tx: Array.from(serializedTx),
      options
    })

    if (error) throw new Error(error)
    return { signature }
  }

  private emit(ev: "connect" | "disconnect", pk: PublicKey | null) {
    this.listeners[ev].forEach((fn: any) => fn(pk))
  }

  async signIn(input?: SolanaSignInInput): Promise<SolanaSignInOutput[]> {
    if (!this.publicKey) {
      await this.connect()
    }

    if (!this.publicKey || this._accounts.length === 0) {
      throw new Error("Not connected")
    }

    // Create the signIn message according to SIWS spec
    // This message format follows a specific pattern
    // const domain = input?.domain || window.location.host;
    const account = this._accounts[0]

    const messageBytes = this.createSignInMessage(input, account.address)
    if (!parseSignInMessage(messageBytes)) throw new Error('Malformed SIWS message');
    // const text = parseSignInMessageText(input)
    // const message = createSignInMessageText(input);

    debugger

    const { signature, error } = await this.bridgeCall(
      "walletguise#signMessage",
      {
        message: Array.from(messageBytes),
        account: account.address
      }
    )

    debugger

    if (error) throw new Error(error)

    const output = {
      account: account,
      signature: new Uint8Array(signature),
      signedMessage: messageBytes
    }

    // console.log(`is valid: ${isValid}`)

    // Return the output in the format expected by SIWS
    return [output]
  }

  async signMessage() {
    throw new Error("Not implemented")
  }

  readonly isConnected: boolean

  private createSignInMessage(
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
      ...input,
    }

    // Use official message builder
    return new TextEncoder().encode(createSignInMessageText(fullInput))
  }
}

// Inject once
function injectWalletguise() {
  const w = window as any
  if (w.walletguise) return
  w.walletguise = new WalletGuiseImpl()
  w.dispatchEvent(new Event("walletguise#initialized"))
  registerWallet(w.walletguise)
}

if (document.readyState === "complete") {
  injectWalletguise()
} else {
  window.addEventListener("load", injectWalletguise)
}
