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
} from "@chakra-ui/react";
import {
  FaEdit,
  FaTrash,
  FaMoneyBillWave,
  FaWallet,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameWeek,
  isSameMonth,
} from "date-fns";

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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Move useColorModeValue to the top level of the component
  const bgColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("black", "white");
  const tableBgColor = useColorModeValue("gray.50", "gray.800");
  const headerBgColor = useColorModeValue("black", "white");
  const headerTextColor = useColorModeValue("white", "black");
  const rowHoverColor = useColorModeValue("gray.100", "gray.700");

  // Handle filtering and sorting of expenses
  const filterExpenses = (expenses: Expense[]) => {
    if (filter === "weekly") {
      const startOfThisWeek = startOfWeek(currentDate);
      const endOfThisWeek = endOfWeek(currentDate);
      return expenses.filter(
        (expense) =>
          new Date(expense.date) >= startOfThisWeek &&
          new Date(expense.date) <= endOfThisWeek
      );
    }

    if (filter === "monthly") {
      const startOfThisMonth = startOfMonth(currentDate);
      const endOfThisMonth = endOfMonth(currentDate);
      return expenses.filter(
        (expense) =>
          new Date(expense.date) >= startOfThisMonth &&
          new Date(expense.date) <= endOfThisMonth
      );
    }

    // Sort expenses by date from earliest to latest
    return expenses.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const handlePreviousPeriod = () => {
    if (filter === "weekly") {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else if (filter === "monthly") {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNextPeriod = () => {
    if (filter === "weekly") {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else if (filter === "monthly") {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  return (
    <Box
      boxShadow="lg"
      p={5}
      rounded="lg"
      maxW={{ base: "100%", md: "80%" }}
      mx="auto"
      bg={bgColor}
      color={textColor}
    >
      {/* Header with Filters and Navigation */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" fontWeight="bold" letterSpacing="wide">
          Expenses Overview
        </Heading>

        <HStack spacing={3}>
          <Button size="sm" onClick={handlePreviousPeriod}>
            <FaChevronLeft />
          </Button>

          <Select
            w={{ base: "100%", md: "auto" }}
            size="sm"
            maxW="200px"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | "weekly" | "monthly")
            }
            bg="white"
            color="black"
            border="1px"
            borderColor="gray.300"
            _hover={{ borderColor: "gray.500" }}
          >
            <option value="all">All Expenses</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>

          <Button size="sm" onClick={handleNextPeriod}>
            <FaChevronRight />
          </Button>
        </HStack>
      </Flex>

      {/* Table with improved styles */}
      <Box overflowX="auto">
        <Table
          variant="simple"
          size="sm"
          rounded="md"
          boxShadow="md"
          bg={tableBgColor}
        >
          <Thead>
            <Tr bg={headerBgColor}>
              <Th color={headerTextColor}>Amount</Th>
              <Th color={headerTextColor}>Type</Th>
              <Th color={headerTextColor}>Category</Th>
              <Th color={headerTextColor}>Date</Th>
              <Th color={headerTextColor}>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filterExpenses(expenses).map((expense) => (
              <Tr
                key={expense.id}
                transition="background-color 0.2s ease-in-out"
                _hover={{ bg: rowHoverColor }}
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
                        expense.type === "income" ? "green.500" : "red.500"
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
                      rounded="full"
                      px={3}
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
                    colorScheme="blackAlpha"
                    variant="subtle"
                    rounded="full"
                    px={3}
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
                        colorScheme="blue"
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
                        _hover={{ bg: "blue.100", transform: "scale(1.05)" }}
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
                        _hover={{ bg: "red.100", transform: "scale(1.05)" }}
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