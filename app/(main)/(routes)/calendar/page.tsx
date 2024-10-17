"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format, startOfDay, differenceInMinutes, isSameDay } from "date-fns";
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

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(
    new Date(selectedDate.getTime())
  );
  const [endTime, setEndTime] = useState<Date>(
    new Date(selectedDate.getTime() + 3600000)
  ); // One hour later as default end time
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventColor, setEventColor] = useState<string>("#000000");
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
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
      setStartTime(new Date(date.getTime()));
      setEndTime(new Date(date.getTime() + 3600000)); // Set default end time 1 hour after selected start time
    }
  };

  const handleStartTimeChange = (time: Date | null) => {
    if (time) {
      setStartTime(time);
    }
  };

  const handleEndTimeChange = (time: Date | null) => {
    if (time) {
      setEndTime(time);
    }
  };

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

  const handleColorChangeComplete = (color: ColorResult) => {
    setEventColor(color.hex);
  };

  const ChakraDatePicker = chakra(DatePicker);

  const calculateGridRowSpan = (startDate: Date, endDate: Date) => {
    const totalMinutes = differenceInMinutes(endDate, startDate);
    return Math.max(1, Math.ceil(totalMinutes / 30)); // 30-minute intervals
  };

  const calculateRowStart = (startTime: Date) => {
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    return hours * 2 + Math.floor(minutes / 30); // 30-minute intervals
  };

  const filteredEvents = events?.flatMap((event) => {
    const currentDay = format(selectedDate, "EEEE");

    if (event.recurringDay && event.recurringDay === currentDay) {
      const startDateForDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        new Date(event.startDate).getHours(),
        new Date(event.startDate).getMinutes()
      );
      const endDateForDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        new Date(event.endDate).getHours(),
        new Date(event.endDate).getMinutes()
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

  const handleAddEvent = async () => {
    if (!eventTitle || !selectedDate || !startTime || !endTime) {
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
      startDate: format(startTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      endDate: format(endTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
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
      setStartTime(new Date());
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

  const earliestEventTime = filteredEvents?.length
    ? Math.min(
        ...filteredEvents.map((event) => new Date(event.startDate).getHours())
      )
    : 0;
  const latestEventTime = filteredEvents?.length
    ? Math.max(
        ...filteredEvents.map((event) => new Date(event.endDate).getHours())
      )
    : 24;

  const displayHours = Array.from(
    { length: latestEventTime - earliestEventTime + 1 },
    (_, i) => i + earliestEventTime
  );

  return (
    <Box
      color="white"
      p={{ base: "3", md: "5" }}
      maxW="900px"
      mx="auto"
      mt="10"
    >
      <VStack spacing={{ base: "3", md: "5" }} align="stretch">
        <Heading
          textAlign="center"
          size={{ base: "lg", md: "2xl" }}
          mb={{ base: "3", md: "5" }}
          color="teal.400"
        >
          Event Calendar
        </Heading>

        <Flex
          direction={{ base: "column", md: "row" }}
          justifyContent="center"
          align="center"
          gap="5" // Adjust the gap if needed to make the spacing better
          wrap="wrap" // Ensure it wraps properly when there's not enough space
        >
          <Box>
            <Heading size="md" textAlign="center" mb="3" color="teal.300">
              Select Date
            </Heading>
            <ChakraDatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              inline
              sx={{
                ".react-datepicker": {
                  backgroundColor: "gray.700",
                  borderRadius: "lg",
                  color: "white",
                  padding: "8px",
                },
                ".react-datepicker__header": {
                  backgroundColor: "gray.600",
                  borderBottom: "none",
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
          </Box>

          <Flex
            direction={{ base: "row", md: "row" }} // Force horizontal alignment on all screen sizes
            gap="5" // You can adjust the gap as needed for better spacing
            justifyContent="space-between" // Spread the items across the available space
            wrap="wrap" // Ensure wrapping occurs if there's not enough space
          >
            <Box
              textAlign="center"
              flex="1" // Ensure both boxes have equal width
              minW="140px" // Set a minimum width for mobile screens
            >
              <Heading size="md" mb="2" color="teal.300">
                Start Time
              </Heading>
              <ChakraDatePicker
                selected={startTime}
                onChange={handleStartTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="h:mm aa"
                inline
                sx={{
                  ".react-datepicker": {
                    backgroundColor: "gray.700",
                    color: "white",
                    borderRadius: "lg",
                  },
                  ".react-datepicker__header": {
                    backgroundColor: "gray.600",
                  },
                  ".react-datepicker__time-list-item": {
                    color: "white",
                  },
                }}
              />
            </Box>

            <Box
              textAlign="center"
              flex="1" // Ensure both boxes have equal width
              minW="140px" // Set a minimum width for mobile screens
            >
              <Heading size="md" mb="2" color="teal.300">
                End Time
              </Heading>
              <ChakraDatePicker
                selected={endTime}
                onChange={handleEndTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="h:mm aa"
                inline
                sx={{
                  ".react-datepicker": {
                    backgroundColor: "gray.700",
                    color: "white",
                    borderRadius: "lg",
                  },
                  ".react-datepicker__header": {
                    backgroundColor: "gray.600",
                  },
                  ".react-datepicker__time-list-item": {
                    color: "white",
                  },
                }}
              />
            </Box>
          </Flex>
        </Flex>

        <VStack spacing="4">
          <FormControl>
            <Input
              placeholder="Event Title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              bg="gray.700"
              color="white"
              borderRadius="md"
              _placeholder={{ color: "gray.400" }}
              padding="6"
            />
          </FormControl>
          <FormControl>
            <Textarea
              placeholder="Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              bg="gray.700"
              color="white"
              borderRadius="md"
              _placeholder={{ color: "gray.400" }}
              padding="6"
            />
          </FormControl>
          <Checkbox
            isChecked={isRecurring}
            onChange={() => setIsRecurring(!isRecurring)}
            colorScheme="teal"
          >
            Repeat Every Week
          </Checkbox>
        </VStack>

        <Button
          onClick={onOpenColorPicker}
          bg="teal.500"
          color="white"
          _hover={{ bg: "teal.400" }}
          size="lg"
          w="full"
        >
          Choose Color
        </Button>

        <Modal isOpen={isColorPickerOpen} onClose={onCloseColorPicker}>
          <ModalOverlay />
          <ModalContent bg="gray.800">
            <ModalHeader color="white">Choose Event Color</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SketchPicker
                color={eventColor}
                onChangeComplete={handleColorChangeComplete}
              />
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="teal" onClick={onCloseColorPicker}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Button
          onClick={handleAddEvent}
          bg="teal.500"
          color="white"
          _hover={{ bg: "teal.400" }}
          size="lg"
          mt="5"
          w="full"
        >
          Add Event
        </Button>

        <Heading size="lg" mt="5" textAlign="center" color="teal.400">
          Schedule for {format(selectedDate, "PPP")}
        </Heading>
        <TodayEventCount selectedDate={selectedDate} />

        <Grid
          templateRows={`repeat(${displayHours.length * 2}, 1fr)`} // Double the rows for 30-min intervals
          templateColumns="1fr"
          gap={2}
          w="100%"
          maxW="800px"
          p={{ base: 3, md: 5 }}
          borderRadius="lg"
          boxShadow="2xl"
          bg="gray.700"
          justifyContent="center"
        >
          {displayHours.map((hour) => {
            const period = hour >= 12 ? "PM" : "AM";
            const displayHour = hour % 12 === 0 ? 12 : hour % 12;

            return (
              <GridItem
                key={hour}
                rowSpan={2}
                p={3}
                borderRadius="md"
                bg="gray.600"
                color="white"
                transition="background-color 0.2s"
              >
                <Text fontWeight="bold">
                  {displayHour}:00 {period}
                </Text>
              </GridItem>
            );
          })}

          {filteredEvents &&
            filteredEvents.length > 0 &&
            filteredEvents.map((event) => {
              const startTime = new Date(event.startDate);
              const endTime = new Date(event.endDate);
              const rowStart = calculateRowStart(startTime);
              const rowSpan = calculateGridRowSpan(startTime, endTime);

              return (
                <GridItem
                  key={event._id}
                  rowStart={rowStart}
                  rowSpan={rowSpan}
                  colSpan={1}
                  justifyContent="center"
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
