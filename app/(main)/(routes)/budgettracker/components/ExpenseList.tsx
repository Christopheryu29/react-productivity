import React, { useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  Icon,
  Badge,
  Text,
  Tooltip,
  Select,
  Heading,
  Flex,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { FaEdit, FaTrash, FaMoneyBillWave, FaWallet } from "react-icons/fa";

interface Expense {
  id: number;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (
    id: number,
    amount: number,
    type: "income" | "expense",
    category: string,
    date: string
  ) => void;
  onDelete: (id: number) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onEdit,
  onDelete,
}) => {
  const [filter, setFilter] = useState<"all" | "weekly" | "monthly">("all");

  // Handle filtering and sorting of expenses
  const filterExpenses = (expenses: Expense[]) => {
    const now = new Date();

    let filteredExpenses = expenses;

    if (filter === "weekly") {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      filteredExpenses = expenses.filter(
        (expense) => new Date(expense.date) >= oneWeekAgo
      );
    }

    if (filter === "monthly") {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      filteredExpenses = expenses.filter(
        (expense) => new Date(expense.date) >= oneMonthAgo
      );
    }

    // Sort expenses by date from earliest to latest
    return filteredExpenses.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  return (
    <Box
      boxShadow="2xl"
      p={5}
      rounded="lg"
      bg={useColorModeValue("white", "gray.800")}
      maxW={{ base: "100%", md: "80%" }}
      mx="auto"
    >
      {/* Header with Filters */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="teal.600" fontWeight="bold">
          Expenses Overview
        </Heading>
        <Select
          w={{ base: "100%", md: "auto" }}
          size="sm"
          maxW="200px"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "all" | "weekly" | "monthly")
          }
          bg="teal.50"
          color="teal.600"
          border="1px"
          borderColor="teal.200"
          _hover={{ bg: "teal.100" }}
        >
          <option value="all">All Expenses</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </Select>
      </Flex>

      {/* Table with improved styles */}
      <Box overflowX="auto">
        <Table
          variant="simple"
          size="sm"
          bg={useColorModeValue("white", "gray.700")}
        >
          <Thead>
            <Tr>
              <Th color="teal.600">Amount</Th>
              <Th color="teal.600">Type</Th>
              <Th color="teal.600">Category</Th>
              <Th color="teal.600">Date</Th>
              <Th color="teal.600">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filterExpenses(expenses).map((expense, index) => (
              <Tr
                key={expense.id}
                transition="background-color 0.2s ease-in-out"
                rounded="md"
              >
                {/* Amount */}
                <Td>
                  <Tooltip
                    label={`$${expense.amount.toFixed(2)}`}
                    aria-label="Amount"
                  >
                    <Text
                      fontWeight="bold"
                      color={
                        expense.type === "income" ? "green.600" : "red.600"
                      }
                      fontSize="md"
                    >
                      ${expense.amount.toFixed(2)}
                    </Text>
                  </Tooltip>
                </Td>

                {/* Type */}
                <Td>
                  <HStack spacing={2}>
                    <Icon
                      as={
                        expense.type === "income" ? FaWallet : FaMoneyBillWave
                      }
                      color={
                        expense.type === "income" ? "green.500" : "red.500"
                      }
                    />
                    <Badge
                      colorScheme={expense.type === "income" ? "green" : "red"}
                      variant="solid"
                      rounded="md"
                      px={2}
                      py={1}
                    >
                      {expense.type.charAt(0).toUpperCase() +
                        expense.type.slice(1)}
                    </Badge>
                  </HStack>
                </Td>

                {/* Category */}
                <Td>
                  <Badge
                    colorScheme="blue"
                    variant="outline"
                    rounded="full"
                    px={2}
                    py={1}
                    fontSize="sm"
                  >
                    {expense.category}
                  </Badge>
                </Td>

                {/* Date */}
                <Td>
                  <Text color="gray.600" fontSize="sm">
                    {new Date(expense.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </Td>

                {/* Actions */}
                <Td>
                  <HStack spacing={3}>
                    <Tooltip label="Edit" aria-label="Edit">
                      <Button
                        size="sm"
                        colorScheme="yellow"
                        onClick={() =>
                          onEdit(
                            expense.id,
                            expense.amount,
                            expense.type,
                            expense.category,
                            expense.date
                          )
                        }
                        variant="ghost"
                        _hover={{ bg: "yellow.100" }}
                        leftIcon={<FaEdit />}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                    <Tooltip label="Delete" aria-label="Delete">
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => onDelete(expense.id)}
                        variant="ghost"
                        _hover={{ bg: "red.100" }}
                        leftIcon={<FaTrash />}
                      >
                        Delete
                      </Button>
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default ExpenseList;
