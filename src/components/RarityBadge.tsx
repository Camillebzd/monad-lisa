"use client";

import { Badge, Text } from "@chakra-ui/react";
import { useMemo } from "react";

export interface RarityBadgeProps {
  rarityScore: {
    score: number;
    rank: number;
    maxRank: number;
    percentile: number;
  };
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarityScore }) => {
  const percentile = useMemo(() => {
    if (!rarityScore) return 0;
    const { rank, maxRank } = rarityScore;
    return Math.round((rank / maxRank) * 100);
  }, [rarityScore]);
  const rarityColor = useMemo(() => {
    if (percentile < 1) return "red"; // Top 1%
    if (percentile < 5) return "orange"; // Top 5%
    if (percentile < 10) return "yellow"; // Top 10%
    if (percentile < 20) return "blue"; // Top 20%
    if (percentile < 50) return "green"; // Top 50%

    return "gray"; // Below top 50%
  }, [percentile]);

  return (
    <Badge
      colorPalette={rarityColor}
      variant="surface"
      px={2}
      py={1}
      borderRadius="md"
      fontSize="sm"
      fontWeight="bold"
    >
      {percentile}%
    </Badge>
  );
};