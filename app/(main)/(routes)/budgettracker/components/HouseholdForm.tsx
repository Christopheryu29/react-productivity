// components/HouseholdForm.tsx

import React, { useState, useEffect } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
} from "@chakra-ui/react";

interface HouseholdFormProps {
  numAdults: number;
  numChildren: number;
  onSaveHousehold: (numAdults: number, numChildren: number) => void;
}

const HouseholdForm: React.FC<HouseholdFormProps> = ({
  numAdults: initialNumAdults,
  numChildren: initialNumChildren,
  onSaveHousehold,
}) => {
  const [numAdults, setNumAdults] = useState<number>(initialNumAdults);
  const [numChildren, setNumChildren] = useState<number>(initialNumChildren);
  const toast = useToast();

  useEffect(() => {
    setNumAdults(initialNumAdults);
    setNumChildren(initialNumChildren);
  }, [initialNumAdults, initialNumChildren]);

  const handleSave = () => {
    onSaveHousehold(numAdults, numChildren);
    toast({
      title: "Household Information Saved",
      description:
        "The number of adults and children has been updated successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <VStack spacing={4}>
      <FormControl>
        <FormLabel htmlFor="numAdults">Number of Adults</FormLabel>
        <Input
          id="numAdults"
          placeholder="Number of Adults"
          type="number"
          size="sm"
          value={numAdults}
          onChange={(e) => setNumAdults(Number(e.target.value))}
        />
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="numChildren">Number of Children</FormLabel>
        <Input
          id="numChildren"
          placeholder="Number of Children"
          type="number"
          size="sm"
          value={numChildren}
          onChange={(e) => setNumChildren(Number(e.target.value))}
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleSave}>
        Save Household Info
      </Button>
    </VStack>
  );
};

export default HouseholdForm;
