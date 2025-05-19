import { Storage } from "@plasmohq/storage" // docs: framework/storage
import { SecureStorage } from "@plasmohq/storage/secure"

export const wgLocalSecureStore = new SecureStorage({ area: "local" })
export const wgLocalStorage = new Storage({ area: "local" })
