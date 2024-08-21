"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format, startOfDay, endOfDay, setHours, setMinutes } from "date-fns";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  Heading,
  Input,
  Stack,
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
} from "@chakra-ui/react";
import { SketchPicker } from "react-color";
import { ColorResult } from "react-color";

interface Event {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  userId: string;
  isAllDay: boolean;
  color?: string;
  completed: boolean;
}

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(
    new Date(selectedDate.getTime() + 3600000)
  );
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventColor, setEventColor] = useState<string>("#000000");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (!isAllDay) {
      setEndTime(new Date(selectedDate.getTime() + 3600000));
    }
  }, [selectedDate, isAllDay]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
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
  const endDate = isAllDay
    ? selectedDate
      ? format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ssXXX")
      : ""
    : endTime
    ? format(endTime, "yyyy-MM-dd'T'HH:mm:ssXXX")
    : "";

  const events = useQuery(api.events.getEventsForDateRange, {
    startDate: startDate || "",
    endDate: endDate || "",
  });

  const addEvent = useMutation(api.events.addEvent);

  const handleAddEvent = async () => {
    if (!eventTitle || !selectedDate || (!isAllDay && !endTime)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    await addEvent({
      title: eventTitle,
      userId: "your-user-id",
      startDate,
      endDate,
      description: eventDescription,
      isAllDay,
      color: eventColor,
    });

    setEventTitle("");
    setEventDescription("");
    setIsAllDay(false);
    setSelectedDate(new Date());
    setEndTime(new Date(new Date().getTime() + 3600000));
    toast({
      title: "Event added",
      description: "Your event has been successfully added.",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const ChakraDatePicker = chakra(DatePicker);

  return (
    <Box bg="gray.800" color="white" p="5">
      <VStack spacing="5">
        <Heading>Event Calendar</Heading>
        <Flex direction={{ base: "column", md: "row" }} gap="5">
          <ChakraDatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            inline
            showTimeSelect={!isAllDay}
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
          {!isAllDay && (
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
              minTime={setHours(setMinutes(new Date(selectedDate), 0), 0)}
              maxTime={setHours(setMinutes(new Date(selectedDate), 45), 23)}
            />
          )}
        </Flex>
        <FormControl>
          <Input
            placeholder="Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <Textarea
            placeholder="Description"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
          />
        </FormControl>
        <Checkbox isChecked={isAllDay} onChange={() => setIsAllDay(!isAllDay)}>
          All Day Event
        </Checkbox>
        <Button onClick={onOpen} colorScheme="blue">
          Choose Color
        </Button>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Choose Event Color</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SketchPicker
                color={eventColor}
                onChangeComplete={(color: ColorResult) =>
                  setEventColor(color.hex)
                }
              />
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr="3" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Button onClick={handleAddEvent} colorScheme="blue">
          Add Event
        </Button>
        {events && events.length > 0 ? (
          events.map((event) => (
            <Box
              key={event._id}
              bg={event.color || "#fff"}
              p="4"
              rounded="md"
              shadow="md"
            >
              <Heading size="md">{event.title}</Heading>
              {!event.isAllDay && (
                <Text>
                  Time: {format(new Date(event.startDate), "p")} -{" "}
                  {format(new Date(event.endDate), "p")}
                </Text>
              )}
              <Text>{event.description || "No description provided."}</Text>
            </Box>
          ))
        ) : (
          <Text>
            No events found for{" "}
            {selectedDate ? format(selectedDate, "PPP") : "this date"}.
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default CalendarPage;
