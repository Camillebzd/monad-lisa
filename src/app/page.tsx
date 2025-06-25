"use client";

import { Box, Heading, Button, Text, Input, Stack, Flex, Skeleton } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useNftCollection } from "./hooks/useNftCollection";
import { NftGallery } from "../components/NftGallery";

// Chog nft = 0xb33D7138c53e516871977094B249C8f2ab89a4F4
// Purple Frens = 0xC5c9425D733b9f769593bd2814B6301916f91271

export default function Home() {
  const [contractAddress, setContractAddress] = useState("0xC5c9425D733b9f769593bd2814B6301916f91271");
  const { nfts, isLoading, error, isValid, refetch } = useNftCollection(contractAddress);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  // Extract general info from the first NFT (if available)
  const generalInfo = nfts && nfts.length > 0 ? nfts[0].contract : null;

  const generalInfoLine = (title: string, info: string | null | undefined, isInfoLoading: boolean) => {
    return (
      <Text fontWeight="bold">{title}: {isInfoLoading ? <Skeleton as="span" display="inline-block" w="80px" h="1em" /> : <Text as="span" fontWeight="normal">{info}</Text>}</Text>
    );
  }

  const handleRefresh = () => {
    refetch();
    setCooldown(30);
  };

  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setTimeout(() => setCooldown(cooldown - 1), 1000);
    } else if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
      cooldownRef.current = null;
    }
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [cooldown]);

  return (
    <Box minH="100vh" py={10} px={{ base: 2, sm: 4, md: 8, lg: 18, xl: 36 }}>
      <Stack gap="8" mx="auto">
        <Heading as="h1" size="xl" textAlign="center">
          Monad Lisa - NFT Collection Viewer
        </Heading>
        <Flex
          direction="column"
          alignContent="center"
          justifyContent="center"
          alignItems="center"
          gap={4}
          maxW="600px"
          w="100%"
          mx="auto"
          p={6}
          borderRadius="lg"
          boxShadow="md"
        >
          <Input
            w="100%"
            placeholder="Enter NFT contract address"
            value={contractAddress}
            onChange={e => setContractAddress(e.target.value)}
            size="md"
          />
          <Button
            width="max-content"
            p={4}
            onClick={handleRefresh}
            loading={isLoading}
            disabled={!isValid || cooldown > 0}
          >
            {cooldown > 0 ? `Wait ${cooldown}s` : "Refresh"}
          </Button>
          {error && <Text color="red.500">{error}</Text>}
        </Flex>
        {/* General NFT Collection Info */}
        <Box w="100%" p={6} borderRadius="lg" boxShadow="md">
          {generalInfoLine("Name", generalInfo?.name, isLoading)}
          {generalInfoLine("Symbol", generalInfo?.symbol, isLoading)}
          {generalInfoLine("Token Type", generalInfo?.tokenType, isLoading)}
          {generalInfoLine("Total Supply", generalInfo?.totalSupply, isLoading)}
        </Box>
        {/* NFT Gallery */}
        <NftGallery isLoading={isLoading} nfts={nfts} />
      </Stack>
    </Box>
  );
}
