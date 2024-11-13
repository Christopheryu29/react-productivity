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
  FaTrash,
  FaMoneyBillWave,
  FaWallet,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
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
  startOfDay,
  endOfDay,
  parseISO,
} from "date-fns";

interface Expense {
  id: number;
  amount: number;
  type: "income" | "expense";
  date: string; // ISO 8601 formatted date string
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

  const bgColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("black", "white");
  const tableBgColor = useColorModeValue("gray.50", "gray.800");
  const headerBgColor = useColorModeValue("black", "white");
  const headerTextColor = useColorModeValue("white", "black");
  const rowHoverColor = useColorModeValue("gray.100", "gray.700");

  // Filter and sort expenses based on the selected filter (weekly, monthly, or all)
  const filterExpenses = (expenses: Expense[]) => {
    const filteredExpenses = expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date); // Parse the ISO string to Date object

      if (filter === "weekly") {
        const startOfThisWeek = startOfDay(startOfWeek(currentDate));
        const endOfThisWeek = endOfDay(endOfWeek(currentDate));
        return expenseDate >= startOfThisWeek && expenseDate <= endOfThisWeek;
      }

      if (filter === "monthly") {
        const startOfThisMonth = startOfDay(startOfMonth(currentDate));
        const endOfThisMonth = endOfDay(endOfMonth(currentDate));
        return expenseDate >= startOfThisMonth && expenseDate <= endOfThisMonth;
      }

      return true; // Return all expenses for "all" filter
    });

    // Sort expenses by date (earliest first)
    return filteredExpenses.sort(
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

  const formatPeriod = () => {
    if (filter === "weekly") {
      const startOfThisWeek = startOfWeek(currentDate);
      const endOfThisWeek = endOfWeek(currentDate);
      return `${startOfThisWeek.toLocaleDateString()} - ${endOfThisWeek.toLocaleDateString()}`;
    } else if (filter === "monthly") {
      const startOfThisMonth = startOfMonth(currentDate);
      return `${startOfThisMonth.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })}`;
    }
    return ""; // No specific period formatting for "all"
  };

  return (
    <Box className="p-3 rounded-lg mx-auto  text-gray-800 dark:text-white shadow-lg max-w-full md:max-w-4xl">
      {/* Header with Filters and Navigation */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" fontWeight="bold" letterSpacing="wide">
          Expenses Overview
        </Heading>

        <HStack spacing={3}>
          <Button
            size="sm"
            onClick={handlePreviousPeriod}
            className="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
          >
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
            className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-500 dark:hover:border-gray-500 transition-colors duration-200"
          >
            <option value="all" style={{ color: "black" }}>
              All Expenses
            </option>
            <option value="weekly" style={{ color: "black" }}>
              Weekly
            </option>
            <option value="monthly" style={{ color: "black" }}>
              Monthly
            </option>
          </Select>

          <Button
            size="sm"
            onClick={handleNextPeriod}
            className="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
          >
            <FaChevronRight />
          </Button>
        </HStack>
      </Flex>

      {/* Display Current Period */}
      {filter !== "all" && (
        <Text fontWeight="bold" textAlign="center" mb={4} className="text-lg">
          {formatPeriod()}
        </Text>
      )}

      {/* Table with improved styles */}
      <Box overflowX="auto">
        <Table
          variant="simple"
          size="sm"
          className="rounded-md shadow-md  transition-colors duration-200"
        >
          <Thead>
            <Tr className="bg-gray-100 dark:bg-gray-700">
              <Th className="text-gray-700 dark:text-gray-300 font-medium">
                Amount
              </Th>
              <Th className="text-gray-700 dark:text-gray-300 font-medium">
                Type
              </Th>
              <Th className="text-gray-700 dark:text-gray-300 font-medium">
                Category
              </Th>
              <Th className="text-gray-700 dark:text-gray-300 font-medium">
                Date
              </Th>
              <Th className="text-gray-700 dark:text-gray-300 font-medium">
                Actions
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {filterExpenses(expenses).map((expense) => (
              <Tr
                key={expense.id}
                className="transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {/* Amount */}
                <Td>
                  <Tooltip
                    label={`$${expense.amount.toFixed(2)}`}
                    aria-label="Amount"
                  >
                    <Text
                      fontWeight="bold"
                      className={`font-semibold ${
                        expense.type === "income"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
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
                      className={`text-lg ${
                        expense.type === "income"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    />
                    <Badge
                      className={`px-3 py-1 rounded-full text-white font-medium ${
                        expense.type === "income"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {expense.type.charAt(0).toUpperCase() +
                        expense.type.slice(1)}
                    </Badge>
                  </HStack>
                </Td>

                {/* Category */}
                <Td>
                  <Badge className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full font-sm font-medium">
                    {expense.category}
                  </Badge>
                </Td>

                {/* Date */}
                <Td>
                  <Text className="text-gray-600 dark:text-gray-400 text-sm">
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
                    <Tooltip label="Delete" aria-label="Delete">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(expense.id)}
                        className="text-red-500 hover:bg-red-100 dark:hover:bg-red-600 dark:text-red-300 rounded-full p-1 transition-transform transform hover:scale-105"
                      >
                        <FaTrash />
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
