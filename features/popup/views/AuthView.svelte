<script lang="ts">
  import { onMount } from 'svelte';
  import { selectedAuthTab } from "~shared/utils/navStore"
  import { fetchBalance, loadingBalance, sol } from "~shared/utils/balanceStore"
  import QrCode from "~shared/components/sub-views/QrCode.svelte"
  import Settings from "~shared/components/sub-views/Settings/Settings.svelte"
  import NFTGallery from "~shared/components/sub-views/NFTGallery.svelte"
  import Send from "~shared/components/sub-views/send/Send.svelte"
  import { balanceTimer } from "~shared/utils/balanceTimer"

  // --- Lifecycle ---
  onMount(() => {
    balanceTimer.start(fetchBalance, 30_000);
    return () => {
      balanceTimer.stop();
    }
  });
</script>

<div style="height: 344px !important;"
  class="bg-white dark:bg-gray-900 max-h-[344px] min-h-[344px] min-w-[294px] max-w-[294px] flex flex-col">

  <div class="w-full h-full">
    {#if $selectedAuthTab === 'balance'}
      <div class="p-2">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">WalletGuise Balance</h1>
        {#if $loadingBalance}
          <p class="text-center text-sm text-gray-900 dark:text-white">Loading …</p>
        {:else}
          <div class="flex flex-col items-center gap-4">
            {#if sol !== null && !$loadingBalance}
              <p class="text-3xl font-mono text-gray-900 dark:text-white">{$sol?.toFixed(4)} <span class="text-purple-500">◎</span></p>
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

    {#if $selectedAuthTab === 'nfts'}
      <NFTGallery />
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
