import { useCallback, useEffect, useState } from "react";
// import mockData from "./test.json";

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

// Simple Ethereum address validation
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export interface NftData {
  contract: {
    address: string;
    name: string;
    symbol: string;
    totalSupply: string;
    tokenType: string;
    contractDeployer: string | null;
    deployedBlockNumber: number | null;
    openSeaMetadata: {
      floorPrice: number | null;
      collectionName: string | null;
      collectionSlug: string | null;
      safelistRequestStatus: string | null;
      imageUrl: string | null;
      description: string | null;
      externalUrl: string | null;
      twitterUsername: string | null;
      discordUrl: string | null;
      bannerImageUrl: string | null,
      lastIngestedAt: string | null;
    };
    isSpam: string | null;
    spamClassifications: string[];
  };
  tokenId: string;
  tokenType: string;
  name: string;
  description: string | null;
  image: {
    cachedUrl: string;
    thumbnailUrl: string;
    pngUrl: string;
    contentType: string;
    size: number;
    originalUrl: string;
  };
  raw: {
    tokenUri: string;
    metadata: {
      image: string;
      name: string;
      description?: string;
      properties?: Array<{
        value: string;
        trait_type: string;
      }>;
      attributes?: Array<{
        value: string;
        trait_type: string;
      }>; // it can be either 'properties' or 'attributes' -> normalize to properties
    };
    error: string | null;
  };
  collection: {
    name: string;
    slug: string;
    externalUrl: string;
    bannerImageUrl: string;
  } | null;
  mint: {
    mintAddress: string | null,
    blockNumber: string | null,
    timestamp: string | null,
    transactionHash: string | null
  } | null;
  tokenUri: string;
  timeLastUpdated: string;
  // acquiredAt: {
  //   blockTimestamp: string;
  //   blockNumber: string;
  // } | null;
  rarityScore?: {
    score: number;
    normalizedScore: number;
    rank: number;
    maxRank: number;
    percentile: number;
  } | null; // will be computed, not in the API response
}

interface UseNftCollectionResult {
  nfts: NftData[];
  isLoading: boolean;
  error: string;
  isValid: boolean;
  refetch: () => Promise<void>;
  truncatedReason: string;
}

export function computeRarityScores(nfts: NftData[]): NftData[] {
  if (!nfts.length) return nfts;

  const total = nfts.length;
  const traitValueCounts: Record<string, Record<string, number>> = {};
  const traitNumericValues: Record<string, number[]> = {};
  const traitIsNumeric: Record<string, boolean> = {};

  // First pass: collect all values and determine if numeric
  nfts.forEach(nft => {
    nft.raw?.metadata?.properties?.forEach(attr => {
      if (!attr.trait_type || attr.value == null) return;
      // Check if value is numeric
      const num = Number(attr.value);
      if (!isNaN(num) && attr.value !== "" && attr.value !== null) {
        traitIsNumeric[attr.trait_type] = true;
        if (!traitNumericValues[attr.trait_type]) traitNumericValues[attr.trait_type] = [];
        traitNumericValues[attr.trait_type].push(num);
      } else {
        traitIsNumeric[attr.trait_type] = traitIsNumeric[attr.trait_type] || false;
        if (!traitValueCounts[attr.trait_type]) traitValueCounts[attr.trait_type] = {};
        traitValueCounts[attr.trait_type][attr.value] = (traitValueCounts[attr.trait_type][attr.value] || 0) + 1;
      }
    });
  });

  // For numeric traits, sort and map to percentile
  const traitNumericPercentiles: Record<string, Record<number, number>> = {};
  Object.entries(traitNumericValues).forEach(([trait, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    traitNumericPercentiles[trait] = {};
    sorted.forEach((val, i) => {
      // Percentile: higher value = rarer (top = 100)
      traitNumericPercentiles[trait][val] = 100 * (i + 1) / sorted.length;
    });
  });

  // Compute rarity scores
  const scored = nfts.map(nft => {
    let score = 0;
    nft.raw?.metadata?.properties?.forEach(attr => {
      if (!attr.trait_type || attr.value == null) return;
      if (traitIsNumeric[attr.trait_type]) {
        // Numeric trait: use percentile as rarity (higher = rarer)
        const num = Number(attr.value);
        const percentile = traitNumericPercentiles[attr.trait_type]?.[num] || 0;
        score += percentile;
      } else {
        // Categorical trait: use frequency
        const count = traitValueCounts[attr.trait_type][attr.value] || 1;
        score += 1 / (count / total);
      }
    });
    return { ...nft, rarityScore: { score, normalizedScore: 0, rank: 0, maxRank: 0, percentile: 0 } };
  });

  // Rank NFTs by score (higher is rarer)
  scored.sort((a, b) => (b.rarityScore?.score ?? 0) - (a.rarityScore?.score ?? 0));
  scored.forEach((nft, i) => {
    nft.rarityScore = {
      ...nft.rarityScore!,
      rank: i + 1,
      maxRank: scored.length,
      percentile: 100 * (1 - i / scored.length),
    };
  });

  // Normalize scores to a 0-100 scale
  const maxScore = Math.max(...scored.map(nft => nft.rarityScore?.score ?? 0));
  scored.forEach(nft => {
    if (nft.rarityScore) {
      nft.rarityScore.normalizedScore = maxScore ? (nft.rarityScore.score / maxScore) * 100 : 0;
    }
  });

  // sort back to original order by tokenId
  scored.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId));
  return scored;
}

// Normalize NFT properties to ensure 'properties' key is used consistently
// This is necessary because some NFTs use 'attributes' while others use 'properties'
function normalizeNftProperties(nfts: NftData[]): NftData[] {
  return nfts.map(nft => {
    const metadata = nft.raw?.metadata;
    if (metadata) {
      if (Array.isArray((metadata as any).attributes)) {
        metadata.properties = (metadata as any).attributes;
      }
    }
    return nft;
  });
}

export function useNftCollection(contractAddress: string): UseNftCollectionResult {
  const [nfts, setNfts] = useState<NftData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [truncatedReason, setTruncatedReason] = useState("");

  const fetchAllNfts = useCallback(async () => {
    if (!contractAddress || !isValidAddress(contractAddress)) return;
    setIsLoading(true);
    setError("");
    setTruncatedReason("");
    try {
      let allNfts: NftData[] = [];
      let pageKey: string | null = null;
      let callCount = 0;
      let uniquenessChecked = false;
      let shouldContinue = true;
      do {
        const options = { method: 'GET' };
        let url = `https://monad-testnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForContract?contractAddress=${contractAddress}&withMetadata=true&limit=100`;
        if (pageKey) url += `&pageKey=${pageKey}`;
        const response = await fetch(url, options);
        if (!response.ok) throw new Error("Failed to fetch NFTs");
        const data = await response.json();
        data.nfts = normalizeNftProperties(data.nfts || []);
        if (!uniquenessChecked) {
          uniquenessChecked = true;
          // Check if all NFTs have a non-null 'properties' object in raw.metadata
          const allHaveProperties = (data.nfts || []).every((nft: any) => nft.raw?.metadata?.properties && Array.isArray(nft.raw.metadata.properties) && nft.raw.metadata.properties.length > 0);
          if (!allHaveProperties) {
            setNfts(data.nfts || []);
            setIsLoading(false);
            setTruncatedReason("not unique");
            return;
          }
        }
        allNfts = allNfts.concat(data.nfts || []);
        pageKey = data.pageKey || null;
        callCount++;
        if (callCount >= 30 && pageKey) {
          setTruncatedReason("too big");
          shouldContinue = false;
        }
      } while (pageKey && shouldContinue);
      allNfts = computeRarityScores(allNfts);
      setNfts(allNfts);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setIsLoading(false);
    }
  }, [contractAddress]);

  useEffect(() => {
    if (!contractAddress || !isValidAddress(contractAddress)) {
      setIsValid(false);
      setNfts([]);
      setError("");
      setTruncatedReason("");
      setIsLoading(false);
      return;
    }
    setIsValid(true);
    setIsLoading(true);
    setError("");
    fetchAllNfts();
  }, [contractAddress, fetchAllNfts]);

  return { nfts, isLoading, error, isValid, refetch: fetchAllNfts, truncatedReason };
}
