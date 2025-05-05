import type {
  SolanaSignAndSendTransactionInput,
  SolanaSignAndSendTransactionOutput,
  SolanaSignMessageInput,
  SolanaSignMessageOutput,
  SolanaSignTransactionInput,
  SolanaSignTransactionOutput
} from "@solana/wallet-standard-features"
import { PublicKey, type Transaction } from "@solana/web3.js"
import type { PlasmoCSConfig } from "plasmo"
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
  type SendTransactionOptions,
  type SolanaSignInInput,
  type SolanaSignInInputWithRequiredFields,
  type SolanaSignInOutput,
  type WalletGuiseFeatures,
  type WalletGuiseWallet
} from "~shared/types/WalletGuiseConnect.types"
import { createSignInMessage, parseSignInMessage } from "~shared/utils/crypto"
import { openPopup } from "~shared/utils/backgroundHelper"

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
      signTransaction: this.signTransaction.bind(this)
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
    if (this.accounts[0]) return { accounts: this._accounts }

    const attempt = async () =>
      this.bridgeCall<{ publicKey?: string; error?: string }>(
        "walletguise#connect"
      )

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
    this._accounts.length = 0
    // this.isConnected = false
    this.emit("disconnect", null)
  }

  on(event: "connect" | "disconnect", cb: (pk: PublicKey | null) => void) {
    this.listeners[event].add(cb as any)
  }

  async signAndSendTransaction(
    ...inputs: SolanaSignAndSendTransactionInput[]
  ): Promise<readonly SolanaSignAndSendTransactionOutput[]> {
    await this.ensureConnected()

    const outputs = inputs.map(
      async ({ account, transaction, chain, options }) => {
        // Validate that the account is active
        if (account.address !== this._accounts[0].address)
          throw new Error("Account mismatch")

        // Delegate to background script
        const { signature, error } = await this.bridgeCall<{
          signature?: number[]
          error?: string
        }>("walletguise#signAndSend", {
          tx: Array.from(transaction),
          account: account.address,
          options
        })

        if (error) throw new Error(error)

        return {
          signature: new Uint8Array(signature!)
        } as SolanaSignAndSendTransactionOutput
      }
    )

    return Promise.all(outputs)
  }

  private emit(ev: "connect" | "disconnect", pk: PublicKey | null) {
    this.listeners[ev].forEach((fn: any) => fn(pk))
  }

  async signIn(input?: SolanaSignInInput): Promise<SolanaSignInOutput[]> {
    await this.ensureConnected()

    const account = this._accounts[0]

    // Create the signIn message according to SIWS spec
    const messageBytes = createSignInMessage(input, account.address)
    if (!parseSignInMessage(messageBytes))
      throw new Error("Malformed SIWS message")

    await this.connect();

    const { signature, error } = await this.bridgeCall(
      "walletguise#signMessage",
      {
        message: Array.from(messageBytes),
        account: account.address
      }
    )

    if (error) throw new Error(error)

    const output = {
      account: account,
      signature: new Uint8Array(signature),
      signedMessage: messageBytes
    }

    return [output]
  }

  async signTransaction(
    ...inputs: SolanaSignTransactionInput[]
  ): Promise<readonly SolanaSignTransactionOutput[]> {
    await this.ensureConnected()

    const outputs = inputs.map(async ({ account, transaction }) => {
      // Validate that the account is active
      if (account.address !== this._accounts[0].address)
        throw new Error("Account mismatch")

      const { signedTransaction, error } = await this.bridgeCall<{
        signedTransaction?: number[]
        error?: string
      }>("walletguise#signTransaction", {
        tx: Array.from(transaction),
        account: account.address
      })

      if (error) throw new Error(error)

      return {
        signedTransaction: new Uint8Array(signedTransaction!)
      }
    })

    return await Promise.all(outputs)
  }

  async signMessage(
    ...inputs: SolanaSignMessageInput[]
  ): Promise<readonly SolanaSignMessageOutput[]> {
    await this.ensureConnected()

    const active = this._accounts[0]
    const outputs = inputs.map(async ({ account = active, message }) => {
      // ---- basic safety checks -------------------------------------------
      if (account.address !== active.address)
        throw new Error("Account mismatch")
      if (!account.features.includes("solana:signMessage"))
        throw new Error("Wallet does not support solana:signMessage")
      if (!(message instanceof Uint8Array))
        throw new Error("`message` must be a Uint8Array")
      if (message.length === 0) throw new Error("Message may not be empty")

      // ---- delegate to the background signer -----------------------------
      const { signature, error } = await this.bridgeCall<{
        signature?: number[]
        error?: string
      }>("walletguise#signMessage", {
        message: Array.from(message), // structured‑clone friendly
        account: account.address
      })

      if (error) throw new Error(error)

      return {
        signedMessage: message,
        signature: new Uint8Array(signature!)
      }
    })

    return await Promise.all(outputs)
  }

  private async ensureConnected() {
    if (!this.publicKey) {
      await this.connect()
    }

    if (!this.publicKey || this._accounts.length === 0) {
      throw new Error("Not connected")
    }
  }

  readonly isConnected: boolean
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
