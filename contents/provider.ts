import type { PlasmoCSConfig } from "plasmo";
import { PublicKey } from "@solana/web3.js"
import { type WalletGuiseWallet } from "~shared/types/WalletGuiseConnect.types";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN"
}

class WalletGuiseImpl implements WalletGuiseWallet {
  publicKey: PublicKey | null = null
  isConnected = false
  private listeners = {
    connect: new Set<(pk: PublicKey) => void>(),
    disconnect: new Set<() => void>()
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
  async connect(): Promise<PublicKey> {
    if (this.isConnected && this.publicKey) return this.publicKey

    const attempt = async () =>
      this.bridgeCall<{ publicKey?: string; error?: string }>("walletguise#connect")

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
    this.isConnected = true
    this.emit("connect", this.publicKey)
    return this.publicKey
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return
    await this.bridgeCall("walletguise#disconnect")
    this.publicKey = null
    this.isConnected = false
    this.emit("disconnect", null)
  }

  on(event: "connect" | "disconnect", cb: (pk: PublicKey | null) => void) {
    this.listeners[event].add(cb as any)
  }

  async signAndSendTransaction(tx: Uint8Array) {
    const { signature, error } = await this.bridgeCall<{ signature: string; error?: string }>(
      "walletguise#signAndSend",
      { tx }
    )
    if (error) throw new Error(error)
    return { signature }
  }

  private emit(ev: "connect" | "disconnect", pk: PublicKey | null) {
    this.listeners[ev].forEach((fn: any) => fn(pk))
  }
}

// Inject once
;(function () {
  const w = window as any
  if (w.walletguise) return
  w.walletguise = new WalletGuiseImpl()
  w.dispatchEvent(new Event("walletguise#initialized"))
})();