"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  format,
  startOfDay,
  differenceInMinutes,
  isSameDay,
  getDay,
} from "date-fns";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Grid,
  GridItem,
  Heading,
  Input,
  Text,
  Textarea,
  useToast,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  chakra,
  Checkbox,
} from "@chakra-ui/react";
import { SketchPicker, ColorResult } from "react-color";
import TodayEventCount from "./components/TodayEventCount";

interface Event {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  userId: string;
  color?: string;
  completed: boolean;
  recurringDay?: string;
  isAllDay: boolean;
}

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(
    new Date(selectedDate.getTime() + 3600000)
  );
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventColor, setEventColor] = useState<string>("#000000");
  const [isRecurring, setIsRecurring] = useState<boolean>(false); // State for recurring events
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    isOpen: isColorPickerOpen,
    onOpen: onOpenColorPicker,
    onClose: onCloseColorPicker,
  } = useDisclosure();

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setEndTime(new Date(date.getTime() + 3600000));
    }
  };

  const handleEndTimeChange = (date: Date | null) => {
    if (date) {
      setEndTime(date);
    }
  };

  const startDate = selectedDate
    ? format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ssXXX")
    : "";
  const endDate = endTime ? format(endTime, "yyyy-MM-dd'T'HH:mm:ssXXX") : "";

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

  const addEvent = useMutation(api.events.addEvent);

  const handleAddEvent = async () => {
    if (!eventTitle || !selectedDate || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const event = {
      title: eventTitle,
      userId: "your-user-id",
      startDate: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      endDate: endTime.toISOString(),
      description: eventDescription,
      color: eventColor,
      isAllDay: false,
      recurringDay: isRecurring ? format(selectedDate, "EEEE") : undefined,
    };

    try {
      await addEvent(event);
      setEventTitle("");
      setEventDescription("");
      setIsRecurring(false);
      setSelectedDate(new Date());
      setEndTime(new Date(new Date().getTime() + 3600000));
      toast({
        title: "Event added",
        description: "Your event has been successfully added.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error adding the event.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleColorChangeComplete = (color: ColorResult) => {
    setEventColor(color.hex);
  };

  const ChakraDatePicker = chakra(DatePicker);

  // Helper function to calculate the grid row span based on event duration
  const calculateGridRowSpan = (startDate: Date, endDate: Date) => {
    const totalMinutes = differenceInMinutes(endDate, startDate);
    return Math.max(1, Math.ceil(totalMinutes / 30));
  };

  const filteredEvents = events?.flatMap((event) => {
    const currentDay = format(selectedDate, "EEEE");
    const eventDay = format(new Date(event.startDate), "EEEE");

    if (event.recurringDay && event.recurringDay === currentDay) {
      const startDateForDay = new Date(
        selectedDate.setHours(
          new Date(event.startDate).getHours(),
          new Date(event.startDate).getMinutes()
        )
      );
      const endDateForDay = new Date(
        selectedDate.setHours(
          new Date(event.endDate).getHours(),
          new Date(event.endDate).getMinutes()
        )
      );

      return {
        ...event,
        startDate: startDateForDay.toISOString(),
        endDate: endDateForDay.toISOString(),
      };
    }

    if (isSameDay(new Date(event.startDate), selectedDate)) {
      return event;
    }

    return [];
  });

  return (
    <Box color="white" p="5">
      <VStack spacing="5">
        <Heading>Event Calendar</Heading>
        <Flex direction={{ base: "column", md: "row" }} gap="5">
          <ChakraDatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            inline
            showTimeSelect
            sx={{
              ".react-datepicker": {
                color: "white",
              },
              ".react-datepicker__header": {
                backgroundColor: "gray.700",
              },
              ".react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name":
                {
                  color: "white",
                },
              ".react-datepicker__current-month": {
                color: "white",
              },
            }}
          />
          <ChakraDatePicker
            selected={endTime}
            onChange={handleEndTimeChange}
            showTimeSelect
            inline
            timeInputLabel="End Time:"
            sx={{
              ".react-datepicker": {
                color: "white",
              },
              ".react-datepicker__header": {
                backgroundColor: "gray.700",
              },
              ".react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name":
                {
                  color: "white",
                },
              ".react-datepicker__current-month": {
                color: "white",
              },
            }}
            minDate={selectedDate}
          />
        </Flex>

        <FormControl>
          <Input
            placeholder="Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            bg="gray.700"
            color="white"
            _placeholder={{ color: "gray.400" }}
          />
        </FormControl>
        <FormControl>
          <Textarea
            placeholder="Description"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            bg="gray.700"
            color="white"
            _placeholder={{ color: "gray.400" }}
          />
        </FormControl>
        <Checkbox
          isChecked={isRecurring}
          onChange={() => setIsRecurring(!isRecurring)}
        >
          Repeat Every Week
        </Checkbox>
        <Button onClick={onOpenColorPicker} colorScheme="blue">
          Choose Color
        </Button>

        <Modal isOpen={isColorPickerOpen} onClose={onCloseColorPicker}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Choose Event Color</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SketchPicker
                color={eventColor}
                onChangeComplete={handleColorChangeComplete}
              />
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr="3" onClick={onCloseColorPicker}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Button onClick={handleAddEvent} colorScheme="blue" size="lg" mt="5">
          Add Event
        </Button>

        {/* Time Grid Schedule */}
        <Heading size="lg" mt="5">
          Schedule for {format(selectedDate, "PPP")}
        </Heading>
        <TodayEventCount selectedDate={selectedDate} />
        <Grid
          templateRows="repeat(48, 1fr)" // 48 rows representing 30-minute intervals
          templateColumns="1fr"
          gap={2}
          w="100%"
          maxW="800px"
          p={5}
          borderRadius="lg"
          boxShadow="2xl"
        >
          {/* Render each half-hour interval */}
          {[...Array(24)].map((_, index) => {
            const hour = index % 12 === 0 ? 12 : index % 12;
            const period = index >= 12 ? "PM" : "AM";
            return (
              <GridItem
                key={index}
                rowSpan={2}
                p={3}
                borderRadius="md"
                _hover={{ bg: "gray.700" }}
                transition="background-color 0.2s"
              >
                <Text fontWeight="bold">
                  {hour}:00 {period}
                </Text>
              </GridItem>
            );
          })}

          {/* Render events in their respective time slots */}
          {filteredEvents &&
            filteredEvents.length > 0 &&
            filteredEvents.map((event) => {
              const startTime = new Date(event.startDate);
              const endTime = new Date(event.endDate);
              const rowStart =
                startTime.getHours() * 2 +
                Math.floor(startTime.getMinutes() / 30);
              const rowSpan = calculateGridRowSpan(startTime, endTime);

              return (
                <GridItem
                  key={event._id}
                  rowStart={rowStart}
                  rowSpan={rowSpan}
                  colSpan={1}
                  bg={event.color || "#3182CE"}
                  color="white"
                  p={3}
                  borderRadius="lg"
                  shadow="lg"
                  border="1px solid"
                  borderColor="gray.500"
                  _hover={{ bg: "gray.600", transform: "scale(1.02)" }}
                  transition="background-color 0.2s, transform 0.2s"
                >
                  <Heading size="sm" mb={2}>
                    {event.title}
                  </Heading>
                  <Text>
                    {format(startTime, "p")} - {format(endTime, "p")}
                  </Text>
                  <Text mt={2}>{event.description || "No description"}</Text>
                </GridItem>
              );
            })}
        </Grid>
      </VStack>
    </Box>
  );
};

export default CalendarPage;
