<script lang="ts">
  import { onMount } from "svelte"
  import { writable } from "svelte/store"
  import { Button, Input } from "flowbite-svelte"
  import { Keypair } from "@solana/web3.js"

  const lamportsStore = writable<number | null>(null)
  const loading = writable(true)
  const ERROR_LOCKED = "locked"

  async function fetchBalance() {
    try {
      const { lamports, error } = await chrome.runtime.sendMessage({
        type: "walletguise#getBalance"
      })
      if (error === ERROR_LOCKED) {
        // User was logged out in another popup tab – force reload to Login
        console.log('LOCKED!!!!');
        location.reload()
        return
      }

      console.log('fetch balance: ' + lamports);
      // console.log('fetch balance publicKey: ' + publicKey);

      lamportsStore.set(lamports)
    } finally {
      loading.set(false)
    }
  }

  onMount(() => {
    fetchBalance()                  // initial load
    const id = setInterval(fetchBalance, 30_000)
    return () => clearInterval(id)
  })

  $: sol = $lamportsStore === null ? null : $lamportsStore / 1_000_000_000
</script>
<div class="p-4 flex flex-col gap-4 w-64">

  {#if $loading}
    <p class="text-center text-sm text-gray-400">Loading …</p>
  {:else}
    <div class="flex flex-col items-center gap-4">
      <h1 class="text-lg font-semibold">WalletGuise Balance</h1>
      {#if sol !== null}
        <p class="text-3xl font-mono">{sol.toFixed(4)} <span class="text-purple-500">◎</span></p>
      {:else}
        <p class="text-red-500 text-sm">Unable to load balance</p>
      {/if}
    </div>
  {/if}
</div>
