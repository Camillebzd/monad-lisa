"use client";

import { Box, Heading, Button, Text, Input, Stack, Flex } from "@chakra-ui/react";
import { useState } from "react";
import { useNftCollection } from "./hooks/useNftCollection";
import { NftGallery } from "../components/NftGallery";

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

// Chog nft = 0xb33D7138c53e516871977094B249C8f2ab89a4F4
// Purple Frens = 0xC5c9425D733b9f769593bd2814B6301916f91271

export default function Home() {
  const [contractAddress, setContractAddress] = useState("0xC5c9425D733b9f769593bd2814B6301916f91271");
  const { nfts, isLoading, error, isValid, refetch } = useNftCollection(contractAddress);

  // Extract general info from the first NFT (if available)
  const generalInfo = nfts && nfts.length > 0 ? nfts[0].contract : null;

  return (
    <Box minH="100vh" py={10} px={{ base: 2, sm: 4, md: 8, lg: 18, xl: 36 }}>
      <Stack gap="8" mx="auto">
        <Heading as="h1" size="xl" textAlign="center">
          NFT Rarity Checker
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
            onClick={refetch}
            loading={isLoading}
            disabled={!isValid}
          >
            Refresh
          </Button>
          {error && <Text color="red.500">{error}</Text>}
        </Flex>
        {/* General NFT Collection Info */}
        {generalInfo && (
          <Box w="100%" p={6} borderRadius="lg" boxShadow="md">
            <Text fontWeight="bold">Name: <Text as="span" fontWeight="normal">{generalInfo.name}</Text></Text>
            <Text fontWeight="bold">Symbol: <Text as="span" fontWeight="normal">{generalInfo.symbol}</Text></Text>
            <Text fontWeight="bold">Token Type: <Text as="span" fontWeight="normal">{generalInfo.tokenType}</Text></Text>
            <Text fontWeight="bold">Total Supply: <Text as="span" fontWeight="normal">{generalInfo.totalSupply}</Text></Text>
          </Box>
        )}
        {/* Placeholder for NFT list and rarity results */}
        {/* <Box w="100%" p={6} borderRadius="lg" boxShadow="md">
          <Text textAlign="center">
            NFT data and rarity results will appear here.
          </Text>
        </Box> */}
        <NftGallery isLoading={isLoading} nfts={nfts} />
      </Stack>
    </Box>
  );
}
