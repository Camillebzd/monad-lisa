"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  SimpleGrid,
  Image,
  Text,
  Input,
  Button,
  Flex,
  Stack,
  Skeleton,
  Select,
  createListCollection,
  For,
  Portal,
} from "@chakra-ui/react";
import { NftData } from "../app/hooks/useNftCollection";
import { CollapsiblePropertyFilter } from "./CollapsiblePropertyFilter";
import { MdFilterList, MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { RarityBadge } from "./RarityBadge";
import { NftDetailModal } from "./NftDetailModal";

interface NftGalleryProps {
  isLoading: boolean;
  nfts: NftData[];
}

const sortOptions = createListCollection({
  items: [
    { label: "Token id increasing", value: "id-asc" },
    { label: "Token id decreasing", value: "id-desc" },
    { label: "Recently minted", value: "recent" },
    { label: "Rarity", value: "rarity" },
  ],
});

export const NftGallery: React.FC<NftGalleryProps> = ({ isLoading, nfts }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string[]>(["id-asc"]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<{ [trait: string]: string[] }>({});
  const [selectedNft, setSelectedNft] = useState<NftData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Extract all properties (traits) and their counts
  const properties = useMemo(() => {
    const propMap: { [trait: string]: { [value: string]: number } } = {};
    nfts.forEach(nft => {
      nft.raw?.metadata?.properties?.forEach((attr: any) => {
        if (!attr.trait_type || !attr.value) return;
        if (!propMap[attr.trait_type]) propMap[attr.trait_type] = {};
        propMap[attr.trait_type][attr.value] = (propMap[attr.trait_type][attr.value] || 0) + 1;
      });
    });
    return propMap;
  }, [nfts]);

  // Filter NFTs by search and selected traits
  const filteredNfts = useMemo(() => {
    let filtered = nfts;
    if (search) {
      filtered = filtered.filter(nft =>
        nft.name?.toLowerCase().includes(search.toLowerCase()) ||
        nft.tokenId?.toLowerCase().includes(search.toLowerCase())
      );
    }
    // Filter by selected traits
    Object.entries(selectedTraits).forEach(([trait, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(nft =>
          nft.raw?.metadata?.properties?.some((attr: any) =>
            attr.trait_type === trait && values.includes(String(attr.value))
          )
        );
      }
    });
    // Sorting
    if (sort[0] === "id-asc") {
      filtered = filtered.slice().sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId));
    } else if (sort[0] === "id-desc") {
      filtered = filtered.slice().sort((a, b) => parseInt(b.tokenId) - parseInt(a.tokenId));
    } else if (sort[0] === "recent") {
      filtered = filtered.slice().sort((a, b) => parseInt(a?.mint?.timestamp || "0") - parseInt(b?.mint?.timestamp || "0"));
    } else if (sort[0] === "rarity") {
      filtered = filtered.slice().sort((a, b) => (b.rarityScore?.score || 0) - (a.rarityScore?.score || 0));
    }
    // recently minted and rarity can be implemented as needed
    return filtered;
  }, [nfts, search, selectedTraits, sort]);

  // Handle trait filter toggle
  const toggleTrait = (trait: string, value: string) => {
    setSelectedTraits(prev => {
      const values = prev[trait] || [];
      if (values.includes(value)) {
        return { ...prev, [trait]: values.filter(v => v !== value) };
      } else {
        return { ...prev, [trait]: [...values, value] };
      }
    });
  };

  const openModal = (nft: NftData) => {
    setSelectedNft(nft);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedNft(null);
  };

  return (
    <Box w="100%">
      {/* Top Bar */}
      <Flex p={2} gap={4} mb={4} align="center" wrap="wrap" w="100%">
        <Button p={4} onClick={() => setShowFilters(!showFilters)}>
          {!showFilters ? <MdFilterList size={20} /> : <MdOutlineKeyboardArrowLeft size={20} />}
          Filters
        </Button>
        <Input
          placeholder="Search by name or id"
          value={search}
          onChange={e => setSearch(e.target.value)}
          maxW="400px"
        />
        <Select.Root
          maxW="200px"
          value={sort}
          onValueChange={details => setSort(details.value)}
          collection={sortOptions}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Sort by" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                <For each={sortOptions.items}>{(opt) => (
                  <Select.Item item={opt} key={opt.value}>
                    {opt.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                )}</For>
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Flex>
      {/* Main Content: Sidebar + NFT Grid */}
      <Flex align="flex-start" gap={6} w="100%">
        {showFilters && (
          <Box
            minW={["100%", "260px"]}
            maxW={["100%", "260px"]}
            maxH={"70vh"}
            overflowY="auto"
            bg="gray.800"
            borderRadius="lg"
            p={4}
            boxShadow="md"
            position="relative"
            zIndex={1}
          >
            <Text fontWeight="bold" fontSize="lg" mb={4}>Filter by Properties</Text>
            <Stack gap={4}>
              {Object.entries(properties).map(([trait, values]) => (
                <CollapsiblePropertyFilter
                  key={trait}
                  trait={trait}
                  values={values}
                  selectedTraits={selectedTraits}
                  toggleTrait={toggleTrait}
                />
              ))}
            </Stack>
          </Box>
        )}
        {/* NFT List */}
        <Box flex="1" minW={0}>
          <Box maxH="70vh" overflowY="auto" p={4} borderRadius="lg" boxShadow="md">
            {isLoading ? (
              <SimpleGrid minChildWidth="180px" gap={4}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <Skeleton key={i} height="250px" borderRadius="lg" />
                ))}
              </SimpleGrid>
            ) : (
              <SimpleGrid minChildWidth="180px" gap={4} justifyItems={"center"}>
                {filteredNfts.map(nft => (
                  <Box key={nft.tokenId} borderWidth="1px" borderRadius="lg" p={3} boxShadow="sm" maxWidth="240px" _hover={{ cursor: "pointer", boxShadow: "md" }} onClick={() => openModal(nft)}>
                    <Image
                      src={nft.image?.cachedUrl || nft.image?.pngUrl || nft.raw?.metadata?.image || "/placeholder.png"}
                      alt={nft.name || `NFT #${nft.tokenId}`}
                      borderRadius="md"
                      objectFit="cover"
                      w="100%"
                      h="180px"
                      mb={2}
                      defaultValue="/placeholder.png"
                    />
                    <Text fontWeight="bold">{nft.name || "Unnamed NFT"}</Text>
                    <Flex justify="space-between" align="center" mt={1}>
                      <Text fontSize="sm" color="gray.500">ID: {nft.tokenId}</Text>
                      {nft.rarityScore && <RarityBadge rarityScore={nft.rarityScore} />}
                    </Flex>
                  </Box>
                ))}
                <NftDetailModal isOpen={modalOpen} onClose={closeModal} nft={selectedNft} />
              </SimpleGrid>
            )}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};
