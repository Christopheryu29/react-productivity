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
  IconButton,
  Divider,
  ScaleFade,
  useColorModeValue,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon } from "@chakra-ui/icons";

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

  const cardBg = useColorModeValue("gray.800", "gray.900");
  const textColor = useColorModeValue("white", "whiteAlpha.900");
  const placeholderColor = useColorModeValue(
    "whiteAlpha.600",
    "whiteAlpha.600"
  );

  return (
    <Flex direction="column" p="6" minH="100vh" align="center">
      <Flex justify="center" align="center" mb="6">
        <Heading size="2xl" color="blue.300">
          Todo List
        </Heading>
      </Flex>

      <Flex gap="2" w="full" maxW="lg" mb="6">
        <Input
          flex="1"
          p="4"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          size="lg"
          borderColor="gray.600"
          rounded="lg"
          shadow="sm"
          bg={cardBg}
          color={textColor}
          _placeholder={{ color: placeholderColor }}
        />
        <IconButton
          icon={<AddIcon />}
          colorScheme="blue"
          size="lg"
          onClick={handleAddTodo}
          aria-label="Add todo"
          variant="solid"
          boxShadow="lg"
          _hover={{
            transform: "scale(1.05)",
            bg: "blue.400",
          }}
          transition="all 0.2s"
        />
      </Flex>

      {todos && todos.length > 0 ? (
        <VStack spacing="4" w="full" maxW="lg">
          {todos.map((todo) => (
            <ScaleFade key={todo._id} in>
              <Flex
                align="center"
                p="4"
                bg={cardBg}
                shadow="lg"
                rounded="lg"
                w="full"
                borderWidth="1px"
                borderColor="gray.700"
                transition="transform 0.2s"
                _hover={{ transform: "scale(1.02)", bg: "gray.700" }}
              >
                <Checkbox
                  isChecked={todo.isCompleted}
                  onChange={() => handleToggleTodo(todo._id, todo.isCompleted)}
                  size="lg"
                  colorScheme="green"
                  mr="4"
                />
                <Text
                  flex="1"
                  fontSize="lg"
                  color={todo.isCompleted ? "gray.500" : textColor}
                  as={todo.isCompleted ? "s" : undefined}
                  noOfLines={1}
                >
                  {todo.text}
                </Text>
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  size="sm"
                  onClick={() => handleDeleteTodo(todo._id)}
                  aria-label="Delete todo"
                  variant="ghost"
                  _hover={{ color: "red.400", transform: "scale(1.1)" }}
                  transition="all 0.2s"
                />
              </Flex>
            </ScaleFade>
          ))}
        </VStack>
      ) : (
        <Box mt="6">
          <Text fontSize="lg" color="gray.500">
            No todos found. Add some!
          </Text>
        </Box>
      )}

      <Divider mt="6" mb="4" w="full" maxW="lg" borderColor="gray.600" />

      <Flex justify="center">
        <Text color="gray.400">Stay organized. Keep track of your tasks.</Text>
      </Flex>
    </Flex>
  );
}

export default TodoApp;
