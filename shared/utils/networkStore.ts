import { clusterApiUrl, Connection } from "@solana/web3.js";
import { derived, writable, type Readable } from "svelte/store";
import { fetchBalance } from "~shared/utils/balanceStore";
import { wgLocalStorage } from "~shared/utils/wgAppStore";
import { Metaplex } from "@metaplex-foundation/js"
import { nftData } from "~shared/utils/nftStore"
import { STORAGE_KEYS } from "~shared/utils/constants"
import { REQUESTS_KEY } from "~shared/utils/confirmationManager"

export type Cluster = "mainnet-beta" | "devnet" | "testnet";

export const clusterStore = writable<Cluster | undefined>()

wgLocalStorage.get(STORAGE_KEYS.CLUSTER).then((res: Cluster | undefined) => {
  clusterStore.set(res ?? "devnet")
})

clusterStore.subscribe(async (c) => {
  if (c) {
    await wgLocalStorage.set(STORAGE_KEYS.CLUSTER, c)
  }
  nftData.set(null);
})

export const rpcUrl: Readable<string | null> = derived(
  clusterStore,
  (cluster) => {

    switch (cluster) {
      case "mainnet-beta":
        return `https://mainnet.helius-rpc.com/?api-key=7172e6d9-44f0-4473-b866-cc83b9cffdbc`;
        case "devnet":
          return "https://docs-demo.solana-devnet.quiknode.pro"//"https://devnet.helius-rpc.com/?api-key=7172e6d9-44f0-4473-b866-cc83b9cffdbc";
          case "testnet":
            return clusterApiUrl(cluster)
      default:
        return null
    }
  }
)

export const connectionStore: Readable<Connection | null> = derived(
  rpcUrl,
  (rpcUrl) => rpcUrl ? new Connection(rpcUrl, "confirmed") : null
)

export const metaplexStore: Readable<Metaplex | null> = derived(
  connectionStore,
  (c) => c ? Metaplex.make(c) : null
)

connectionStore.subscribe(async (c) => {
  console.log(`connectionStore changed: ${c?.rpcEndpoint}`)

  if (c) {
    await fetchBalance();
  }
});

export const waitForClusterInitialization = new Promise<void>((resolve) => {
  const unsubscribe = clusterStore.subscribe((cluster) => {
    if (cluster) {
      unsubscribe();
      resolve();
    }
  });
});