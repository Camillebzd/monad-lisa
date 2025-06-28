import React from "react";
import ReactModal from "react-modal";
import {
  Box,
  Image,
  Text,
  Flex,
  Button
} from "@chakra-ui/react";
import { NftData } from "../app/hooks/useNftCollection";

interface NftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NftData | null;
}

export const NftDetailModal: React.FC<NftDetailModalProps> = ({ isOpen, onClose, nft }) => {
  if (!nft) return null;
  const properties = nft.raw?.metadata?.properties || (nft.raw?.metadata as any)?.attributes || [];
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel={nft.name || `NFT #${nft.tokenId}`}
      style={{
        overlay: { zIndex: 2000, background: "rgba(0,0,0,0.6)" },
        content: { maxWidth: 700, margin: "auto", borderRadius: 12, padding: 0, inset: 40, background: "rgba(0,0,0)", borderColor: "rgba(255,255,255,0.1)" }
      }}
      ariaHideApp={false}
    >
      <Box p={6}>
        <Flex justify="space-between" align="start" mb={4}>
          <Text fontSize="2xl" fontWeight="bold">{nft.name || `NFT #${nft.tokenId}`}</Text>
          <Button onClick={onClose} size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </Flex>
        <Flex direction={["column", "row"]} gap={6}>
          <Image
            src={nft.image?.cachedUrl || nft.image?.pngUrl || nft.raw?.metadata?.image || "/placeholder.png"}
            alt={nft.name || `NFT #${nft.tokenId}`}
            borderRadius="md"
            objectFit="cover"
            w="220px"
            h="220px"
            mb={[4, 0]}
          />
          <Box as="div" display="flex" flexDirection="column" gap={2} flex={1}>
            <Text><b>Token ID:</b> {nft.tokenId}</Text>
            <Text><b>Description:</b> {nft.description || nft.raw?.metadata?.description || "-"}</Text>
            <Text><b>Contract:</b> {nft.contract?.address}</Text>
            <Text><b>Collection:</b> {nft.collection?.name || nft.contract?.name}</Text>
            <Text><b>Minted at:</b> {nft.mint?.timestamp || "-"}</Text>
            {nft.rarityScore && <>
              <Text><b>Top:</b> {Math.round((nft.rarityScore.rank / nft.rarityScore.maxRank) * 100)}%</Text>
              <Text><b>Rarity rank:</b> {nft.rarityScore.rank}/{nft.rarityScore.maxRank}</Text>
              <Text><b>Rarity score:</b> {nft.rarityScore.score.toFixed(2)}</Text>
              <Text><b>Rarity percentile:</b> {nft.rarityScore.percentile.toFixed(2)}</Text>
            </>}
            <Box>
              <Text fontWeight="bold" mb={1}>Properties</Text>
              <Flex wrap="wrap" gap={2}>
                {properties.length > 0 ? properties.map((attr: any, i: number) => (
                  <Box key={i} p={2} borderWidth="1px" borderRadius="md">
                    <Text fontSize="xs">{attr.trait_type}</Text>
                    <Text fontWeight="bold">{attr.value}</Text>
                  </Box>
                )) : <Text fontSize="sm">No properties</Text>}
              </Flex>
            </Box>
          </Box>
        </Flex>
      </Box>
    </ReactModal>
  );
};
