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
    <Box
      bg={bgColor}
      p={6}
      borderRadius="lg"
      boxShadow="2xl"
      w="full"
      maxW="400px"
      color="whiteAlpha.900"
      border="1px solid rgba(255, 255, 255, 0.1)"
    >
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="medium"
            htmlFor="numAdults"
            color="whiteAlpha.800"
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
            bg="whiteAlpha.100"
            color="whiteAlpha.900"
            _placeholder={{ color: "whiteAlpha.600" }}
            focusBorderColor="blue.400"
            borderRadius="md"
            border="1px solid rgba(255, 255, 255, 0.2)"
          />
        </FormControl>

        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="medium"
            htmlFor="numChildren"
            color="whiteAlpha.800"
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
            bg="whiteAlpha.100"
            color="whiteAlpha.900"
            _placeholder={{ color: "whiteAlpha.600" }}
            focusBorderColor="blue.400"
            borderRadius="md"
            border="1px solid rgba(255, 255, 255, 0.2)"
          />
        </FormControl>

        <Button
          colorScheme="green"
          onClick={handleSave}
          width="full"
          borderRadius="md"
          _hover={{ bg: "green.500" }}
        >
          Save Household Info
        </Button>
      </VStack>
    </Box>
  );
};

export default HouseholdForm;
