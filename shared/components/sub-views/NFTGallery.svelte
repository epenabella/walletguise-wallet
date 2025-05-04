<script lang="ts">
  import { onMount } from "svelte"
  import { isLoadingNFTs, loadNFTs, nftData, nftError } from "~shared/utils/nftStore"

  onMount(() => {
    loadNFTs();
  })

  function handleNftError(e) {
      if (e && e.currentTarget && e.currentTarget.style) {
        e.currentTarget.style.display = 'none'
      }
  }
</script>

<div class="pt-2 ps-2 flex flex-col overflow-y-hidden max-h-[344px] h-[344px]">
  <h2 class="text-lg font-semibold mb-2 dark:text-white">NFT Gallery</h2>
      {#if $nftError}
        <div
          class="p-3 text-sm text-red-700 bg-red-100 rounded-lg"
          role="alert">
          Error loading NFTs: {nftError}
        </div>
      {:else if $isLoadingNFTs}
        <div class="grid grid-cols-2 gap-4 animate-pulse pr-[17px]">
          {#each Array(4) as _}
            <div style="width: 121.5px;" class="h-40 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
          {/each}
        </div>
      {:else if !$nftData?.nfts || $nftData.nfts.length === 0}
        <div class="p-4 text-center text-gray-500 dark:text-gray-400">
          No NFTs found in your wallet
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-4 overflow-y-scroll pr-[17px]">
          {#each $nftData.nfts as nft (nft)}
            <div class="relative group">
              <div class="overflow-hidden rounded-lg aspect-square bg-gray-100 dark:bg-gray-700">
                {#if nft.image}
                  <img
                    src={nft.image}
                    alt={nft.name}
                    class="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    on:error={handleNftError}
                  />
                {:else}
                  <div class="flex items-center justify-center w-full h-full text-gray-400">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                {/if}
              </div>

              <div class="mt-2">
                <h3 class="text-sm font-medium truncate dark:text-gray-200">{nft.name}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{nft.groupName}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
</div>