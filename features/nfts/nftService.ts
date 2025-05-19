import { publicKey } from "@metaplex-foundation/umi"
import axios from "axios"
import { get } from "svelte/store"

import {
  calculateTotalFloorValues,
  checkSpamStatus,
  createEmptyResponse,
  createErrorResponse,
  createNFTItem,
  updateCollection,
  updateScamGroup,
  updateSingle,
  updateSuspiciousGroup
} from "~features/nfts/nftServiceHelpers"
import type {
  FloorInfo,
  NFTGroup,
  NFTResponse,
  PriceInfo
} from "~shared/types/NFT.types"
import { kpStore } from "~shared/utils/kpStore"
import { metaplexStore } from "~shared/utils/networkStore"
import { solPrice } from "~shared/utils/solana"

/**
 * Fetch marketplace data
 */
async function fetchMarketplaceData(): Promise<Map<string, FloorInfo>> {
  const floorPrices = new Map<string, FloorInfo>()

  try {
    // Magic Eden API (example)
    const response = await axios.get(
      "https://api-mainnet.magiceden.dev/v2/collections/popular",
      { timeout: 10000 }
    )

    if (response.data && Array.isArray(response.data)) {
      for (const collection of response.data) {
        if (collection.symbol && collection.floorPrice) {
          floorPrices.set(collection.symbol, {
            price: collection.floorPrice / 1e9, // Convert lamports to SOL
            change: 0,
            percentage: null
          })
        }
      }
    }
  } catch (error) {
    console.error("Error fetching marketplace data:", error)
  }

  return floorPrices
}

export async function fetchWalletNFTs(): Promise<NFTResponse> {
  try {
    // Get current SOL price from your store
    const currentSolPrice = get(solPrice) || 0
    const walletAddress = get(kpStore).publicKey
    const metaplex = get(metaplexStore)

    // Create price info object
    const solPriceInfo: PriceInfo = {
      price: currentSolPrice,
      change: 0,
      usdPrice: currentSolPrice,
      usdChange: 0,
      currency: "usd"
    }

    // Initialize response object
    const response: NFTResponse = createEmptyResponse(solPriceInfo)

    // Fetch NFTs using Metaplex
    console.log("Fetching NFTs for wallet:", walletAddress)
    const nfts = await metaplex.nfts().findAllByOwner({ owner: walletAddress })
    console.log(`Found ${nfts.length} NFTs`)

    if (nfts.length === 0) {
      return response
    }

    // Fetch marketplace data for floor prices
    const marketplaceData = await fetchMarketplaceData()

    // Process NFTs and populate response
    await processNFTs(nfts, response, marketplaceData, solPriceInfo)

    // Calculate total floor values
    calculateTotalFloorValues(response, solPriceInfo)

    return response
  } catch (error) {
    console.error("Error fetching NFTs:", error)
    return createErrorResponse(error)
  }
}

/**
 * Process all NFTs and organize them into collections
 */
async function processNFTs(
  nfts: any[],
  response: NFTResponse,
  marketplaceData: Map<string, FloorInfo>,
  solPriceInfo: PriceInfo
): Promise<void> {
  // Maps to track collections and singles
  const collections = new Map<string, NFTGroup>()
  const singles = new Map<string, NFTGroup>()

  // Process each NFT
  for (const nft of nfts) {
    try {
      // Skip empty NFTs
      if (!nft.mintAddress || !nft.name) {
        continue
      }

      // Get metadata
      let metadata = {}
      if (nft.uri) {
        try {
          const metadataResponse = await axios.get(nft.uri, { timeout: 5000 })
          metadata = metadataResponse.data
        } catch (err) {
          console.warn(`Failed to fetch metadata for ${nft.name}:`, err)
        }
      }

      // Determine group type
      const collectionId = nft.collection?.address?.toString()
      const creatorId = nft.creators?.[0]?.address?.toString()

      // Check if spam/suspicious
      const spamScore = checkSpamStatus(nft, collectionId)
      const groupType =
        spamScore === 100
          ? "scam"
          : spamScore > 0
            ? "suspicious"
            : collectionId || null

      // Create NFT item
      const nftItem = createNFTItem(
        nft,
        metadata,
        groupType,
        creatorId,
        spamScore
      )

      // Add to response
      response.nfts.push(nftItem)

      // Update collections or singles
      if (groupType === "scam") {
        updateScamGroup(collections, nftItem)
      } else if (groupType === "suspicious") {
        updateSuspiciousGroup(collections, nftItem)
      } else if (collectionId) {
        updateCollection(
          collections,
          collectionId,
          nftItem,
          marketplaceData,
          solPriceInfo
        )
      } else if (creatorId) {
        updateSingle(singles, creatorId, nftItem, solPriceInfo)
      }
    } catch (error) {
      console.error(
        `Error processing NFT ${nft.mintAddress?.toString()}:`,
        error
      )
      response.errors.push(`Error processing NFT: ${error.message}`)
    }
  }

  // Convert maps to arrays and add to response
  response.groups = Array.from(collections.values())
  response.groupsSingles = Array.from(singles.values())
}
