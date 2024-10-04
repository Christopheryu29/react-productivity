import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Divider,
  Badge,
  HStack,
  Icon,
} from "@chakra-ui/react";
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaArrowDown,
} from "react-icons/fa"; // Import FontAwesome icons

interface ExpenseHighlightsProps {
  maxExpenseWeek: {
    week: string;
    totalIncome: number;
    totalExpenses: number;
    expensesByCategory: Record<string, number>;
  };
  maxExpenseMonth: {
    month: string;
    totalIncome: number;
    totalExpenses: number;
    expensesByCategory: Record<string, number>;
  };
  weeklyExpenseSuggestion: string;
  monthlyExpenseSuggestion: string;
  weeklyThresholds: Record<string, number>;
  thresholds: Record<string, number>;
  getCategoryWarnings: (
    expensesByCategory: Record<string, number>,
    income: number,
    thresholds: Record<string, number>
  ) => string[];
}

const ExpenseHighlights: React.FC<ExpenseHighlightsProps> = ({
  maxExpenseWeek,
  maxExpenseMonth,
  weeklyExpenseSuggestion,
  monthlyExpenseSuggestion,
  weeklyThresholds,
  thresholds,
  getCategoryWarnings,
}) => {
  // Calculate if weekly or monthly expenses exceed income
  const weeklyWarning =
    maxExpenseWeek.totalExpenses > maxExpenseWeek.totalIncome;
  const monthlyWarning =
    maxExpenseMonth.totalExpenses > maxExpenseMonth.totalIncome;

  // Calculate percentage expenses relative to income
  const calculateExpensePercentage = (expenses: number, income: number) => {
    return ((expenses / income) * 100).toFixed(1);
  };

  return (
    <Box
      boxShadow="2xl"
      p={6}
      rounded="lg"
      bgGradient="linear(to-r, teal.50, white)"
      mt={4}
    >
      <Heading size="lg" mb={6} color="teal.700">
        <Icon as={FaInfoCircle} boxSize={5} mr={2} /> Expense Highlights
      </Heading>

      {/* Weekly Expenses Section */}
      <VStack align="start" spacing={4} w="100%">
        <Box
          w="100%"
          boxShadow="md"
          p={4}
          bg="white"
          rounded="md"
          border="1px"
          borderColor="teal.100"
        >
          <HStack justify="space-between">
            <Heading size="md" color="teal.800">
              <Icon
                as={FaExclamationTriangle}
                color="orange.400"
                boxSize={4}
                mr={2}
              />
              {maxExpenseWeek.week}
            </Heading>
            <Badge colorScheme={weeklyWarning ? "red" : "green"}>
              {weeklyWarning ? "Overspending Alert" : "Within Budget"}
            </Badge>
          </HStack>
          <Text mt={2} color={weeklyWarning ? "red.600" : "gray.700"}>
            Total Expenses: ${maxExpenseWeek.totalExpenses.toFixed(2)} (
            <Badge colorScheme={weeklyWarning ? "red" : "blue"}>
              {calculateExpensePercentage(
                maxExpenseWeek.totalExpenses,
                maxExpenseWeek.totalIncome
              )}
              % of Income
            </Badge>
            )
          </Text>
          <Text color="gray.600">
            Total Income:{" "}
            <Badge colorScheme="blue">
              ${maxExpenseWeek.totalIncome.toFixed(2)}
            </Badge>
          </Text>

          {weeklyExpenseSuggestion && (
            <Text color="orange.700" mt={3}>
              <Icon as={FaArrowDown} boxSize={4} mr={2} />
              Weekly Suggestion: {weeklyExpenseSuggestion}
            </Text>
          )}

          {getCategoryWarnings(
            maxExpenseWeek.expensesByCategory,
            maxExpenseWeek.totalIncome,
            weeklyThresholds
          ).map((warning, index) => (
            <Text key={index} color="orange.600" mt={1}>
              <Icon
                as={FaExclamationTriangle}
                color="orange.400"
                boxSize={4}
                mr={2}
              />
              {warning}
            </Text>
          ))}
        </Box>

        <Divider orientation="horizontal" />

        {/* Monthly Expenses Section */}
        <Box
          w="100%"
          boxShadow="md"
          p={4}
          bg="white"
          rounded="md"
          border="1px"
          borderColor="teal.100"
        >
          <HStack justify="space-between">
            <Heading size="md" color="teal.800">
              <Icon
                as={FaExclamationTriangle}
                color="orange.400"
                boxSize={4}
                mr={2}
              />
              {maxExpenseMonth.month}
            </Heading>
            <Badge colorScheme={monthlyWarning ? "red" : "green"}>
              {monthlyWarning ? "Overspending Alert" : "Within Budget"}
            </Badge>
          </HStack>
          <Text mt={2} color={monthlyWarning ? "red.600" : "gray.700"}>
            Total Expenses: ${maxExpenseMonth.totalExpenses.toFixed(2)} (
            <Badge colorScheme={monthlyWarning ? "red" : "blue"}>
              {calculateExpensePercentage(
                maxExpenseMonth.totalExpenses,
                maxExpenseMonth.totalIncome
              )}
              % of Income
            </Badge>
            )
          </Text>
          <Text color="gray.600">
            Total Income:{" "}
            <Badge colorScheme="blue">
              ${maxExpenseMonth.totalIncome.toFixed(2)}
            </Badge>
          </Text>

          {monthlyExpenseSuggestion && (
            <Text color="orange.700" mt={3}>
              <Icon as={FaArrowDown} boxSize={4} mr={2} />
              Monthly Suggestion: {monthlyExpenseSuggestion}
            </Text>
          )}

          {getCategoryWarnings(
            maxExpenseMonth.expensesByCategory,
            maxExpenseMonth.totalIncome,
            thresholds
          ).map((warning, index) => (
            <Text key={index} color="orange.600" mt={1}>
              <Icon
                as={FaExclamationTriangle}
                color="orange.400"
                boxSize={4}
                mr={2}
              />
              {warning}
            </Text>
          ))}
        </Box>
      </VStack>

      <Text color="teal.600" mt={6} fontSize="md">
        Review your spending habits during these periods to identify areas for
        improvement and adjust your budget to meet your financial goals.
      </Text>
    </Box>
  );
};

export default ExpenseHighlights;
