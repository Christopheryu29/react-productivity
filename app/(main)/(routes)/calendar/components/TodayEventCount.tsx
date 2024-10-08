// components/TodayEventCount.tsx

"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format, isSameDay, startOfDay } from "date-fns";
import { Box, Text } from "@chakra-ui/react";

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
      mt={4}
      bg="gray.700"
      p={4}
      borderRadius="lg"
      color="white"
      textAlign="center"
    >
      <Text fontSize="lg" fontWeight="bold">
        {todaysEvents.length} {todaysEvents.length === 1 ? "event" : "events"}{" "}
        today
      </Text>
    </Box>
  );
};

export default TodayEventCount;
