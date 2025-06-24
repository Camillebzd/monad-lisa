"use client";

import { Box, Collapsible, Flex, Icon, Text } from "@chakra-ui/react";
import { useState } from "react";
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";

export interface CollapsiblePropertyFilterProps {
  trait: string;
  values: { [value: string]: number };
  selectedTraits: { [trait: string]: string[] };
  toggleTrait: (trait: string, value: string) => void;
}

export const CollapsiblePropertyFilter: React.FC<CollapsiblePropertyFilterProps> = ({ trait, values, selectedTraits, toggleTrait }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible.Root key={trait} onOpenChange={() => { setIsOpen(!isOpen); }}>
      <Collapsible.Trigger paddingY="1" w="100%">
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold">{trait} </Text>
          <Flex align="center">
            <Text fontWeight="bold">{Object.keys(values).length}</Text>
            {isOpen ? (
              <Icon size="lg">
                <MdOutlineKeyboardArrowDown />
              </Icon>
            ) : (
              <Icon size="lg">
                <MdOutlineKeyboardArrowUp />
              </Icon>
            )}
          </Flex>
        </Flex>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Flex wrap="wrap" gap={1} direction="column" justifyContent="center">
          {Object.entries(values).map(([value, count]) => {
            const checked = selectedTraits[trait]?.includes(value) ? true : false;
            return (
              <Flex key={value} align="center" justify={"space-between"}>
                <Box>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTrait(trait, value)}
                    style={{ marginRight: 8 }}
                  />
                  <Text as="span" mr={2}>{value}</Text>
                </Box>
                <Text as="span" color="gray.400">({count})</Text>
              </Flex>
            );
          })}
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
