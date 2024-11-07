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
    <Flex
      direction="column"
      p="6"
      minH="100vh"
      align="center"
      bgGradient="linear(to-b, #202020, #2c2c2c)"
    >
      <Flex justify="center" align="center" mb="8">
        <Heading
          size="2xl"
          color="white"
          textShadow="1px 1px 5px rgba(0, 0, 0, 0.6)"
        >
          Todo List
        </Heading>
      </Flex>

      <Flex gap="2" w="full" maxW="lg" mb="8">
        <Input
          flex="1"
          p="4"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          size="lg"
          borderColor="gray.600"
          rounded="lg"
          shadow="md"
          bg="gray.700"
          color="whiteAlpha.900"
          _placeholder={{ color: "gray.400" }}
          _focus={{
            borderColor: "cyan.500",
            boxShadow: "0px 0px 10px rgba(56, 189, 248, 0.5)",
          }}
        />
        <IconButton
          icon={<AddIcon />}
          bgGradient="linear(to-r, teal.400, cyan.500)"
          color="white"
          size="lg"
          onClick={handleAddTodo}
          aria-label="Add todo"
          variant="solid"
          shadow="lg"
          _hover={{
            transform: "scale(1.05)",
            bgGradient: "linear(to-r, teal.500, cyan.600)",
            boxShadow: "0px 4px 12px rgba(56, 189, 248, 0.6)",
          }}
          transition="all 0.2s"
          rounded="full"
        />
      </Flex>

      {todos && todos.length > 0 ? (
        <VStack spacing="4" w="full" maxW="lg">
          {todos.map((todo) => (
            <ScaleFade key={todo._id} in>
              <Flex
                align="center"
                p="4"
                bg="gray.800"
                shadow="lg"
                rounded="lg"
                w="full"
                borderWidth="1px"
                borderColor="gray.700"
                _hover={{
                  transform: "scale(1.02)",
                  bg: "gray.700",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
                }}
                transition="all 0.2s ease"
              >
                <Checkbox
                  isChecked={todo.isCompleted}
                  onChange={() => handleToggleTodo(todo._id, todo.isCompleted)}
                  size="lg"
                  colorScheme="cyan"
                  mr="4"
                />
                <Text
                  flex="1"
                  fontSize="lg"
                  color={todo.isCompleted ? "gray.500" : "whiteAlpha.900"}
                  as={todo.isCompleted ? "s" : undefined}
                  noOfLines={1}
                  opacity={todo.isCompleted ? 0.7 : 1}
                  transition="opacity 0.2s"
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
                  _hover={{
                    color: "red.400",
                    transform: "scale(1.1)",
                  }}
                  transition="all 0.2s"
                />
              </Flex>
            </ScaleFade>
          ))}
        </VStack>
      ) : (
        <Box mt="8" textAlign="center">
          <Text fontSize="lg" color="gray.400" fontWeight="medium">
            No todos found. Add some!
          </Text>
        </Box>
      )}

      <Divider mt="8" mb="6" w="full" maxW="lg" borderColor="gray.600" />

      <Flex justify="center">
        <Text fontSize="md" color="gray.400" fontStyle="italic">
          Stay organized. Keep track of your tasks.
        </Text>
      </Flex>
    </Flex>
  );
}

export default TodoApp;
