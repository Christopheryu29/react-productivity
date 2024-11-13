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
  Checkbox,
  IconButton,
} from "@chakra-ui/react";
import { SketchPicker, ColorResult } from "react-color";
import { DeleteIcon } from "@chakra-ui/icons";
import TodayEventCount from "./components/TodayEventCount";
import { Id } from "@/convex/_generated/dataModel";

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(
    new Date(selectedDate.getTime())
  );
  const [endTime, setEndTime] = useState<Date>(
    new Date(selectedDate.getTime() + 3600000)
  );
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventColor, setEventColor] = useState<string>("#000000");
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(
    null
  );
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isColorPickerOpen,
    onOpen: onOpenColorPicker,
    onClose: onCloseColorPicker,
  } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onOpenDeleteModal,
    onClose: onCloseDeleteModal,
  } = useDisclosure();

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

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setStartTime(new Date(date.getTime()));
      setEndTime(new Date(date.getTime() + 3600000)); // Default end time 1 hour after start
    }
  };

  const handleStartTimeChange = (time: Date | null) => {
    if (time) setStartTime(time);
  };

  const handleEndTimeChange = (time: Date | null) => {
    if (time) setEndTime(time);
  };

  const handleColorChangeComplete = (color: ColorResult) =>
    setEventColor(color.hex);

  const addEvent = useMutation(api.events.addEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);

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

  const handleDeleteEvent = async () => {
    if (selectedEventId) {
      try {
        await deleteEvent({ eventId: selectedEventId });
        toast({
          title: "Event deleted",
          description: "The event has been successfully deleted.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "There was an error deleting the event.",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      } finally {
        setSelectedEventId(null);
        onCloseDeleteModal();
      }
    }
  };

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

  const displayHours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Box className="mx-auto mt-8  rounded-lg shadow-xl bg-white text-gray-800  dark:bg-[radial-gradient(circle_at_center,_#202020_0%,_#26282f_25%,_#1f2236_50%,_#202020_100%)] dark:text-white">
      {" "}
      <VStack spacing={{ base: "4", md: "6" }} align="stretch">
        <Heading
          textAlign="center"
          size={{ base: "lg", md: "2xl" }}
          mb={{ base: "4", md: "6" }}
          className="text-gray-800 dark:text-white"
        >
          Event Calendar
        </Heading>

        <Flex
          direction={{ base: "column", md: "row" }}
          justifyContent="center"
          align="center"
          gap="6"
          wrap="wrap"
        >
          <Box bg="transparent" p="4" borderRadius="lg" boxShadow="md">
            <Heading
              size="md"
              textAlign="center"
              mb="2"
              className="text-gray-800 dark:text-white"
            >
              Select Date
            </Heading>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              inline
              calendarClassName="react-datepicker-custom"
            />
          </Box>

          <Flex
            direction="row"
            gap="6"
            justifyContent="space-between"
            wrap="wrap"
          >
            <Box bg="transparent" p="4" borderRadius="lg" boxShadow="md">
              <Heading
                size="md"
                textAlign="center"
                mb="2"
                className="text-gray-800 dark:text-white"
              >
                Start Time
              </Heading>
              <DatePicker
                selected={startTime}
                onChange={handleStartTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="h:mm aa"
                inline
                calendarClassName="react-datepicker-custom"
              />
            </Box>

            <Box bg="transparent" p="4" borderRadius="lg" boxShadow="md">
              <Heading
                size="md"
                textAlign="center"
                mb="2"
                className="text-gray-800 dark:text-white"
              >
                End Time
              </Heading>
              <DatePicker
                selected={endTime}
                onChange={handleEndTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="h:mm aa"
                inline
                calendarClassName="react-datepicker-custom"
              />
            </Box>
          </Flex>
        </Flex>

        <VStack
          spacing="4"
          align="stretch"
          bg="transparent"
          p="4"
          borderRadius="lg"
          boxShadow="md"
        >
          <FormControl>
            <Input
              placeholder="Event Title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md"
            />
          </FormControl>
          <FormControl>
            <Textarea
              placeholder="Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md"
            />
          </FormControl>
          <Checkbox
            isChecked={isRecurring}
            onChange={() => setIsRecurring(!isRecurring)}
            colorScheme="whiteAlpha"
          >
            Repeat Every Week
          </Checkbox>
        </VStack>
        <VStack
          spacing="4"
          align="stretch"
          bg="transparent"
          p="4"
          borderRadius="lg"
          boxShadow="md"
        >
          <Button
            onClick={onOpenColorPicker}
            className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500 shadow-md rounded-lg"
            w="full"
          >
            Choose Color
          </Button>
        </VStack>

        <Modal isOpen={isColorPickerOpen} onClose={onCloseColorPicker}>
          <ModalOverlay />
          <ModalContent className="bg-white dark:bg-gray-800">
            <ModalHeader className="text-gray-800 dark:text-white">
              Choose Event Color
            </ModalHeader>
            <ModalCloseButton className="text-gray-800 dark:text-white" />
            <ModalBody>
              <SketchPicker
                color={eventColor}
                onChangeComplete={handleColorChangeComplete}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white"
                onClick={onCloseColorPicker}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <VStack
          spacing="4"
          align="stretch"
          bg="transparent"
          p="4"
          borderRadius="lg"
          boxShadow="md"
        >
          <Button
            onClick={handleAddEvent}
            bgGradient="linear(to-r, blue.500, cyan.400)"
            color="white"
            width="full"
            fontSize="lg"
            fontWeight="bold"
            py={6}
            _hover={{
              bgGradient: "linear(to-r, blue.600, cyan.500)",
              transform: "scale(1.02)",
              boxShadow: "xl",
            }}
            _active={{
              bgGradient: "linear(to-r, blue.700, cyan.600)",
              transform: "scale(0.98)",
            }}
            transition="transform 0.2s ease, box-shadow 0.2s ease"
            borderRadius="md"
            boxShadow="lg"
          >
            Add Event
          </Button>
        </VStack>

        <Heading
          size="lg"
          mt="6"
          textAlign="center"
          className="text-gray-800 dark:text-white"
        >
          Schedule for {format(selectedDate, "PPP")}
        </Heading>
        <VStack
          spacing="4"
          align="stretch"
          bg="transparent"
          p="4"
          borderRadius="lg"
          boxShadow="md"
        >
          <TodayEventCount selectedDate={selectedDate} />
        </VStack>
        <VStack
          spacing="4"
          align="stretch"
          bg="transparent"
          p="4"
          borderRadius="lg"
          boxShadow="md"
        >
          <Grid
            templateRows={`repeat(${displayHours.length * 2}, 1fr)`}
            templateColumns="1fr"
            gap={{ base: 2, md: 3 }}
            w="100%"
            p={{ base: 4, md: 5 }}
            className="bg-gray-100 dark:bg-gray-800  rounded-lg shadow-md"
          >
            {displayHours.map((hour) => (
              <GridItem
                key={hour}
                rowSpan={2}
                p={4}
                borderRadius="lg"
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md flex items-center justify-center shadow-sm"
              >
                <Text
                  fontWeight="bold"
                  className="text-gray-800 dark:text-white"
                >
                  {hour % 12 === 0 ? 12 : hour % 12}:00{" "}
                  {hour >= 12 ? "PM" : "AM"}
                </Text>
              </GridItem>
            ))}

            {filteredEvents &&
              filteredEvents.length > 0 &&
              filteredEvents.map((event) => (
                <GridItem
                  key={event._id.toString()}
                  rowStart={calculateRowStart(new Date(event.startDate))}
                  rowSpan={calculateGridRowSpan(
                    new Date(event.startDate),
                    new Date(event.endDate)
                  )}
                  className="p-4 rounded-lg shadow-lg transform transition-transform duration-200 ease-in-out"
                  style={{
                    backgroundColor: event.color || "#4A5568",
                  }}
                >
                  <Heading size="sm" mb={1} className="text-white mb-1">
                    {event.title}
                  </Heading>
                  <Text className="text-white text-opacity-80">
                    {format(new Date(event.startDate), "p")} -{" "}
                    {format(new Date(event.endDate), "p")}
                  </Text>
                  <Text className="text-white text-opacity-60 mt-1 text-sm">
                    {event.description || "No description"}
                  </Text>
                  <IconButton
                    aria-label="Delete Event"
                    icon={<DeleteIcon />}
                    className="text-red-500 dark:text-red-300 mt-2 hover:text-red-700 dark:hover:text-red-400"
                    onClick={() => {
                      setSelectedEventId(event._id as Id<"events">);
                      onOpenDeleteModal();
                    }}
                  />
                </GridItem>
              ))}
          </Grid>
        </VStack>

        <Modal isOpen={isDeleteModalOpen} onClose={onCloseDeleteModal}>
          <ModalOverlay />
          <ModalContent className="bg-white dark:bg-gray-800">
            <ModalHeader className="text-gray-800 dark:text-white">
              Confirm Delete
            </ModalHeader>
            <ModalCloseButton className="text-gray-800 dark:text-white" />
            <ModalBody>
              <Text className="text-gray-800 dark:text-white">
                Are you sure you want to delete this event?
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                className="bg-red-500 text-white mr-3 hover:bg-red-600"
                onClick={handleDeleteEvent}
              >
                Delete
              </Button>
              <Button
                className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white"
                onClick={onCloseDeleteModal}
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default CalendarPage;
