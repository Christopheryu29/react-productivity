import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import styles from "./PomodoroTimer.module.css"; // Import the CSS module

export const PomodoroTimer = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [workDuration, setWorkDuration] = useState(25); // Work duration in minutes
  const [breakDuration, setBreakDuration] = useState(5); // Break duration in minutes
  const [secondsLeft, setSecondsLeft] = useState(workDuration * 60);
  const [mode, setMode] = useState<"Work" | "Break">("Work");

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === 1 && mode === "Work") {
            setMode("Break");
            return breakDuration * 60; // Switch to break time
          } else if (prev === 1 && mode === "Break") {
            setMode("Work");
            return workDuration * 60; // Switch to work time
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && secondsLeft !== 0 && interval !== null) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode, workDuration, breakDuration]);

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(workDuration * 60);
    setMode("Work");
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const formatTime = () => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!isOpen) return null;

  return (
    <Draggable handle={`.${styles.handle}`} bounds="body">
      <div className={styles.timerPopup}>
        <div className={styles.handle}>
          <button className={styles.closeButton} onClick={handleClose}>
            X
          </button>
          <h2>
            {mode} Time: {formatTime()}
          </h2>
        </div>
        <div>
          <input
            className={styles.input}
            type="number"
            value={workDuration}
            onChange={(e) => setWorkDuration(parseInt(e.target.value))}
          />
          <input
            className={styles.input}
            type="number"
            value={breakDuration}
            onChange={(e) => setBreakDuration(parseInt(e.target.value))}
          />
        </div>
        <button className={styles.button} onClick={toggleRunning}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button className={styles.button} onClick={resetTimer}>
          Reset
        </button>
      </div>
    </Draggable>
  );
};
