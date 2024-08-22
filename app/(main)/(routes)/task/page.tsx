// task/page.tsx
"use client";
"use client";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "./components/data-table";
import { UserNav } from "./components/user-nav";
import { columns } from "./components/columns";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Heading,
  useToast,
  Spinner,
  Container,
  Stack,
} from "@chakra-ui/react";

interface Task {
  id: string;
  title: string;
  status: string;
  label: string;
  priority: string;
}

const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("backlog");
  const [label, setLabel] = useState("bug");
  const [priority, setPriority] = useState("low");

  const fetchedTasks = useQuery(api.task.getTasks);
  const createTaskMutation = useMutation(api.task.createTask);
  const toast = useToast();
  const handleDeleteFromUI = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  useEffect(() => {
    if (fetchedTasks) {
      const mappedTasks = fetchedTasks.map((task) => ({
        ...task,
        id: task._id, // Map _id to id for consistency
      }));
      setTasks(mappedTasks);
      setLoading(false);
    }
  }, [fetchedTasks]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createTaskMutation({
        id: crypto.randomUUID(),
        title,
        status,
        label,
        priority,
      });
      setTitle("");
      setStatus("backlog"); // Reset to default value
      setLabel("bug"); // Reset to default value
      setPriority("low"); // Reset to default value
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  if (loading) return <p>Loading tasks...</p>;

  return (
    <Container maxW="container.xl" p={4}>
      <Heading color={"white"} mb={6}>
        Task Management
      </Heading>
      <VStack
        as="form"
        color={"white"}
        onSubmit={
          handleSubmit as unknown as React.FormEventHandler<HTMLDivElement>
        }
        spacing={4}
        align="stretch"
      >
        <FormControl isRequired>
          <FormLabel htmlFor="title">Title</FormLabel>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
        </FormControl>
        <FormControl>
          <FormLabel color={"white"}>Status</FormLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="backlog">Backlog</option>
            <option value="todo">Todo</option>
            <option value="in progress">In Progress</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Label</FormLabel>
          <Select value={label} onChange={(e) => setLabel(e.target.value)}>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="documentation">Documentation</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Priority</FormLabel>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </FormControl>
        <Button type="submit" colorScheme="blue">
          Add Task
        </Button>
      </VStack>
      <Box color="white">
        <DataTable data={tasks} columns={columns} />
      </Box>
    </Container>
  );
};

export default TaskPage;
