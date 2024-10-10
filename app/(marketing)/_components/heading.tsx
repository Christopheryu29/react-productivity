"use client";

import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";
import Link from "next/link";
import {
  Box,
  Heading as ChakraHeading,
  Text,
  Spinner,
  Button,
} from "@chakra-ui/react";

export const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <Box maxW="3xl" color="white">
      <ChakraHeading
        as="h1"
        fontSize={{ base: "3xl", sm: "5xl", md: "6xl" }}
        fontWeight="bold"
      >
        Your Ideas, Documents, & Plans. Unified. Welcome to{" "}
        <Box as="span" textDecoration="underline">
          Jotion
        </Box>
      </ChakraHeading>
      <Text
        fontSize={{ base: "base", sm: "xl", md: "2xl" }}
        fontWeight="medium"
      >
        Jotion is the connected workspace where <br />
        better, faster work happens.
      </Text>
      {isLoading && (
        <Box
          w="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="lg" />
        </Box>
      )}
      {isAuthenticated && !isLoading && (
        <Button as={Link} href="/home" rightIcon={<ArrowRight size="1em" />}>
          Enter Jotion
        </Button>
      )}
      {!isAuthenticated && !isLoading && (
        <SignInButton mode="modal">
          <Button colorScheme="teal" rightIcon={<ArrowRight size="1em" />}>
            Get Jotion free
          </Button>
        </SignInButton>
      )}
    </Box>
  );
};
