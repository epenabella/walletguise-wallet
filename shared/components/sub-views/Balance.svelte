<script lang="ts">
  import { fetchBalance, loadingBalance, sol } from "~shared/utils/balanceStore"
  import { solPrice } from "~shared/utils/solana"
  import RefreshIcon from "~shared/components/icons/RefreshIcon.svelte"

</script>



<div
  class="min-h-[36px] max-h-[36px] flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 text-xs">
  <div class="inline-block">
    <span class="text-gray-500 dark:text-gray-400">Available:</span>
    {#if $sol === null || $loadingBalance}
      <button on:click={() => fetchBalance()} class="max-h-[16px] translate-y-[3px] cursor-pointer">
        <RefreshIcon height={16} width={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    {/if}
  </div>

  {#if $sol !== null && !$loadingBalance}
    <div class="inline-block">
      <span class="font-medium text-gray-700 dark:text-gray-300">{$sol?.toFixed(4)} SOL</span>
      <span class="text-xs font-medium text-gray-500">( ${($sol * $solPrice)?.toFixed(2)} )</span>
      <button on:click={() => fetchBalance()} class="max-h-[16px] translate-y-[3px] cursor-pointer">
        <RefreshIcon height={16} width={16} className="text-gray-500 dark:text-gray-400"/>
      </button>
    </div>
  {:else}
    <span class="font-medium text-gray-700 dark:text-gray-300">Loading ...</span>
  {/if}
</div>