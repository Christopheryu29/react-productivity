// app/(main)/(routes)/todo/page.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";

function TodoApp() {
  const [newTodo, setNewTodo] = useState("");
  const toast = useToast();

  const todos = useQuery(api.todo.getTodos);
  const createTodo = useMutation(api.todo.createTodo);
  const toggleTodo = useMutation(api.todo.toggleTodo);
  const deleteTodo = useMutation(api.todo.deleteTodo);

  const handleAddTodo = async () => {
    if (newTodo.trim() !== "") {
      await createTodo({ text: newTodo });
      setNewTodo("");
      toast({
        title: "Todo added.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleToggleTodo = async (id: string, isCompleted: boolean) => {
    const todoId = id as unknown as Id<"todos">;
    await toggleTodo({ id: todoId, isCompleted: !isCompleted });
  };

  const handleDeleteTodo = async (id: string) => {
    const todoId = id as unknown as Id<"todos">;
    await deleteTodo({ id: todoId });
    toast({
      title: "Todo deleted.",
      status: "error",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Flex direction="column" p="4" minH="screen">
      <Flex justify="center" align="center" mb="4">
        <Heading color="blue.500">Todo List</Heading>
      </Flex>

      <Flex gap="2">
        <Input
          flex="1"
          p="2"
          placeholder="Add new todo"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          size="lg"
          borderColor="gray.300"
        />
        <Button colorScheme="blue" px="4" py="2" onClick={handleAddTodo}>
          Add
        </Button>
      </Flex>

      {todos && todos.length > 0 ? (
        <VStack spacing="4" mt="4">
          {todos.map((todo) => (
            <Flex
              key={todo._id}
              align="center"
              p="2"
              shadow="md"
              rounded="md"
              w="full"
            >
              <Checkbox
                isChecked={todo.isCompleted}
                onChange={() => handleToggleTodo(todo._id, todo.isCompleted)}
                mr="4"
              />
              <Text
                color="white"
                flex="1"
                as={todo.isCompleted ? "s" : undefined}
              >
                {todo.text}
              </Text>
              <Button
                colorScheme="red"
                onClick={() => handleDeleteTodo(todo._id)}
              >
                Delete
              </Button>
            </Flex>
          ))}
        </VStack>
      ) : (
        <Text mt="4">No todos found. Add some!</Text>
      )}
    </Flex>
  );
}

export default TodoApp;
