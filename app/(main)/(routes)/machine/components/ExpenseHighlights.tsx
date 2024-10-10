import React, { useEffect, useState } from "react";
import { useAction } from "convex/react";
import {
  Box,
  VStack,
  Text,
  Badge,
  Heading,
  Divider,
  HStack,
  Icon,
  Spinner,
  Button,
  useColorModeValue,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { api } from "@/convex/_generated/api";
import { MdWarning, MdCheckCircle, MdInfoOutline } from "react-icons/md";
import { FaLightbulb } from "react-icons/fa"; // Icon for financial advice
import { AiOutlineDollar } from "react-icons/ai"; // Icon for totals
import CriticalPeriods from "./CriticalPeriods";

// Define interfaces for WeeklyTotals and MonthlyTotals
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

interface YearlyTotals {
  year: string;
  totalIncome: number;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
}

interface ExpenseHighlightsProps {
  allWeeks: WeeklyTotals[];
  allMonths: MonthlyTotals[];
  allYears: YearlyTotals[];
  weeklyThresholds: Record<string, number>;
  thresholds: Record<string, number>;
  getCategoryWarnings: (
    expensesByCategory: Record<string, number>,
    income: number,
    thresholds: Record<string, number>
  ) => string[];
}

// Function to calculate the percentage of expenses relative to income
const calculateExpensePercentage = (expenses: number, income: number) => {
  return ((expenses / income) * 100).toFixed(1);
};

// Function to determine color scheme based on spending percentage
const getColorScheme = (expensePercentage: number) => {
  if (expensePercentage <= 70) {
    return { bg: "green.50", text: "green.800", badge: "green" };
  } else if (expensePercentage <= 90) {
    return { bg: "yellow.50", text: "yellow.800", badge: "yellow" };
  } else {
    return { bg: "red.50", text: "red.800", badge: "red" };
  }
};

// Function to evaluate expenses and provide suggestions
const evaluateExpenses = (data: {
  totalIncome: number;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
  median_family_income: number;
}) => {
  const { totalIncome, totalExpenses, expensesByCategory } = data;

  const suggestions: string[] = [];
  const total_expense_percentage = (totalExpenses / totalIncome) * 100;

  // Threshold check
  const thresholds = {
    housing: 0.3,
    food: 0.15,
    transportation: 0.15,
    healthcare: 0.1,
    other_necessities: 0.1,
    childcare: 0.1,
    taxes: 0.25,
  };

  // Evaluate expenses for each category
  Object.entries(expensesByCategory).forEach(([category, amount]) => {
    if (thresholds[category as keyof typeof thresholds]) {
      const recommendedPercentage =
        thresholds[category as keyof typeof thresholds] * 100;
      const actualPercentage = (amount / totalIncome) * 100;

      if (actualPercentage > recommendedPercentage) {
        suggestions.push(
          `Your ${category} expenses are ${actualPercentage.toFixed(
            1
          )}% of your income, exceeding the recommended ${recommendedPercentage}%. Consider ways to reduce these expenses.`
        );
      }
    }
  });

  // Provide overall expense feedback
  if (total_expense_percentage > 80) {
    suggestions.push(
      "Your overall expenses exceed 80% of your income. Aim to reduce your costs or increase your income to improve your financial health."
    );
  } else {
    suggestions.push(
      "Your overall expenses are well-balanced relative to your income."
    );
  }

  return suggestions;
};

const ExpenseHighlights: React.FC<ExpenseHighlightsProps> = ({
  allWeeks,
  allMonths,
  allYears,
  weeklyThresholds,
  thresholds,
  getCategoryWarnings,
}) => {
  const getAdvice = useAction(api.openai.doSomething);
  const [advice, setAdvice] = useState<string[]>([]);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Responsive heading size
  const headingSize = useBreakpointValue({ base: "md", md: "lg" });

  // Color modes
  const bgGradient = useColorModeValue(
    "linear(to-br, teal.50, white)",
    "linear(to-br, teal.900, gray.800)"
  );
  const adviceBg = useColorModeValue("white", "gray.700");

  // Color mode for light/dark theme
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("teal.100", "teal.700");

  // Sort weeks by year and week number
  const sortedWeeks = [...allWeeks].sort((a, b) => {
    // Extract week number and year from `week` strings like "Week 35 2024"
    const weekA = parseInt(a.week.match(/Week (\d+)/)?.[1] || "0", 10);
    const yearA = parseInt(a.week.match(/(\d{4})/)?.[1] || "0", 10);
    const weekB = parseInt(b.week.match(/Week (\d+)/)?.[1] || "0", 10);
    const yearB = parseInt(b.week.match(/(\d{4})/)?.[1] || "0", 10);

    // Sort by year first, then by week number
    if (yearA === yearB) {
      return weekA - weekB;
    }
    return yearA - yearB;
  });

  const sortedMonths = [...allMonths].sort(
    (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  const sortedYears = [...allYears].sort(
    (a, b) => Number(a.year) - Number(b.year)
  );

  // Generate Evaluation Summaries based on sorted data
  const weeklyEvaluations = sortedWeeks.map((week) =>
    evaluateExpenses({
      totalIncome: week.totalIncome,
      totalExpenses: week.totalExpenses,
      expensesByCategory: week.expensesByCategory,
      median_family_income: week.totalIncome,
    })
  );

  const monthlyEvaluations = sortedMonths.map((month) =>
    evaluateExpenses({
      totalIncome: month.totalIncome,
      totalExpenses: month.totalExpenses,
      expensesByCategory: month.expensesByCategory,
      median_family_income: month.totalIncome,
    })
  );

  const yearlyEvaluations = sortedYears.map((year) =>
    evaluateExpenses({
      totalIncome: year.totalIncome,
      totalExpenses: year.totalExpenses,
      expensesByCategory: year.expensesByCategory,
      median_family_income: year.totalIncome,
    })
  );

  const criticalPeriods = [
    ...weeklyEvaluations,
    ...monthlyEvaluations,
    ...yearlyEvaluations,
  ]
    .flat()
    .filter(
      (evaluation) =>
        evaluation.includes("exceed") || evaluation.includes("high spending")
    );

  const generateFinancialQuery = () => {
    let query =
      "You are an expert financial advisor. Please review the following financial data and provide actionable advice for improving financial health by reducing high expenses and increasing savings. Focus on areas with the highest expenses and deviations from ideal spending habits.\n\n";

    // Weekly Overview
    query += "Weekly Overview:\n";
    allWeeks.forEach((week, index) => {
      const expenseCategories = Object.entries(week.expensesByCategory)
        .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
        .join(", ");
      query += `- Week ${index + 1}: Income: $${week.totalIncome.toFixed(
        2
      )}, Expenses: $${week.totalExpenses.toFixed(2)} (${(
        (week.totalExpenses / week.totalIncome) *
        100
      ).toFixed(1)}% of income). Breakdown: [${expenseCategories}]\n`;
    });

    // Monthly Overview
    query += "\nMonthly Overview:\n";
    allMonths.forEach((month, index) => {
      const expenseCategories = Object.entries(month.expensesByCategory)
        .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
        .join(", ");
      query += `- Month ${index + 1}: Income: $${month.totalIncome.toFixed(
        2
      )}, Expenses: $${month.totalExpenses.toFixed(2)} (${(
        (month.totalExpenses / month.totalIncome) *
        100
      ).toFixed(1)}% of income). Breakdown: [${expenseCategories}]\n`;
    });

    // Yearly Overview
    query += "\nYearly Overview:\n";
    allYears.forEach((year, index) => {
      const expenseCategories = Object.entries(year.expensesByCategory)
        .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
        .join(", ");
      query += `- Year ${year.year}: Income: $${year.totalIncome.toFixed(
        2
      )}, Expenses: $${year.totalExpenses.toFixed(2)} (${(
        (year.totalExpenses / year.totalIncome) *
        100
      ).toFixed(1)}% of income). Breakdown: [${expenseCategories}]\n`;
    });

    // Add questions for the AI to address
    query += `The user would like to know:
      1. Which expense categories are significantly higher than expected, and what are the potential reasons for this?
      2. Are there specific weeks, months, or years where spending is exceptionally high? If so, please provide strategies to reduce these expenses.
      3. Are the savings habits aligned with the user's financial goals, given the income and expenses trends? How can savings be increased without compromising essential needs?
      4. Please provide suggestions for each category (e.g., housing, transportation, food) on how the user can optimize their spending or identify unnecessary expenses.
      5. Recommend budgeting strategies that can help the user stay on track with their financial health in the long term.
      Note: If possible, suggest changes that are practical, easy to implement, and aligned with maintaining or improving the user's overall financial wellness.
      Provide your recommendations in a clear, concise, and prioritized manner.`;

    return query;
  };

  // Function to fetch advice from OpenAI
  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    const query = generateFinancialQuery();
    try {
      const response = await getAdvice({ query });
      if (response) {
        const cleanedResponse = response.replace(/\*\*/g, "");
        const formattedAdvice = cleanedResponse
          .split("\n")
          .filter((line) => line.trim());
        setAdvice(formattedAdvice);
      } else {
        setAdvice(["No advice available at this moment."]);
      }
    } catch (error) {
      console.error("Error fetching advice:", error);
      setAdvice(["Unable to retrieve advice at this moment."]);
    } finally {
      setLoadingAdvice(false);
    }
  };

  const criticalWeeks = sortedWeeks.filter((_, index) =>
    weeklyEvaluations[index].some(
      (evaluation) =>
        evaluation.includes("exceed") || evaluation.includes("high spending")
    )
  );
  const criticalMonths = sortedMonths.filter((_, index) =>
    monthlyEvaluations[index].some(
      (evaluation) =>
        evaluation.includes("exceed") || evaluation.includes("high spending")
    )
  );
  const criticalYears = sortedYears.filter((_, index) =>
    yearlyEvaluations[index].some(
      (evaluation) =>
        evaluation.includes("exceed") || evaluation.includes("high spending")
    )
  );

  return (
    <Box
      boxShadow="2xl"
      p={8}
      rounded="xl"
      bgGradient={bgGradient}
      mt={8}
      border="1px"
      borderColor={borderColor}
      transition="all 0.3s"
      _hover={{ boxShadow: "lg", transform: "scale(1.02)" }}
    >
      <CriticalPeriods
        criticalWeeks={criticalWeeks}
        criticalMonths={criticalMonths}
        criticalYears={criticalYears}
      />

      <Divider orientation="horizontal" borderColor="teal.300" my={4} />
      <HStack spacing={3} mb={6}>
        <Icon as={AiOutlineDollar} color="teal.600" boxSize={8} />
        <Heading size={headingSize} color="teal.700">
          Expense Highlights
        </Heading>
      </HStack>

      <VStack align="start" spacing={8} w="100%">
        {/* Loop through sorted weeks */}
        {sortedWeeks.map((week, index) => {
          const expensePercentage = parseFloat(
            calculateExpensePercentage(week.totalExpenses, week.totalIncome)
          );
          const colorScheme = getColorScheme(expensePercentage);
          return (
            <Box
              key={index}
              w="100%"
              boxShadow="lg"
              p={6}
              bg={colorScheme.bg}
              rounded="md"
              border="1px"
              borderColor={`${colorScheme.badge}.300`}
              transition="all 0.3s"
              _hover={{ transform: "scale(1.01)" }}
            >
              <HStack justify="space-between">
                <Heading size="md" color={colorScheme.text}>
                  {week.week}
                </Heading>
                <Badge variant="solid" colorScheme={colorScheme.badge} p={1}>
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
              <Stack mt={4} spacing={2}>
                <Text color={`${colorScheme.text}.600`} fontWeight="semibold">
                  Total Expenses: ${week.totalExpenses.toFixed(2)} (
                  <Badge colorScheme={colorScheme.badge}>
                    {expensePercentage}% of Income
                  </Badge>
                  )
                </Text>
                <Text color="gray.600">
                  Total Income:{" "}
                  <Badge variant="outline" colorScheme="blue">
                    ${week.totalIncome.toFixed(2)}
                  </Badge>
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
                {/* Display weekly evaluations */}
                {weeklyEvaluations[index].map((evaluation, idx) => (
                  <Text key={idx} color="purple.600" mt={1}>
                    {evaluation}
                  </Text>
                ))}
              </Stack>
            </Box>
          );
        })}

        <Divider orientation="horizontal" borderColor="teal.300" my={4} />

        {/* Loop through sorted months */}
        {sortedMonths.map((month, index) => {
          const expensePercentage = parseFloat(
            calculateExpensePercentage(month.totalExpenses, month.totalIncome)
          );
          const colorScheme = getColorScheme(expensePercentage);
          return (
            <Box
              key={index}
              w="100%"
              boxShadow="lg"
              p={6}
              bg={colorScheme.bg}
              rounded="md"
              border="1px"
              borderColor={`${colorScheme.badge}.300`}
              transition="all 0.3s"
              _hover={{ transform: "scale(1.01)" }}
            >
              <HStack justify="space-between">
                <Heading size="md" color={colorScheme.text}>
                  Month {month.month}
                </Heading>
                <Badge variant="solid" colorScheme={colorScheme.badge} p={1}>
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
              <Stack mt={4} spacing={2}>
                <Text color={`${colorScheme.text}.600`} fontWeight="semibold">
                  Total Expenses: ${month.totalExpenses.toFixed(2)} (
                  <Badge colorScheme={colorScheme.badge}>
                    {expensePercentage}% of Income
                  </Badge>
                  )
                </Text>
                <Text color="gray.600">
                  Total Income:{" "}
                  <Badge variant="outline" colorScheme="blue">
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
                {/* Display monthly evaluations */}
                {monthlyEvaluations[index].map((evaluation, idx) => (
                  <Text key={idx} color="purple.600" mt={1}>
                    {evaluation}
                  </Text>
                ))}
              </Stack>
            </Box>
          );
        })}
      </VStack>

      <Divider orientation="horizontal" borderColor="teal.300" my={4} />

      {/* Loop through sorted years */}
      {sortedYears.map((year, index) => {
        const expensePercentage = parseFloat(
          calculateExpensePercentage(year.totalExpenses, year.totalIncome)
        );
        const colorScheme = getColorScheme(expensePercentage);
        return (
          <Box
            key={index}
            w="100%"
            boxShadow="lg"
            p={6}
            bg={colorScheme.bg}
            rounded="md"
            border="1px"
            borderColor={`${colorScheme.badge}.300`}
            transition="all 0.3s"
            _hover={{ transform: "scale(1.01)" }}
          >
            <HStack justify="space-between">
              <Heading size="md" color={colorScheme.text}>
                Year {year.year}
              </Heading>
              <Badge variant="solid" colorScheme={colorScheme.badge} p={1}>
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
            <Stack mt={4} spacing={2}>
              <Text color={`${colorScheme.text}.600`} fontWeight="semibold">
                Total Expenses: ${year.totalExpenses.toFixed(2)} (
                <Badge colorScheme={colorScheme.badge}>
                  {expensePercentage}% of Income
                </Badge>
                )
              </Text>
              <Text color="gray.600">
                Total Income:{" "}
                <Badge variant="outline" colorScheme="blue">
                  ${year.totalIncome.toFixed(2)}
                </Badge>
              </Text>

              {/* Display yearly warnings */}
              {getCategoryWarnings(
                year.expensesByCategory,
                year.totalIncome,
                thresholds
              ).map((warning, index) => (
                <Text key={index} color="orange.600" mt={1}>
                  {warning}
                </Text>
              ))}
              {/* Display yearly evaluations */}
              {yearlyEvaluations[index].map((evaluation, idx) => (
                <Text key={idx} color="purple.600" mt={1}>
                  {evaluation}
                </Text>
              ))}
            </Stack>
          </Box>
        );
      })}

      <Divider orientation="horizontal" mt={6} borderColor="teal.300" />

      {/* Button to fetch AI-generated advice */}
      <Button
        colorScheme="teal"
        mt={6}
        w="full"
        onClick={fetchAdvice}
        isLoading={loadingAdvice}
        loadingText="Fetching Advice"
        size="lg"
        rounded="full"
        transition="all 0.2s"
        _hover={{ boxShadow: "xl", transform: "scale(1.05)" }}
      >
        Get Financial Advice
      </Button>

      {/* Display AI-generated advice */}
      <Box mt={8} p={6} bg={adviceBg} rounded="lg" boxShadow="sm">
        <HStack spacing={3} mb={4}>
          <Icon as={FaLightbulb} color="teal.500" boxSize={6} />
          <Heading size="md" color="teal.600">
            Financial Advice
          </Heading>
        </HStack>
        {loadingAdvice ? (
          <Spinner color="teal.500" size="lg" />
        ) : (
          advice.map((paragraph, index) => (
            <Text key={index} color="gray.800" mb={3}>
              {paragraph}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
};

export default ExpenseHighlights;
