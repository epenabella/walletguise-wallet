// Core interfaces
export interface NFTResponse {
  nfts: NFTItem[]
  groups: NFTGroup[]
  solanaPrice: PriceInfo
  totalFloor: FloorInfo
  currencyTotalFloor: FloorInfo
  groupsSingles: NFTGroup[]
  errors: string[]
}

export interface NFTItem {
  id: string
  name: string
  symbol: string
  image: string | null
  externalUrl: string | null
  animationUrl: string | null
  properties: any
  description: string
  attributes: NFTAttribute[]
  listed: boolean
  tokenStandard: number
  tokenData?: TokenData
  compressed: boolean
  metaplexCore: boolean
  tree: string | null
  group: string | null
  groupSingle: string | null
  floor: FloorInfo
  currencyFloor: FloorInfo
  groupName: string
  verified: boolean
  spamScore: number
  rarity: {
    rank: number | null
    percentage: number | null
  }
}

export interface NFTAttribute {
  traitType: string
  value: string | number
}

export interface TokenData {
  pubkey: string
  uiAmount: number
  amount: string
  decimals: number
  state: string
  delegation: any | null
}

export interface NFTGroup {
  id: string
  name: string
  image: string | null
  collectionImage: string
  count: number
  listed: number
  floor: FloorInfo
  currencyFloor: FloorInfo
  totalFloor: FloorInfo
  currencyTotalFloor: FloorInfo
}

export interface FloorInfo {
  price: number | null
  change: number | null
  percentage: number | null
}

export interface PriceInfo {
  price: number
  change: number
  usdPrice: number
  usdChange: number
  currency: string
}

// Known spam collections to flag
export const SPAM_NFT_COLLECTIONS = [
  "TupFw35SwgdCby6mNKoAvFuRTY4Z1HagimDj5bbyDcJ"
  // Add more known spam collection IDs here
]
