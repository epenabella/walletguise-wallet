import { ed25519 } from "@noble/curves/ed25519"
import { Connection, Keypair, Transaction, type Cluster } from "@solana/web3.js"
import { maybeCreateRefillIx } from "@wallet-guise/core"
import bs58 from "bs58"
import { get } from "svelte/store"

import { Storage } from "@plasmohq/storage"

import {
  createConfirmationRequest,
  initBackgroundConfirmationListeners,
  waitForRequestResolution,
  type WalletStandardConfirmationRequestType
} from "~shared/utils/confirmationManager"
import { getClientPublicKey, STORAGE_KEYS } from "~shared/utils/constants"
import { decrypt, sha256 } from "~shared/utils/crypto"
import {
  clusterStore,
  clusterUrlMapper,
  connectionStore,
  rpcUrl,
  waitForClusterInitialization
} from "~shared/utils/networkStore"
import { parseTransactionForDisplay } from "~shared/utils/transaction"
import { wgLocalSecureStore } from "~shared/utils/wgAppStore"

// RAM-only store
// const sessionSecureStorage = new SecureStorage({area: 'session'}) //sess.Storage({ area: "session" }) // survives SW restarts
const SESSION_KEY = "wg_session_wallet" // NEW
const sessionStorage = new Storage({ area: "session" })

let sessionWallet: Keypair | null = null

initBackgroundConfirmationListeners()
let popupPort: chrome.runtime.Port | null = null
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    popupPort = port

    // Listen for popup disconnection
    port.onDisconnect.addListener(() => {
      popupPort = null
    })
  }
})

function isPopupOpen(): boolean {
  return popupPort !== null
}

async function restoreSession() {
  if (sessionWallet) return

  try {
    // Get the encrypted wallet from secure storage
    const secretKeyBase58 = await sessionStorage.get<string>(SESSION_KEY)

    console.log("secretKeyBase58", secretKeyBase58)

    if (secretKeyBase58) {
      sessionWallet = Keypair.fromSecretKey(bs58.decode(secretKeyBase58))
      console.log("Session wallet restored successfully")
    } else {
      console.log("No session wallet found in storage")
    }
  } catch (error) {
    console.error("Failed to restore session wallet:", error)
    sessionWallet = null
  }
}

// Initialize on service worker start
restoreSession().catch(console.error)

// Helper: open extension popup when user initiates connect from web‑app
async function openExtensionPopup() {
  if (isPopupOpen()) return

  if (chrome.action?.openPopup) {
    // Since Chrome 108 – opens the action popup programmatically
    await chrome.action.openPopup()
  } else {
    // Fallback: open the popup.html in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup.html"),
      active: true
    })
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  ;(async () => {
    if (msg.type !== "walletguise#saveWallet") {
      await restoreSession()
    }

    switch (msg.type) {
      case "walletguise#restore": {
        // NEW
        const { secretKey } = msg // base-58 string
        sessionWallet = Keypair.fromSecretKey(bs58.decode(secretKey))
        return sendResponse({ ok: true })
      }
      case "walletguise#saveWallet": {
        // NEW
        const { password, hash, privateKey } = msg // base-58 string
        // await wgLocalSecureStore.setPassword(msg.password)
        // await wgLocalSecureStore.set(STORAGE_KEYS.HASH, hash);
        // await wgLocalSecureStore.set(STORAGE_KEYS.ENC_WALLET, privateKey);
        //
        // await chrome.storage.session.set({
        //   wg_session_wallet: privateKey
        // });
        //
        // await sessionStorage.set(SESSION_KEY, privateKey);
        sessionWallet = Keypair.fromSecretKey(bs58.decode(privateKey))
        return sendResponse({ ok: true })
      }
      case "walletguise#unlock": {
        if (
          (await sha256(msg.password)) !==
          (await wgLocalSecureStore.get<string>(STORAGE_KEYS.HASH))
        )
          return false // wrong password

        await wgLocalSecureStore.setPassword(msg.password) // prime crypto key

        const enc = await wgLocalSecureStore.get<string>(
          STORAGE_KEYS.ENC_WALLET
        )
        if (!enc) return sendResponse({ error: "no wallet" })

        sessionWallet = Keypair.fromSecretKey(await decrypt(enc, msg.password))

        // Set password for secure session storage
        // Store in secure session storage for persistence
        await sessionStorage.set(
          SESSION_KEY,
          bs58.encode(sessionWallet.secretKey)
        )

        sendResponse({ publicKey: sessionWallet.publicKey.toBase58() })
        // sendResponse({ ok: true })
        break
      }
      case "walletguise#connect": {
        // await restoreFromBlob();
        if (!sessionWallet) return sendResponse({ error: "locked" })
        sendResponse({ publicKey: sessionWallet.publicKey.toBase58() })
        break
      }
      case "walletguise#disconnect": {
        sessionWallet = null
        sendResponse({ ok: true })
        break
      }
      case "walletguise#openPopup": {
        await openExtensionPopup()
        sendResponse({ ok: true })
        break
      }
      case "walletguise#setNetworkFromWallet": {
        try {
          await chrome.storage.local.set({
            [STORAGE_KEYS.CLUSTER]: msg.cluster
          })
          sendResponse({ ok: true })
        } catch (error) {
          console.error("Message signing failed:", error)
          sendResponse({ error: error.message })
        }
        break
      }
      case "walletguise#signMessage": {
        if (!sessionWallet) return sendResponse({ error: "locked" })

        try {
          // Get the message from the request
          const messageBytes = new Uint8Array(msg.message)

          // Validate the account if provided
          if (
            msg.account &&
            msg.account !== sessionWallet.publicKey.toBase58()
          ) {
            return sendResponse({ error: "Account mismatch" })
          }

          if (msg?.specificType) {
            await userConfirmation(msg, sender, msg.specificType)
          } else {
            await userConfirmation(msg, sender, "signMessage")
          }

          // Extract only the private key portion (first 32 bytes)
          const privateKey = sessionWallet.secretKey.slice(0, 32)

          // Sign the message using ed25519 with the correct key length
          const signature = ed25519.sign(messageBytes, privateKey)

          // const signature = nacl.sign.detached(
          //   messageBytes,
          //   sessionWallet.secretKey
          // );

          // Return the signature
          sendResponse({
            signature: Array.from(signature),
            publicKey: sessionWallet.publicKey.toBase58()
          })
        } catch (error) {
          console.error("Message signing failed:", error)
          sendResponse({ error: error.message })
        }
        break
      }
      case "walletguise#signTransaction": {
        if (!sessionWallet) return sendResponse({ error: "locked" })

        try {
          const tx = Transaction.from(Buffer.from(msg.tx))

          // Validate fee payer
          if (!tx.feePayer?.equals(sessionWallet.publicKey)) {
            return sendResponse({ error: "Fee payer mismatch" })
          }

          await userConfirmation(msg, sender, "signTransaction")

          // Partially sign the transaction
          tx.partialSign(sessionWallet)

          // Serialize the signed transaction
          const signedTxBytes = tx.serialize()

          // Return the raw signed transaction as a number[]
          sendResponse({
            signedTransaction: Array.from(signedTxBytes)
          })
        } catch (error) {
          console.error("Transaction signing failed:", error)
          sendResponse({ error: error.message })
        }

        break
      }
      case "walletguise#signAndSend": {
        if (!sessionWallet) return sendResponse({ error: "locked" })

        console.log(`type of msg.tx: ${typeof msg.tx}`, msg.tx)

        try {
          const tx = Transaction.from(Buffer.from(msg.tx))

          // const tInfo = parseTransactionForDisplay(tx);

          // console.log(`background signAndSend tInfo: `, tInfo);

          // Validate fee payer
          if (!tx.feePayer?.equals(sessionWallet.publicKey)) {
            return sendResponse({ error: "Fee payer mismatch" })
          }

          // Validate recent blockhash
          if (!tx.recentBlockhash) {
            return sendResponse({ error: "Missing recent blockhash" })
          }

          console.log("tx pre partial sign: ", tx)

          // Keypair.generate() - if not found will have no rent extension

          // add refill instruction (aka tunnel instruction

          const res = await chrome.storage.local.get([STORAGE_KEYS.CLUSTER])
          const cluster: Cluster = res[STORAGE_KEYS.CLUSTER] ?? "mainnet-beta"
          const conn = new Connection(clusterUrlMapper(cluster))

          console.log(`res: ${res}, clus: ${cluster}`)

          const maybeRefillIx = await maybeCreateRefillIx(
            sessionWallet.publicKey,
            getClientPublicKey(cluster),
            conn
          )
          tx.add(maybeRefillIx)

          // Partially sign the transaction
          tx.partialSign(sessionWallet)

          const details = parseTransactionForDisplay(tx)
          console.log(`details: ${JSON.stringify(details)}`)

          await waitForClusterInitialization

          await userConfirmation(msg, sender, "signAndSend")

          console.log("transaction: ", tx)

          const serializedTx = tx.serialize()

          // Send the transaction
          const signature = await conn.sendRawTransaction(
            serializedTx,
            msg.options
          )

          // Confirm if commitment is requested
          if (msg.options?.commitment) {
            await conn.confirmTransaction(signature, msg.options.commitment)
          }

          // Return the raw signature bytes
          sendResponse({
            signature: Array.from(bs58.decode(signature))
          })
        } catch (error) {
          console.error("Transaction signing and sending failed:", error)
          sendResponse({ error: error.message })
        }
        break
      }
      case "walletguise#getBalance": {
        if (!sessionWallet) return sendResponse({ error: "locked" })
        const balanceConnection = new Connection(msg.rpcUrl, "confirmed")
        console.log("balanceConnection: ", balanceConnection.rpcEndpoint)

        const lamports = await balanceConnection.getBalance(
          sessionWallet.publicKey,
          "confirmed"
        )

        sendResponse({ lamports })
        break
      }
      case "walletguise#deleteKeys": {
        try {
          await wgLocalSecureStore.clear() // ENC_WALLET / HASH
          await sessionStorage.clear()
          await chrome.storage.local.remove([
            STORAGE_KEYS.HASH,
            STORAGE_KEYS.ENC_WALLET
          ])
          sessionWallet = null

          chrome.runtime
            .sendMessage({ type: "walletguise#disconnect" })
            .catch(() => {})

          sendResponse({ ok: true })
        } catch (err) {
          console.error("deleteKeys failed", err)
          sendResponse({ error: String(err) })
        }
        break
      }
    }
  })()
  return true
})

async function userConfirmation(
  msg,
  sender,
  type: WalletStandardConfirmationRequestType
) {
  const requestId = await createConfirmationRequest(
    type,
    { message: msg.message, account: msg.account, tx: msg.tx },
    {
      origin: sender.origin ?? "Unknown",
      tabId: sender.tab?.id,
      favicon: sender.tab?.favIconUrl
    }
  )

  await openExtensionPopup()
  await waitForRequestResolution(requestId)
}

restoreSession().catch(console.error)
