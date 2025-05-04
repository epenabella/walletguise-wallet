import { get } from "svelte/store"



import {
  type FloorInfo, type NFTAttribute,
  type NFTGroup,
  type NFTItem,
  type NFTResponse,
  type PriceInfo,
  SPAM_NFT_COLLECTIONS
} from "~shared/types/NFT.types"
import { solPrice } from "~shared/utils/solana";


/**
 * Create an NFT item from raw NFT data
 */
export function createNFTItem(
  nft: any,
  metadata: any,
  groupType: string | null,
  creatorId: string | null,
  spamScore: number
): NFTItem {
  return {
    id: nft.mintAddress.toString(),
    name: nft.name,
    symbol: nft.symbol || "",
    image: getImageUrl(nft, metadata),
    externalUrl: metadata?.external_url || metadata?.externalUrl || null,
    animationUrl: metadata?.animation_url || metadata?.animationUrl || null,
    properties: metadata?.properties || {},
    description: metadata?.description || "",
    attributes: extractAttributes(metadata),
    listed: false,
    tokenStandard: nft.tokenStandard === "NonFungible" ? 0 : 1,
    tokenData: {
      pubkey: nft.mintAddress.toString(),
      uiAmount: 1,
      amount: "1",
      decimals: 0,
      state: "initialized",
      delegation: null
    },
    compressed: !!nft.compression?.compressed,
    metaplexCore: false,
    tree: nft.compression?.tree || null,
    group: groupType,
    groupSingle: groupType ? null : creatorId,
    floor: { price: null, change: null, percentage: null },
    currencyFloor: { price: null, change: null, percentage: null },
    groupName: getGroupName(nft, spamScore),
    verified: nft.collection?.verified || false,
    spamScore: spamScore,
    rarity: { rank: null, percentage: null }
  };
}

/**
 * Get image URL from NFT or metadata
 */
export function getImageUrl(nft: any, metadata: any): string | null {
  return metadata?.image || nft.json?.image || nft.image || null;
}

/**
 * Extract attributes from metadata
 */
export function extractAttributes(metadata: any): NFTAttribute[] {
  if (!metadata?.attributes || !Array.isArray(metadata.attributes)) {
    return [];
  }

  return metadata.attributes.map(attr => ({
    traitType: attr.trait_type || attr.traitType || "unknown",
    value: attr.value
  }));
}

/**
 * Check spam status of an NFT
 * Returns 0 if not spam, 1-99 for suspicious, 100 for definite spam
 */
export function checkSpamStatus(nft: any, collectionId: string): number {
  // Check against known spam collections
  if (collectionId && SPAM_NFT_COLLECTIONS.includes(collectionId)) {
    return 100;
  }

  // Check for suspicious names/content
  const name = nft.name?.toLowerCase() || "";
  const description = nft.json?.description?.toLowerCase() || "";

  if (
    name.includes("airdrop") ||
    name.includes("claim") ||
    name.includes("free") ||
    description.includes("claim your") ||
    description.includes("connect wallet")
  ) {
    return 80; // Suspicious
  }

  // Check explicit/adult content
  if (
    name.includes("xxx") ||
    name.includes("sex") ||
    description.includes("nsfw")
  ) {
    return 50; // Suspicious but not necessarily spam
  }

  return 0;
}

/**
 * Get group name based on NFT and spam status
 */
export function getGroupName(nft: any, spamScore: number): string {
  if (spamScore === 100) {
    return "Scam NFTS";
  } else if (spamScore > 0) {
    return "Unverified NFTS";
  } else if (nft.collection?.name) {
    return nft.collection.name;
  } else {
    return nft.name;
  }
}

/**
 * Update scam group
 */
export function updateScamGroup(collections: Map<string, NFTGroup>, nft: NFTItem): void {
  if (!collections.has("scam")) {
    collections.set("scam", {
      id: "scam",
      name: "Scam NFTS",
      image: null,
      collectionImage: "",
      count: 1,
      listed: 0,
      floor: { price: null, change: null, percentage: null },
      currencyFloor: { price: null, change: null, percentage: null },
      totalFloor: { price: null, change: null, percentage: null },
      currencyTotalFloor: { price: null, change: null, percentage: null }
    });
  } else {
    const group = collections.get("scam");
    group.count++;
  }
}

/**
 * Update suspicious group
 */
export function updateSuspiciousGroup(collections: Map<string, NFTGroup>, nft: NFTItem): void {
  if (!collections.has("suspicious")) {
    collections.set("suspicious", {
      id: "suspicious",
      name: "Unverified NFTS",
      image: nft.image,
      collectionImage: "",
      count: 1,
      listed: 0,
      floor: { price: null, change: null, percentage: null },
      currencyFloor: { price: null, change: null, percentage: null },
      totalFloor: { price: null, change: null, percentage: null },
      currencyTotalFloor: { price: null, change: null, percentage: null }
    });
  } else {
    const group = collections.get("suspicious");
    group.count++;
    // Update image if current is null
    if (!group.image) {
      group.image = nft.image;
    }
  }
}

/**
 * Update collection group
 */
export function updateCollection(
  collections: Map<string, NFTGroup>,
  collectionId: string,
  nft: NFTItem,
  marketplaceData: Map<string, FloorInfo>,
  solPriceInfo: PriceInfo
): void {
  if (!collections.has(collectionId)) {
    // Create new collection entry
    const floor = marketplaceData.get(collectionId) || { price: null, change: null, percentage: null };

    // Calculate currency floor if we have a floor price
    const currencyFloor = floor.price ? {
      price: floor.price * solPriceInfo.price,
      change: floor.change ? floor.change * solPriceInfo.price : null,
      percentage: floor.percentage
    } : { price: null, change: null, percentage: null };

    collections.set(collectionId, {
      id: collectionId,
      name: nft.groupName,
      image: nft.image,
      collectionImage: nft.image || "",
      count: 1,
      listed: 0,
      floor: floor,
      currencyFloor: currencyFloor,
      totalFloor: floor.price ? {
        price: floor.price,
        change: floor.change,
        percentage: floor.percentage
      } : { price: null, change: null, percentage: null },
      currencyTotalFloor: currencyFloor
    });

    // Update NFT with floor price
    nft.floor = { ...floor };
    nft.currencyFloor = { ...currencyFloor };
  } else {
    // Update existing collection
    const collection = collections.get(collectionId);
    collection.count++;

    // Update NFT with collection floor price
    nft.floor = { ...collection.floor };
    nft.currencyFloor = { ...collection.currencyFloor };

    // Update total floor if floor price exists
    if (collection.floor.price) {
      collection.totalFloor = {
        price: collection.floor.price * collection.count,
        change: collection.floor.change ? collection.floor.change * collection.count : null,
        percentage: collection.floor.percentage
      };

      collection.currencyTotalFloor = {
        price: collection.currencyFloor.price * collection.count,
        change: collection.currencyFloor.change ? collection.currencyFloor.change * collection.count : null,
        percentage: collection.currencyFloor.percentage
      };
    }
  }
}

/**
 * Update single NFT group
 */
export function updateSingle(
  singles: Map<string, NFTGroup>,
  creatorId: string,
  nft: NFTItem,
  solPriceInfo: PriceInfo
): void {
  // For singles, use a default floor price
  const defaultFloor = 0.1; // Default floor price in SOL

  if (!singles.has(creatorId)) {
    // Create new single entry
    const floor = {
      price: defaultFloor,
      change: 0,
      percentage: null
    };

    const currencyFloor = {
      price: defaultFloor * solPriceInfo.price,
      change: 0,
      percentage: 0
    };

    singles.set(creatorId, {
      id: creatorId,
      name: nft.name,
      image: nft.image,
      collectionImage: nft.image || "",
      count: 1,
      listed: 0,
      floor: floor,
      currencyFloor: currencyFloor,
      totalFloor: { ...floor },
      currencyTotalFloor: { ...currencyFloor }
    });

    // Update NFT with floor price
    nft.floor = { ...floor };
    nft.currencyFloor = { ...currencyFloor };
  } else {
    // Update existing single
    const single = singles.get(creatorId);
    single.count++;

    // Update NFT with single floor price
    nft.floor = { ...single.floor };
    nft.currencyFloor = { ...single.currencyFloor };
  }
}

/**
 * Calculate total floor values
 */
export function calculateTotalFloorValues(response: NFTResponse, solPriceInfo: PriceInfo): void {
  let totalFloor = 0;

  // Add up all collection floor values
  for (const group of response.groups) {
    if (group.totalFloor.price) {
      totalFloor += group.totalFloor.price;
    }
  }

  // Add up all single NFT floor values
  for (const single of response.groupsSingles) {
    if (single.totalFloor.price) {
      totalFloor += single.totalFloor.price;
    }
  }

  // Update response totals
  response.totalFloor = {
    price: totalFloor,
    change: 0,
    percentage: 0
  };

  response.currencyTotalFloor = {
    price: totalFloor * solPriceInfo.price,
    change: 0,
    percentage: 0
  };
}

export function createEmptyResponse(solPriceInfo: PriceInfo): NFTResponse {
  return {
    nfts: [],
    groups: [],
    solanaPrice: solPriceInfo,
    totalFloor: { price: 0, change: 0, percentage: 0 },
    currencyTotalFloor: { price: 0, change: 0, percentage: 0 },
    groupsSingles: [],
    errors: []
  };
}

export function createErrorResponse(error: any): NFTResponse {
  return {
    nfts: [],
    groups: [],
    solanaPrice: {
      price: get(solPrice) || 0,
      change: 0,
      usdPrice: get(solPrice) || 0,
      usdChange: 0,
      currency: 'usd'
    },
    totalFloor: { price: 0, change: 0, percentage: 0 },
    currencyTotalFloor: { price: 0, change: 0, percentage: 0 },
    groupsSingles: [],
    errors: [error.message || "Unknown error fetching NFTs"]
  };
}