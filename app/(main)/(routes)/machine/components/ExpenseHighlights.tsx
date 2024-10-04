"use client";
import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Badge,
  Divider,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { MdWarning, MdCheckCircle, MdInfoOutline } from "react-icons/md";

interface WeeklyTotals {
  week: string;
  totalIncome: number;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
}

interface MonthlyTotals {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
}

interface ExpenseHighlightsProps {
  allWeeks: WeeklyTotals[];
  allMonths: MonthlyTotals[];
  weeklyThresholds: Record<string, number>;
  thresholds: Record<string, number>;
  getCategoryWarnings: (
    expensesByCategory: Record<string, number>,
    income: number,
    thresholds: Record<string, number>
  ) => string[];
}

const calculateExpensePercentage = (expenses: number, income: number) => {
  return ((expenses / income) * 100).toFixed(1);
};

// Determine color scheme based on spending percentage
const getColorScheme = (expensePercentage: number) => {
  if (expensePercentage <= 70) {
    return { bg: "green.50", text: "green.800", badge: "green" };
  } else if (expensePercentage <= 90) {
    return { bg: "yellow.50", text: "yellow.800", badge: "yellow" };
  } else {
    return { bg: "red.50", text: "red.800", badge: "red" };
  }
};

const ExpenseHighlights: React.FC<ExpenseHighlightsProps> = ({
  allWeeks,
  allMonths,
  weeklyThresholds,
  thresholds,
  getCategoryWarnings,
}) => {
  return (
    <Box
      boxShadow="2xl"
      p={6}
      rounded="lg"
      bgGradient="linear(to-r, teal.50, white)"
      mt={4}
    >
      <Heading size="lg" mb={6} color="teal.700">
        Expense Highlights
      </Heading>

      <VStack align="start" spacing={6} w="100%">
        {/* Loop through all weeks */}
        {allWeeks.map((week, index) => {
          const expensePercentage = parseFloat(
            calculateExpensePercentage(week.totalExpenses, week.totalIncome)
          );
          const colorScheme = getColorScheme(expensePercentage);
          return (
            <Box
              key={index}
              w="100%"
              boxShadow="md"
              p={4}
              bg={colorScheme.bg}
              rounded="md"
              border="1px"
              borderColor={`${colorScheme.badge}.200`}
            >
              <HStack justify="space-between">
                <Heading size="md" color={colorScheme.text}>
                  {week.week}
                </Heading>
                <Badge colorScheme={colorScheme.badge}>
                  <Icon
                    as={
                      expensePercentage > 90
                        ? MdWarning
                        : expensePercentage > 70
                        ? MdInfoOutline
                        : MdCheckCircle
                    }
                    mr={1}
                  />
                  {expensePercentage > 90
                    ? "Overspending Alert"
                    : expensePercentage > 70
                    ? "High Spending"
                    : "Well-Managed"}
                </Badge>
              </HStack>
              <Text mt={2} color={`${colorScheme.text}.600`}>
                Total Expenses: ${week.totalExpenses.toFixed(2)} (
                <Badge colorScheme={colorScheme.badge}>
                  {expensePercentage}% of Income
                </Badge>
                )
              </Text>
              <Text color="gray.600">
                Total Income:{" "}
                <Badge colorScheme="blue">${week.totalIncome.toFixed(2)}</Badge>
              </Text>

              {/* Display weekly warnings */}
              {getCategoryWarnings(
                week.expensesByCategory,
                week.totalIncome,
                weeklyThresholds
              ).map((warning, index) => (
                <Text key={index} color="orange.600" mt={1}>
                  {warning}
                </Text>
              ))}
            </Box>
          );
        })}

        <Divider orientation="horizontal" />

        {/* Loop through all months */}
        {allMonths.map((month, index) => {
          const expensePercentage = parseFloat(
            calculateExpensePercentage(month.totalExpenses, month.totalIncome)
          );
          const colorScheme = getColorScheme(expensePercentage);
          return (
            <Box
              key={index}
              w="100%"
              boxShadow="md"
              p={4}
              bg={colorScheme.bg}
              rounded="md"
              border="1px"
              borderColor={`${colorScheme.badge}.200`}
            >
              <HStack justify="space-between">
                <Heading size="md" color={colorScheme.text}>
                  Month {month.month}
                </Heading>
                <Badge colorScheme={colorScheme.badge}>
                  <Icon
                    as={
                      expensePercentage > 90
                        ? MdWarning
                        : expensePercentage > 70
                        ? MdInfoOutline
                        : MdCheckCircle
                    }
                    mr={1}
                  />
                  {expensePercentage > 90
                    ? "Overspending Alert"
                    : expensePercentage > 70
                    ? "High Spending"
                    : "Well-Managed"}
                </Badge>
              </HStack>
              <Text mt={2} color={`${colorScheme.text}.600`}>
                Total Expenses: ${month.totalExpenses.toFixed(2)} (
                <Badge colorScheme={colorScheme.badge}>
                  {expensePercentage}% of Income
                </Badge>
                )
              </Text>
              <Text color="gray.600">
                Total Income:{" "}
                <Badge colorScheme="blue">
                  ${month.totalIncome.toFixed(2)}
                </Badge>
              </Text>

              {/* Display monthly warnings */}
              {getCategoryWarnings(
                month.expensesByCategory,
                month.totalIncome,
                thresholds
              ).map((warning, index) => (
                <Text key={index} color="orange.600" mt={1}>
                  {warning}
                </Text>
              ))}
            </Box>
          );
        })}
      </VStack>

      <Text color="teal.600" mt={6} fontSize="md">
        Review your spending habits during these periods to identify areas for
        improvement and adjust your budget to meet your financial goals.
      </Text>
    </Box>
  );
};

export default ExpenseHighlights;
