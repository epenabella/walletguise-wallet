import { decrypt, sha256 } from "~shared/utils/crypto"
import { wgLocalSecureStore, STORAGE_KEYS } from "~shared/utils/wgAppStore"
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js"
import bs58 from 'bs58';
import { connectionStore } from "~shared/utils/networkStore";
import { get } from "svelte/store"
import { Storage } from "@plasmohq/storage"

// RAM-only store
// const sessionSecureStorage = new SecureStorage({area: 'session'}) //sess.Storage({ area: "session" }) // survives SW restarts
const SESSION_KEY = "wg_session_wallet";      // NEW
const sessionStorage = new Storage({ area: "session" });

let sessionWallet: Keypair | null = null;

async function restoreSession() {
  if (sessionWallet) return;

  try {
    // Get the encrypted wallet from secure storage
    const secretKeyBase58 = await sessionStorage.get<string>(SESSION_KEY);

    if (secretKeyBase58) {
      sessionWallet = Keypair.fromSecretKey(bs58.decode(secretKeyBase58));
      console.log("Session wallet restored successfully");
    } else {
      console.log("No session wallet found in storage");
    }
  } catch (error) {
    console.error("Failed to restore session wallet:", error);
    sessionWallet = null;
  }
}

// Initialize on service worker start
restoreSession().catch(console.error);


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
    await restoreSession();
    switch (msg.type) {
      case "walletguise#restore": {             // NEW
        const { secretKey } = msg               // base-58 string
        sessionWallet = Keypair.fromSecretKey(bs58.decode(secretKey))
        return sendResponse({ ok: true })
      }
      case "walletguise#unlock": {
        if ((await sha256(msg.password)) !== (await wgLocalSecureStore.get<string>(STORAGE_KEYS.HASH)))
          return false                                          // wrong password

        await wgLocalSecureStore.setPassword(msg.password)                 // prime crypto key

        const enc = await wgLocalSecureStore.get<string>(STORAGE_KEYS.ENC_WALLET)
        if (!enc) return sendResponse({ error: "no wallet" })

        sessionWallet = Keypair.fromSecretKey(await decrypt(enc, msg.password));

        // Set password for secure session storage
        // Store in secure session storage for persistence
        await sessionStorage.set(SESSION_KEY, bs58.encode(sessionWallet.secretKey));


        sendResponse({ ok: true })
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
      case "walletguise#signAndSend": {
        if (!sessionWallet) return sendResponse({ error: "locked" });

        try {
          const sendSendConnection = new Connection(msg.rpcUrl, "confirmed");

          const tx = Transaction.from(Buffer.from(msg.tx));

          // 1. Validate Fee Payer
          if (!tx.feePayer?.equals(sessionWallet.publicKey)) {
            return sendResponse({ error: "Fee payer mismatch" });
          }

          // 2. Validate Recent Blockhash (prevent replay attacks)
          if (!tx.recentBlockhash) {
            return sendResponse({ error: "Missing recent blockhash" });
          }

          // 3. Partial Sign
          tx.partialSign(sessionWallet);

          // 4. Send to network
          const serializedTx = tx.serialize();
          const signature = await sendSendConnection.sendRawTransaction(
            serializedTx,
            msg.options
          );

          // 5. Confirm if requested
          if (msg.options?.preflightCommitment) {
            await sendSendConnection.confirmTransaction(
              signature,
              msg.options.preflightCommitment
            );
          }

          sendResponse({ signature });
        } catch (error) {
          console.error('Transaction failed:', error);
          sendResponse({ error: error.message });
        }
        break;
      }
      case "walletguise#getBalance": {
        if (!sessionWallet) return sendResponse({ error: "locked" })
        const balanceConnection = new Connection(msg.rpcUrl, "confirmed");
        console.log('balanceConnection: ', balanceConnection.rpcEndpoint);

        const lamports = await balanceConnection.getBalance(
          sessionWallet.publicKey,
          "confirmed"
        )

        sendResponse({ lamports })
        break
      }
    }
  })()
  return true
})

restoreSession().catch(console.error);
