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
    <Box
      color="white"
      mx="auto"
      mt="8"
      borderRadius="lg"
      bg="radial-gradient(circle at center, #202020 0%, #26282f 25%, #1f2236 50%, #202020 100%)"
      boxShadow="xl"
    >
      <VStack spacing={{ base: "4", md: "6" }} align="stretch">
        <Heading
          textAlign="center"
          size={{ base: "lg", md: "2xl" }}
          mb={{ base: "4", md: "6" }}
          color="whiteAlpha.900"
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
            <Heading size="md" textAlign="center" mb="2" color="whiteAlpha.800">
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
                color="whiteAlpha.800"
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
                color="whiteAlpha.800"
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
              bg="gray.600"
              color="white"
              borderRadius="md"
              _placeholder={{ color: "gray.400" }}
              _hover={{ bg: "gray.500" }}
              padding="6"
            />
          </FormControl>
          <FormControl>
            <Textarea
              placeholder="Description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              bg="gray.600"
              color="white"
              borderRadius="md"
              _placeholder={{ color: "gray.400" }}
              _hover={{ bg: "gray.500" }}
              padding="6"
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
            bg="gray.600"
            color="white"
            _hover={{ bg: "gray.500", boxShadow: "md" }}
            size="lg"
            w="full"
            mt="4"
            borderRadius="lg"
          >
            Choose Color
          </Button>
        </VStack>

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
              <Button colorScheme="whiteAlpha" onClick={onCloseColorPicker}>
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
            bg="gray.600"
            color="white"
            _hover={{ bg: "gray.500", boxShadow: "md" }}
            size="lg"
            mt="4"
            w="full"
            borderRadius="lg"
          >
            Add Event
          </Button>
        </VStack>

        <Heading size="lg" mt="6" textAlign="center" color="whiteAlpha.900">
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
            borderRadius="lg"
            boxShadow="2xl"
            bg="gray.800"
          >
            {displayHours.map((hour) => (
              <GridItem
                key={hour}
                rowSpan={2}
                p={4}
                borderRadius="lg"
                bg="gray.700"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="md"
                _hover={{ transform: "scale(1.02)", bg: "gray.600" }}
                transition="transform 0.2s ease-in-out, background-color 0.2s ease-in-out"
              >
                <Text fontWeight="bold" color="whiteAlpha.800">
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
                  colSpan={1}
                  bg={event.color || "#4A5568"}
                  color="white"
                  p={4}
                  borderRadius="lg"
                  boxShadow="lg"
                  _hover={{ transform: "scale(1.03)", boxShadow: "xl" }}
                  transition="transform 0.2s ease-in-out"
                >
                  <Heading size="sm" mb={1} color="whiteAlpha.900">
                    {event.title}
                  </Heading>
                  <Text color="whiteAlpha.800" fontWeight="medium">
                    {format(new Date(event.startDate), "p")} -{" "}
                    {format(new Date(event.endDate), "p")}
                  </Text>
                  <Text mt={1} fontSize="sm" color="whiteAlpha.700">
                    {event.description || "No description"}
                  </Text>
                  <IconButton
                    aria-label="Delete Event"
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    size="sm"
                    variant="ghost"
                    mt={2}
                    _hover={{ color: "red.300" }}
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
          <ModalContent bg="gray.800">
            <ModalHeader color="white">Confirm Delete</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text color="white">
                Are you sure you want to delete this event?
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="red" mr={3} onClick={handleDeleteEvent}>
                Delete
              </Button>
              <Button
                variant="ghost"
                color="white"
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
