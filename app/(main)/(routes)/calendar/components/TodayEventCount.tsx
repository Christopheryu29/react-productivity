// components/TodayEventCount.tsx

"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format, isSameDay, startOfDay } from "date-fns";
import { Box, HStack, Text } from "@chakra-ui/react";
import { CalendarIcon } from "@chakra-ui/icons";

interface Event {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  userId: string;
  color?: string;
  completed: boolean;
  recurringDay?: string;
  isAllDay: boolean;
}

interface TodayEventCountProps {
  selectedDate: Date;
}

const TodayEventCount: React.FC<TodayEventCountProps> = ({ selectedDate }) => {
  // Fetch all events from the API
  const events = useQuery(api.events.getEventsForDateRange, {
    startDate: format(
      startOfDay(new Date("2020-01-01")),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    ),
    endDate: format(
      startOfDay(new Date("2099-12-31")),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    ),
  });

  // Check if events are still loading or not fetched
  if (!events) {
    return (
      <Box
        mt={4}
        bg="gray.700"
        p={4}
        borderRadius="lg"
        color="white"
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="bold">
          Loading events...
        </Text>
      </Box>
    );
  }

  // Filter events for the selected day
  const todaysEvents = events.filter((event: Event) =>
    isSameDay(new Date(event.startDate), selectedDate)
  );

  return (
    <Box
      mt={6}
      p={6}
      borderRadius="xl"
      bgGradient="transparent"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      textAlign="center"
      color="white"
    >
      <HStack
        justifyContent="center"
        mb={4}
        spacing={{ base: 2, md: 3 }}
        align="center"
      >
        <Box
          bg="rgba(0, 191, 255, 0.1)" // Soft cyan background for icon
          p={2}
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="0px 2px 8px rgba(0, 191, 255, 0.3)" // Subtle shadow for depth
        >
          <CalendarIcon boxSize={5} color="cyan.400" />
        </Box>

        <Text
          fontSize={{ base: "lg", md: "xl" }}
          fontWeight="extrabold"
          color="cyan.400"
          textShadow="1px 1px 5px rgba(0, 191, 255, 0.4)" // Soft text shadow for glow effect
          letterSpacing="wider" // Adds a modern, spacious feel
        >
          {todaysEvents.length} {todaysEvents.length === 1 ? "Event" : "Events"}{" "}
          Today
        </Text>
      </HStack>

      <Text fontSize="md" className="text-gray-800 dark:text-gray-300">
        Stay on top of your schedule and make the most of your day!
      </Text>
    </Box>
  );
};

export default TodayEventCount;
