import { useEffect, useRef, useState } from "react";
import mockData from "./test.json";

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
      attributes?: Array<{
        value: string;
        trait_type: string;
      }>;
    };
    error: string | null;
  };
  collection: {
    name: string;
    slug: string;
    externalUrl: string;
    bannerImageUrl: string;
  } | null;
  tokenUri: string;
  timeLastUpdated: string;
  // acquiredAt: {
  //   blockTimestamp: string;
  //   blockNumber: string;
  // };
}

interface UseNftCollectionResult {
  nfts: NftData[];
  isLoading: boolean;
  error: string;
  isValid: boolean;
  refetch: () => Promise<void>;
}

export function useNftCollection(contractAddress: string): UseNftCollectionResult {
  const [nfts, setNfts] = useState<NftData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAllNfts = async () => {
    if (!contractAddress || !isValidAddress(contractAddress)) return;
    setIsLoading(true);
    setError("");
    try {
      // let allNfts: NftData[] = [];
      // let pageKey: string | null = null;
      // do {
      //   const options = { method: 'GET' };
      //   let url = `https://monad-testnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForContract?contractAddress=${contractAddress}&withMetadata=true&limit=1000`;
      //   if (pageKey) url += `&pageKey=${pageKey}`;
      //   const response = await fetch(url, options);
      //   if (!response.ok) throw new Error("Failed to fetch NFTs");
      //   const data = await response.json();
      //   allNfts = allNfts.concat(data.nfts || []);
      //   pageKey = data.pageKey || null;
      // } while (pageKey);
      // setNfts(allNfts);

      // Mock data for testing
      // Simulate network delay
      await new Promise(res => setTimeout(res, 500));
      setNfts(mockData.nfts || []);

      // console.log("Fetched NFTs:", allNfts);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!contractAddress || !isValidAddress(contractAddress)) {
      setIsValid(false);
      setNfts([]);
      setError("");
      setIsLoading(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    setIsValid(true);
    setIsLoading(true);
    setError("");
    fetchAllNfts();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [contractAddress]);

  return { nfts, isLoading, error, isValid, refetch: fetchAllNfts };
}
