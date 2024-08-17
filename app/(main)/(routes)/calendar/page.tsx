"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format, startOfDay, endOfDay, setHours, setMinutes } from "date-fns";
import styles from "./CalendarPage.module.css";
import { SketchPicker } from "react-color";

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
  ); // Set default end time to 1 hour after the selected time
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventColor, setEventColor] = useState<string>("#000000");

  useEffect(() => {
    if (!isAllDay) {
      setEndTime(new Date(selectedDate.getTime() + 3600000)); // Adjust end time when the selected date changes
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
      alert("Please fill in all required fields.");
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
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Event Calendar</h1>
      <div className={styles.datePickers}>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          inline
          showTimeSelect={!isAllDay}
        />
        {!isAllDay && (
          <DatePicker
            selected={endTime}
            onChange={handleEndTimeChange}
            showTimeSelect
            inline
            timeInputLabel="End Time:"
            minDate={selectedDate}
            minTime={setHours(setMinutes(new Date(selectedDate), 0), 0)} // Allow selection from the start of the selected date
            maxTime={setHours(setMinutes(new Date(selectedDate), 45), 23)} // Until the end of the day
          />
        )}
      </div>
      <div className={styles.formContainer}>
        <input
          className={styles.input}
          type="text"
          placeholder="Event Title"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
        />
        <textarea
          className={styles.textarea}
          placeholder="Description"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
        />
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={() => setIsAllDay(!isAllDay)}
          />
          All Day Event
        </label>
        <SketchPicker
          color={eventColor}
          onChangeComplete={(color) => setEventColor(color.hex)}
        />
        <button className={styles.button} onClick={handleAddEvent}>
          Add Event
        </button>
      </div>
      {events && events.length > 0 ? (
        events.map((event) => (
          <div
            key={event._id}
            className={styles.eventCard}
            style={{ backgroundColor: event.color || "#fff" }}
          >
            <h3>{event.title}</h3>
            {!event.isAllDay && (
              <p>
                Time: {format(new Date(event.startDate), "p")} -{" "}
                {format(new Date(event.endDate), "p")}
              </p>
            )}
            <p>{event.description || "No description provided."}</p>
          </div>
        ))
      ) : (
        <p>
          No events found for{" "}
          {selectedDate ? format(selectedDate, "PPP") : "this date"}.
        </p>
      )}
    </div>
  );
};

export default CalendarPage;
