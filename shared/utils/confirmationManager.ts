/* eslint-disable @typescript-eslint/no-explicit-any */
import { Transaction, TransactionInstruction } from "@solana/web3.js"
import { writable } from "svelte/store"

import { Storage } from "@plasmohq/storage"

import { sleep } from "~shared/utils/misc"

// ------------------------------------------------------------------
// types
// ------------------------------------------------------------------
export type WalletStandardConfirmationRequestType =
  | "signMessage"
  | "signTransaction"
  | "signAndSend"
  | "custom"
  | "signIn" // future‑proof

export type RequestStatus = "pending" | "approved" | "rejected" | "expired"

export interface ConfirmationRequest {
  id: string
  type: WalletStandardConfirmationRequestType
  payload: any
  origin: string
  favicon?: string
  tabId?: number
  programIds?: string[]
  timestamp: number
  status: RequestStatus
  response?: any
}

type RequestMap = Record<string, ConfirmationRequest>

export const REQUESTS_KEY = "wallet_confirmation_requests"
const REQUEST_TIMEOUT = 120_000 // 2 min

// ------------------------------------------------------------------
// storage helpers (atomic)
// ------------------------------------------------------------------

const session = new Storage({ area: "session" })

async function getRequestMap(): Promise<RequestMap> {
  const result = await session.get<RequestMap>(REQUESTS_KEY)
  return result ?? {}
}

async function putRequestMap(map: RequestMap): Promise<void> {
  await session.set(REQUESTS_KEY, map)
}

// ------------------------------------------------------------------
// Svelte store (first item in the queue)
// ------------------------------------------------------------------

export const currentRequestStore = writable<ConfirmationRequest | null>(null)

function extractNextPending(map: RequestMap): ConfirmationRequest | null {
  const pending = Object.values(map)
    .filter((r) => r.status === "pending")
    .sort((a, b) => a.timestamp - b.timestamp)

  return pending[0] ?? null
}

// keep background alive while there is at least one pending request
let keepAlivePort: chrome.runtime.Port | null = null
function refreshKeepAlive(hasPending: boolean) {
  if (hasPending && !keepAlivePort) {
    keepAlivePort = chrome.runtime.connect({ name: "wallet‑keepalive" })
  } else if (!hasPending && keepAlivePort) {
    keepAlivePort.disconnect()
    keepAlivePort = null
  }
}

// ------------------------------------------------------------------
// public API
// ------------------------------------------------------------------

export async function createConfirmationRequest(
  type: WalletStandardConfirmationRequestType,
  payload: any,
  context: { origin: string; tabId?: number; favicon?: string }
): Promise<string> {
  const id = crypto.randomUUID()
  const req: ConfirmationRequest = {
    id,
    type,
    payload,
    ...context,
    programIds: extractProgramIds(payload),
    timestamp: Date.now(),
    status: "pending"
  }

  const currentMap = await getRequestMap()
  currentMap[id] = req
  await putRequestMap(currentMap)

  return id
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  response?: any
): Promise<boolean> {
  const map = await getRequestMap()
  const req = map[id]
  if (!req) return false

  map[id] = { ...req, status, response }
  await putRequestMap(map)
  return true
}

/**
 * Wait until the given request is approved OR rejected OR expired.
 * Resolves with the *final* request object, or throws on rejection / timeout.
 */
export function waitForRequestResolution(
  id: string
): Promise<ConfirmationRequest> {
  return new Promise<ConfirmationRequest>((resolve, reject) => {
    const timeoutId = setTimeout(async () => {
      await updateRequestStatus(id, "expired")
      reject(new Error("Request timed out"))
    }, REQUEST_TIMEOUT)

    function listener(
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) {
      if (area !== "session" || !changes[REQUESTS_KEY]) return

      try {
        // Get the new value from storage changes
        let newValue = changes[REQUESTS_KEY].newValue

        // Parse if it's a string (might be JSON)
        if (typeof newValue === "string") {
          try {
            newValue = JSON.parse(newValue)
          } catch (e) {
            console.error("Failed to parse storage value as JSON:", e)
            return
          }
        }

        // Ensure we have a valid object
        if (!newValue || typeof newValue !== "object") {
          console.error("Storage value is not an object:", newValue)
          return
        }

        // Access as RequestMap
        const map = newValue as RequestMap

        // Find the request by ID
        const req = map[id]
        if (!req) {
          console.log(`Request ${id} not found in map:`, Object.keys(map))
          return
        }

        if (req.status === "approved") {
          cleanup()
          resolve(req)
        } else if (req.status === "rejected" || req.status === "expired") {
          cleanup()
          reject(new Error(`Request ${req.status}`))
        }
      } catch (error) {
        console.error("Error processing storage change:", error)
      }
    }

    function cleanup() {
      clearTimeout(timeoutId)
      chrome.storage.onChanged.removeListener(listener)
    }

    chrome.storage.onChanged.addListener(listener)
  })
}

// ------------------------------------------------------------------
// popup & background init
// ------------------------------------------------------------------

export function initBackgroundConfirmationListeners(): void {
  // GC expired / completed requests once a minute
  setInterval(async () => {
    const now = Date.now()
    const map = await getRequestMap()
    let mutated = false

    for (const [id, req] of Object.entries(map)) {
      if (
        (req.status === "pending" && now - req.timestamp >= REQUEST_TIMEOUT) ||
        (req.status !== "pending" && now - req.timestamp > 86_400_000) // 24h
      ) {
        map[id] = {
          ...req,
          status: req.status === "pending" ? "expired" : req.status
        }
        mutated = true
      }
    }

    if (mutated) await putRequestMap(map)
  }, 60_000)

  // keep SW alive while pending
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "session" || !changes[REQUESTS_KEY]) return

    try {
      let newValue = changes[REQUESTS_KEY].newValue

      // Parse if it's a string
      if (typeof newValue === "string") {
        try {
          newValue = JSON.parse(newValue)
        } catch (e) {
          console.error("Failed to parse keepAlive storage value as JSON:", e)
          return
        }
      }

      if (!newValue || typeof newValue !== "object") {
        console.error("keepAlive storage value is not an object:", newValue)
        return
      }

      const map = newValue as RequestMap
      refreshKeepAlive(Object.values(map).some((r) => r.status === "pending"))
    } catch (error) {
      console.error("Error refreshing keep-alive:", error)
    }
  })
}

export function initPopupRequestConfirmationListeners(): void {
  // initial
  getRequestMap().then((map) =>
    currentRequestStore.set(extractNextPending(map))
  )

  // reactive
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "session" || !changes[REQUESTS_KEY]) return

    try {
      let newValue = changes[REQUESTS_KEY].newValue

      // Parse if it's a string
      if (typeof newValue === "string") {
        try {
          newValue = JSON.parse(newValue)
        } catch (e) {
          console.error("Failed to parse popup storage value as JSON:", e)
          return
        }
      }

      if (!newValue || typeof newValue !== "object") {
        console.error("popup storage value is not an object:", newValue)
        return
      }

      const map = newValue as RequestMap

      const next = extractNextPending(map)
      currentRequestStore.set(null)

      if (next) {
        sleep(100).then(() => currentRequestStore.set(next))
      }
    } catch (error) {
      console.error("Error updating current request store:", error)
    }
  })
}

// ------------------------------------------------------------------
// popup helpers
// ------------------------------------------------------------------

export async function approveRequest(id: string, response?: any) {
  return updateRequestStatus(id, "approved", response)
}

export async function rejectRequest(id: string) {
  return updateRequestStatus(id, "rejected")
}

// ------------------------------------------------------------------
// util
// ------------------------------------------------------------------

function extractProgramIds(payload: any): string[] | undefined {
  try {
    if (payload && "transaction" in payload) {
      const tx =
        (payload.transaction as Transaction) ?? Transaction.from(payload.tx)
      return [...new Set(tx.instructions.map((ix) => ix.programId.toBase58()))]
    } else if (payload && payload.tx) {
      try {
        const tx = Transaction.from(payload.tx)
        return [
          ...new Set(tx.instructions.map((ix) => ix.programId.toBase58()))
        ]
      } catch {
        // Ignore transaction parsing errors
      }
    }
  } catch {
    /* ignore */
  }
  return undefined
}

export async function rejectAllRequests(): Promise<number> {
  try {
    // Get all current requests
    const map = await getRequestMap()
    let rejectedCount = 0
    let mutated = false

    // Find and reject all pending requests
    for (const [id, req] of Object.entries(map)) {
      if (req.status === "pending") {
        map[id] = {
          ...req,
          status: "rejected",
          response: { error: "Rejected due to network change" }
        }
        rejectedCount++
        mutated = true
      }
    }

    // Save the updated request map if any changes were made
    if (mutated) {
      await putRequestMap(map)
    }

    // Reset the current request store
    currentRequestStore.set(null)

    console.log(
      `Rejected ${rejectedCount} pending requests due to network change`
    )
    return rejectedCount
  } catch (error) {
    console.error("Error rejecting all requests:", error)
    throw error
  }
}
