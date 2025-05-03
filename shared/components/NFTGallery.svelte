<script lang="ts">
  import { onMount } from "svelte"
  import { kpStore } from "~shared/utils/kpStore"
  import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
  import { mplCore } from "@metaplex-foundation/mpl-core"
  import { publicKey } from "@metaplex-foundation/umi"
  import { fetchAsset, fetchAssetsByOwner } from "@metaplex-foundation/mpl-core"

  let nfts = []
  let isLoading = false
  let error = null

  // Initialize Umi
  const umi = createUmi("https://api.devnet.solana.com").use(mplCore())

  async function getNFTs() {
    if (!$kpStore?.publicKey) return

    try {
      isLoading = true
      error = null

      // Fetch assets using Core's modern method
      const assets = await fetchAssetsByOwner(umi, publicKey($kpStore.publicKey.toString()))

      // Fetch metadata for each asset
      nfts = await Promise.all(assets.map(async asset => {
        try {
          const digitalAsset = await fetchAsset(umi, asset.publicKey)
          const metadata = await fetch(asset.uri).then(res => res.json())

          debugger;

          return {
            name: metadata.name,
            image: metadata.image,
            collection: "Standalone", //digitalAsset.collection?.name
            address: asset.publicKey
          }
        } catch (e) {
          console.error("Error fetching asset metadata:", e)
          return null
        }
      })).then(results => results.filter(Boolean))

    } catch (err) {
      console.error("NFT fetch error:", err)
      error = err.message
    } finally {
      isLoading = false
    }
  }

  onMount(() => {
    getNFTs()
  })
</script>

<div class="p-2 flex flex-col overflow-y-hidden max-h-[344px] h-[344px]">
  <h2 class="text-lg font-semibold mb-2 dark:text-white">NFT Gallery</h2>
  <div class="rounded-lg overflow-y-scroll max-h-[308px] h-[308px]">
    {#if error}
      <div
        class="p-3 text-sm text-red-700 bg-red-100 rounded-lg"
        role="alert">
        Error loading NFTs: {error}
      </div>
    {:else if isLoading}
      <div class="grid grid-cols-2 gap-4 animate-pulse">
        {#each Array(4) as _}
          <div class="h-48 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
        {/each}
      </div>
    {:else if nfts.length === 0}
      <div class="p-4 text-center text-gray-500 dark:text-gray-400">
        No NFTs found in your wallet
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-4">
        {#each nfts as nft (nft.address)}
          <div class="relative group">
            <div class="overflow-hidden rounded-lg aspect-square bg-gray-100 dark:bg-gray-700">
              {#if nft.image}
                <img
                  src={nft.image}
                  alt={nft.name}
                  class="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  on:error={(e) => (e.currentTarget.style.display = 'none'}
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
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{nft.collection}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

</div>