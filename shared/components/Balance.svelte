<script lang="ts">
  import { sol } from "~shared/utils/balanceStore"

</script>

<div
  class="min-h-[36px] max-h-[36px] flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 text-xs">
  <span class="text-gray-500 dark:text-gray-400">Available:</span>
  {#if $sol !== null}
    <span class="font-medium text-gray-700 dark:text-gray-300">{$sol.toFixed(4)} SOL</span>
  {:else}
    <span class="font-medium text-gray-700 dark:text-gray-300">Loading ...</span>
  {/if}
</div>