// import * as storage from "~shared/utils/secureStore";
import { decrypt, sha256 } from "~shared/utils/crypto"
import { secureStore, STORAGE_KEYS } from "~shared/utils/secureStore"
import { Keypair, Transaction } from "@solana/web3.js";
import bs58 from 'bs58';
import { connectionStore } from "~shared/utils/network";
import { get } from "svelte/store"
const connection = get(connectionStore);
import * as sess from "@plasmohq/storage"
// RAM-only store
const session = new sess.Storage({ area: "session" }) // survives SW restarts
const SESSION_KEY = "wg_session_wallet";      // NEW
let sessionWallet: Keypair | null = null

// async function restoreFromBlob() {
//   try {
//     const enc = await secureStore.get<string>(STORAGE_KEYS.ENC_WALLET)       // decrypt here
//     sessionWallet = enc
//       ? Keypair.fromSecretKey(bs58.decode(enc))
//       : null
//   } catch {
//     sessionWallet = null          // passwordKey wasn’t set yet
//   }
// }

async function restoreSession() {
  if (sessionWallet) return
  const raw = await session.get<string>(SESSION_KEY)
  if (raw) sessionWallet = Keypair.fromSecretKey(bs58.decode(raw))
}

export async function unlock(password: string): Promise<boolean> {
  if ((await sha256(password)) !== (await secureStore.get<string>(STORAGE_KEYS.HASH)))
    return false                                          // wrong password

  await secureStore.setPassword(password)                 // prime crypto key
  const enc = await secureStore.get<string>(STORAGE_KEYS.ENC_WALLET)   // still encrypted
  const kp  = Keypair.fromSecretKey(bs58.decode(enc))

  await session.set(SESSION_KEY, bs58.encode(kp.secretKey)) // survive reload
  return true
}

// async function getSession(): Promise<Keypair|null> {
//   const cached = await storage.get<string>(SESSION_KEY); // ← chrome.storage.session
//   return cached ? Keypair.fromSecretKey(bs58.decode(cached)) : null;
// }
//
// async function setSession(kp: Keypair|null) {
//   if (kp) await storage.set(SESSION_KEY, bs58.encode(kp.secretKey));
//   else      await storage.remove(SESSION_KEY);
// }

// Helper: open extension popup when user initiates connect from web‑app
async function openExtensionPopup() {
  if (chrome.action?.openPopup) {
    // Since Chrome 108 – opens the action popup programmatically
    await chrome.action.openPopup()
  } else {
    // Fallback: open the popup.html in a new tab
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html"), active: true })
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  ;(async () => {
    switch (msg.type) {
      case "walletguise#restore": {             // NEW
        const { secretKey } = msg               // base-58 string
        sessionWallet = Keypair.fromSecretKey(bs58.decode(secretKey))
        return sendResponse({ ok: true })
      }
      // case "walletguise#unlock": {
      //   await restoreFromBlob();
      //   const enc = await storage.get<string>(STORAGE_KEYS.ENC_WALLET)
      //   if (!enc) return sendResponse({ error: "no wallet" })
      //   sessionWallet = Keypair.fromSecretKey(await decrypt(enc, msg.password))
      //   sendResponse({ ok: true })
      //   break
      // }
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
      case "walletguise#signAndSend": {
        // await restoreFromBlob();
        if (!sessionWallet) return sendResponse({ error: "locked" })
        const tx = Transaction.from(msg.tx)
        tx.feePayer = sessionWallet.publicKey
        tx.partialSign(sessionWallet)
        const sig = await connection.sendRawTransaction(tx.serialize())
        await connection.confirmTransaction(sig, "confirmed")
        sendResponse({ signature: sig })
        break
      }
      case "walletguise#getBalance": {
        // await restoreFromBlob();
        if (!sessionWallet) return sendResponse({ error: "locked" })
        const lamports = await connection.getBalance(
          sessionWallet.publicKey,
          "confirmed"
        )
        sendResponse({ lamports })        // <— return raw lamports
        break
      }
    }
  })()
  return true
})