import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = { matches: ["<all_urls>"] } // default (isolated)

// Only run in extension context where chrome.runtime is available
if (typeof chrome?.runtime?.sendMessage === "function") {
  window.addEventListener("message", (e) => {
    const { walletguiseRequest: id, name, body } = e.data ?? {}
    if (!id) return

    chrome.runtime.sendMessage({ type: name, ...body }, (resp) => {
      window.postMessage({ walletguiseResponse: id, body: resp }, "*")
    })
  })
}