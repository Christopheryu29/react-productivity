import React from "react";
import { Box, Heading, CircularProgress, Text } from "@chakra-ui/react";

interface FinancialHealthHeaderProps {
  isLoading: boolean;
  model: any;
}

const FinancialHealthHeader: React.FC<FinancialHealthHeaderProps> = ({
  isLoading,
  model,
}) => (
  <Box
    p={5}
    shadow="md"
    borderWidth="1px"
    color={"white"}
    flex="1"
    borderRadius="md"
  >
    <Heading color={"white"} fontSize="xl">
      Financial Health Dashboard
    </Heading>
    {isLoading ? (
      <CircularProgress isIndeterminate color="green.300" />
    ) : (
      <Text mt={4} color={"white"}>
        {model ? "Model is ready and trained." : "Model is loading..."}
      </Text>
    )}
  </Box>
);

export default FinancialHealthHeader;
