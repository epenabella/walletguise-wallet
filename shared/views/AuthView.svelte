<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from "svelte/store"
  import { selectedAuthTab } from "~shared/utils/navStore"
  import { fetchBalance, sol } from "~shared/utils/balanceStore"
  import QrCode from "~shared/components/QrCode.svelte"
  import Send from "~shared/components/Send.svelte"
  import Settings from "~shared/components/Settings.svelte"


  const loading = writable(true)
  // --- Lifecycle ---
  onMount(() => {
    fetchBalance(loading)                  // initial load
    const id = setInterval(() => fetchBalance(loading), 30_000)
    return () => clearInterval(id)
  });
</script>

<div style="height: 344px !important;"
  class="px-2 bg-white dark:bg-gray-900 max-h-[344px] min-h-[344px] min-w-[294px] max-w-[294px] flex flex-col">

  <div class="w-full h-full">
    {#if $selectedAuthTab === 'balance'}
      <div class="space-y-4">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">WalletGuise Balance</h1>
        {#if $loading}
          <p class="text-center text-sm text-gray-900 dark:text-white">Loading …</p>
        {:else}
          <div class="flex flex-col items-center gap-4">
            {#if sol !== null}
              <p class="text-3xl font-mono text-gray-900 dark:text-white">{$sol.toFixed(4)} <span class="text-purple-500">◎</span></p>
            {:else}
              <p class="text-red-500 text-sm">Unable to load balance</p>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    {#if $selectedAuthTab === 'send'}
      <Send />
    {/if}

    {#if $selectedAuthTab === 'receive'}
      <QrCode />
    {/if}

    {#if $selectedAuthTab === 'settings'}
      <Settings />
    {/if}

    {#if $selectedAuthTab === 'history'}
      <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Transaction history feature is under development.
      </div>
    {/if}


  </div>
</div>
