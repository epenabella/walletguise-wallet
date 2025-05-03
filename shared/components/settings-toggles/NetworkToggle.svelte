<script lang="ts">
  import { Storage } from "@plasmohq/storage"
  import { onMount } from "svelte"
  const netStore = new Storage({ area: "local" })
  const NET_KEY = "solana_cluster"
  type Cluster = "mainnet-beta" | "devnet" | "testnet"
  let cluster: Cluster = "mainnet-beta"

  onMount(async () => cluster = (await netStore.get<Cluster>(NET_KEY)) ?? "mainnet-beta")

  $: (async () => {
    await netStore.set(NET_KEY, cluster)
    // tell background to rebuild its Connection
    chrome.runtime.sendMessage({ type:"walletguise#setCluster", cluster })
  })()
</script>

<label class="flex items-center gap-2 my-2">
  <span class="w-24">Network</span>
  <select bind:value={cluster} class="border rounded px-2 py-1">
    <option value="mainnet-beta">Mainnet‑beta</option>
    <option value="devnet">Devnet</option>
    <option value="testnet">Testnet</option>
  </select>
</label>