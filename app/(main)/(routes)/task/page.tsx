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
  Text,
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
    <Container
      maxW={{ base: "container.sm", md: "container.lg", xl: "container.xl" }}
      height={"stretch"}
      p={{ base: 4, md: 6, xl: 8 }}
      bg="202020"
      borderRadius={{ base: "lg", md: "xl" }}
      boxShadow="lg"
    >
      <Heading
        color="white"
        mb={8}
        textAlign="center"
        fontSize={{ base: "2xl", md: "3xl" }}
      >
        Task Management
      </Heading>
      <VStack
        as="form"
        color="white"
        onSubmit={
          handleSubmit as unknown as React.FormEventHandler<HTMLDivElement>
        }
        spacing={6}
        align="stretch"
        bg="radial-gradient(circle at center, #303030 0%, #34373f 25%, #2f3246 50%, #303030 100%)"
        p={6}
        borderRadius="lg"
        boxShadow="md"
      >
        <FormControl isRequired>
          <FormLabel htmlFor="title" fontWeight="bold" color="gray.300">
            Title
          </FormLabel>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            bg="gray.600"
            color="white"
            _placeholder={{ color: "gray.400" }}
          />
        </FormControl>

        <FormControl>
          <FormLabel color="gray.300" fontWeight="bold">
            Status
          </FormLabel>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            bg="gray.600"
            color="white"
          >
            <option value="backlog" style={{ color: "black" }}>
              Backlog
            </option>
            <option value="todo" style={{ color: "black" }}>
              Todo
            </option>
            <option value="in progress" style={{ color: "black" }}>
              In Progress
            </option>
            <option value="done" style={{ color: "black" }}>
              Done
            </option>
            <option value="canceled" style={{ color: "black" }}>
              Canceled
            </option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel color="gray.300" fontWeight="bold">
            Label
          </FormLabel>
          <Select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            bg="gray.600"
            color="white"
          >
            <option value="bug" style={{ color: "black" }}>
              Bug
            </option>
            <option value="feature" style={{ color: "black" }}>
              Feature
            </option>
            <option value="documentation" style={{ color: "black" }}>
              Documentation
            </option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel color="gray.300" fontWeight="bold">
            Priority
          </FormLabel>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            bg="gray.600"
            color="white"
            _hover={{ bg: "gray.500" }}
            focusBorderColor="blue.400"
          >
            <option value="low" style={{ color: "black" }}>
              Low
            </option>
            <option value="medium" style={{ color: "black" }}>
              Medium
            </option>
            <option value="high" style={{ color: "black" }}>
              High
            </option>
          </Select>
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          py={6}
          fontSize="lg"
          fontWeight="bold"
          bgGradient="linear(to-r, blue.500, cyan.400)"
          color="white"
          _hover={{
            bgGradient: "linear(to-r, blue.600, cyan.500)",
            transform: "scale(1.02)",
            boxShadow: "xl",
          }}
          _active={{
            bgGradient: "linear(to-r, blue.700, cyan.600)",
            transform: "scale(0.98)",
          }}
          borderRadius="md"
          boxShadow="lg"
          transition="all 0.2s ease-in-out"
        >
          Add Task
        </Button>
      </VStack>

      <Box color="white" mt={8}>
        <Text fontSize="lg" mb={4} fontWeight="bold">
          Task List
        </Text>
        <Box
          bg="radial-gradient(circle at center, #303030 0%, #34373f 25%, #2f3246 50%, #303030 100%)"
          p={4}
          borderRadius="lg"
          boxShadow="md"
        >
          <DataTable data={tasks} columns={columns} />
        </Box>
      </Box>
    </Container>
  );
};

export default TaskPage;
