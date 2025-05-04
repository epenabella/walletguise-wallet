import { get, writable } from "svelte/store"
import { connectionStore } from "~shared/utils/networkStore"
import type { NFTResponse } from "~shared/types/NFT.types"
import { fetchWalletNFTs } from "~features/nfts/nftService"

export const nftData = writable<NFTResponse | null>(null);

export const isLoadingNFTs = writable<boolean>(false)

export const nftError = writable<string | null>(null)


export async function loadNFTs() {
  const conn = get(connectionStore);
  if (!conn) {
    nftError.set('No connection established');
    return;
  }

  isLoadingNFTs.set(true);
  nftError.set(null);

  try {
    // Fetch NFTs
    const data = await fetchWalletNFTs();
    nftData.set(data);
  } catch (error) {
    console.error('Error loading NFTs:', error);
    nftError.set(error.message || 'Failed to load NFTs');
  } finally {
    isLoadingNFTs.set(false);
  }
}
