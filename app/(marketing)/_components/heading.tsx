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
  useBreakpointValue,
  Stack,
} from "@chakra-ui/react";

export const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Use responsive font sizes based on screen size
  const headingFontSize = useBreakpointValue({
    base: "3xl",
    sm: "5xl",
    md: "6xl",
  });
  const textFontSize = useBreakpointValue({
    base: "md",
    sm: "xl",
    md: "2xl",
  });

  return (
    <Box maxW="3xl" mx="auto" textAlign="center" mt={8} p={4}>
      {/* Heading for Light Mode */}
      <ChakraHeading
        as="h1"
        fontSize={headingFontSize}
        fontWeight="bold"
        lineHeight="shorter"
        className="text-gray-800 dark:hidden" // Text for light mode
      >
        Your Finances, Tasks & Goals. Organized with{" "}
        <Box as="span" textDecoration="underline" className="text-teal-500">
          Jift
        </Box>
      </ChakraHeading>

      {/* Heading for Dark Mode */}
      <ChakraHeading
        as="h1"
        fontSize={headingFontSize}
        fontWeight="bold"
        lineHeight="shorter"
        className="hidden dark:block text-white" // Text for dark mode
      >
        Your Finances, Tasks & Goals. Organized with{" "}
        <Box as="span" textDecoration="underline" className="text-teal-500">
          Jift
        </Box>
      </ChakraHeading>

      {/* Subheading for Light Mode */}
      <Text
        fontSize={textFontSize}
        fontWeight="medium"
        mt={4}
        lineHeight="tall"
        className="text-gray-600 dark:hidden" // Text for light mode
      >
        Jift is your all-in-one tool for managing budgets, tracking tasks, and
        making smart financial decisions with AI.
      </Text>

      {/* Subheading for Dark Mode */}
      <Text
        fontSize={textFontSize}
        fontWeight="medium"
        mt={4}
        lineHeight="tall"
        className="hidden dark:block text-gray-300" // Text for dark mode
      >
        Jift is your all-in-one tool for managing budgets, tracking tasks, and
        making smart financial decisions with AI.
      </Text>

      {/* Spinner during loading */}
      {isLoading && (
        <Box
          w="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mt={6}
        >
          <Spinner size="lg" color="teal.400" />
        </Box>
      )}

      {/* Conditional Buttons based on Auth State */}
      {!isLoading && (
        <Stack
          mt={8}
          direction={{ base: "column", sm: "row" }}
          spacing={4}
          justify="center"
        >
          {isAuthenticated ? (
            <Button
              as={Link}
              href="/home"
              colorScheme="teal"
              size="lg"
              rightIcon={<ArrowRight size="1em" />}
              className="hover:bg-teal-500"
            >
              Enter Jift
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button
                colorScheme="teal"
                size="lg"
                rightIcon={<ArrowRight size="1em" />}
                className="hover:bg-teal-500"
              >
                Get Jift free
              </Button>
            </SignInButton>
          )}
        </Stack>
      )}
    </Box>
  );
};
