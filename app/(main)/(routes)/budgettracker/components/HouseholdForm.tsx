import React, { useState, useEffect } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  useColorModeValue,
  Box,
} from "@chakra-ui/react";

interface HouseholdFormProps {
  numAdults: number;
  numChildren: number;
  onSaveHousehold: (numAdults: number, numChildren: number) => Promise<void>;
}

const HouseholdForm: React.FC<HouseholdFormProps> = ({
  numAdults: initialNumAdults,
  numChildren: initialNumChildren,
  onSaveHousehold,
}) => {
  const toast = useToast();
  const [numAdults, setNumAdults] = useState<number>(initialNumAdults);
  const [numChildren, setNumChildren] = useState<number>(initialNumChildren);

  useEffect(() => {
    setNumAdults(initialNumAdults);
    setNumChildren(initialNumChildren);
  }, [initialNumAdults, initialNumChildren]);

  const handleSave = async () => {
    try {
      await onSaveHousehold(numAdults, numChildren);
      toast({
        title: "Household Information Saved",
        description:
          "The number of adults and children has been updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error Saving Data",
        description: "There was an error saving your household information.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const bgColor = useColorModeValue("#303030", "#303030");

  return (
    <Box p={6} borderRadius="lg" w="full" maxW="400px">
      <VStack spacing={5} align="stretch">
        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="medium"
            htmlFor="numAdults"
            className="text-gray-700 dark:text-gray-300"
          >
            Number of Adults
          </FormLabel>
          <Input
            id="numAdults"
            placeholder="Enter number of adults"
            type="number"
            size="md"
            value={numAdults}
            onChange={(e) => setNumAdults(Number(e.target.value))}
            className="bg-gray-50 dark:bg-[rgba(255,255,255,0.1)] text-gray-800 dark:text-white"
            _placeholder={{ color: "gray.400 dark:gray.500" }}
            focusBorderColor="blue.400"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.300 dark:border-gray-500"
            _hover={{ borderColor: "gray.400 dark:border-gray-400" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="medium"
            htmlFor="numChildren"
            className="text-gray-700 dark:text-gray-300"
          >
            Number of Children
          </FormLabel>
          <Input
            id="numChildren"
            placeholder="Enter number of children"
            type="number"
            size="md"
            value={numChildren}
            onChange={(e) => setNumChildren(Number(e.target.value))}
            className="bg-gray-50 dark:bg-[rgba(255,255,255,0.1)] text-gray-800 dark:text-white"
            _placeholder={{ color: "gray.400 dark:gray.500" }}
            focusBorderColor="blue.400"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.300 dark:border-gray-500"
            _hover={{ borderColor: "gray.400 dark:border-gray-400" }}
          />
        </FormControl>
        <Button
          bgGradient="linear(to-r, green.400, green.500)"
          color="white"
          onClick={handleSave}
          width="full"
          fontSize="lg"
          fontWeight="bold"
          py={6}
          _hover={{
            bgGradient: "linear(to-r, green.500, green.600)",
            transform: "scale(1.02)",
            boxShadow: "xl",
          }}
          _active={{
            bgGradient: "linear(to-r, green.600, green.700)",
            transform: "scale(0.98)",
          }}
          transition="transform 0.2s ease, box-shadow 0.2s ease"
          borderRadius="md"
          boxShadow="lg"
        >
          Save Household Info
        </Button>
      </VStack>
    </Box>
  );
};

export default HouseholdForm;
