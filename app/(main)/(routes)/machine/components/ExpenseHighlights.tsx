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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react";
import { api } from "@/convex/_generated/api";
import {
  MdWarning,
  MdCheckCircle,
  MdInfoOutline,
  MdCalendarViewWeek,
  MdDateRange,
  MdOutlineDateRange,
} from "react-icons/md";
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
      rounded="xl"
      bgGradient="radial-gradient(circle at center, #303030 0%, #34373f 25%, #2f3246 50%, #303030 100%)"
      transition="all 0.3s"
      _hover={{ boxShadow: "lg", transform: "scale(1.001)" }}
    >
      <CriticalPeriods
        criticalWeeks={criticalWeeks}
        criticalMonths={criticalMonths}
        criticalYears={criticalYears}
      />

      <HStack spacing={4} mb={8} align="center">
        <Box
          bgGradient="linear(to-br, #3a5f7d, #4a81a0)"
          p={3}
          rounded="full"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          marginTop="3rem"
          marginLeft="1rem"
        >
          <Icon as={AiOutlineDollar} color="white" boxSize={6} />
        </Box>

        <Heading
          size={headingSize}
          color="whiteAlpha.900"
          fontWeight="bold"
          textShadow="1px 1px 5px rgba(0, 0, 0, 0.6)"
          letterSpacing="wider"
          marginTop="3rem"
          style={{
            filter: "brightness(1.2)",
          }}
        >
          Expense Highlights
        </Heading>
      </HStack>

      <VStack align="start" spacing={10} w="100%">
        {/* Collapsible Weekly Highlights */}
        <Accordion allowMultiple w="100%">
          <AccordionItem border="none">
            <h2>
              <AccordionButton
                _expanded={{
                  bg: "linear(to-br, teal.500, blue.500)",
                  color: "white",
                }}
                p={4}
                rounded="md"
                transition="all 0.3s ease"
                _hover={{ boxShadow: "lg" }}
              >
                <HStack spacing={4} flex="1" textAlign="left">
                  <Box
                    bgGradient="linear(to-br, teal.500, blue.500)"
                    p={3}
                    rounded="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="lg"
                  >
                    <Icon as={MdCalendarViewWeek} color="white" boxSize={6} />
                  </Box>
                  <Heading size="lg" fontWeight="bold">
                    Weekly Highlights
                  </Heading>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {sortedWeeks.map((week, index) => {
                const expensePercentage = parseFloat(
                  calculateExpensePercentage(
                    week.totalExpenses,
                    week.totalIncome
                  )
                );
                const colorScheme = getColorScheme(expensePercentage);

                return (
                  <Box
                    key={index}
                    w="100%"
                    p={6}
                    mb={6}
                    bgGradient="linear(to-br, #1a202c, #2d3748)"
                    rounded="2xl"
                    boxShadow="0 8px 24px rgba(0, 0, 0, 0.3)"
                    borderLeft="6px solid"
                    borderColor={`${colorScheme.badge}.500`}
                    _hover={{
                      transform: "scale(1.03)",
                      boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)",
                    }}
                    transition="all 0.3s ease"
                  >
                    <HStack justify="space-between" mb={3}>
                      <Heading
                        size="md"
                        color="whiteAlpha.900"
                        fontWeight="bold"
                      >
                        {week.week}
                      </Heading>
                      <Badge
                        variant="solid"
                        colorScheme={colorScheme.badge}
                        px={3}
                        py={1}
                        rounded="lg"
                        boxShadow="sm"
                        fontWeight="bold"
                        display="flex"
                        alignItems="center"
                      >
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

                    <Stack mt={4} spacing={3}>
                      <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        color={`${colorScheme.text}.300`}
                      >
                        Total Expenses: ${week.totalExpenses.toFixed(2)}{" "}
                        <Badge
                          colorScheme={colorScheme.badge}
                          px={2}
                          py={1}
                          rounded="full"
                          fontSize="sm"
                          fontWeight="bold"
                        >
                          {expensePercentage}% of Income
                        </Badge>
                      </Text>

                      <Text color="whiteAlpha.800" fontSize="md">
                        Total Income:{" "}
                        <Badge
                          variant="outline"
                          colorScheme="blue"
                          fontSize="md"
                          px={2}
                          py={1}
                          rounded="full"
                          fontWeight="bold"
                        >
                          ${week.totalIncome.toFixed(2)}
                        </Badge>
                      </Text>

                      <Divider
                        borderColor={`${colorScheme.badge}.300`}
                        opacity={0.4}
                        marginTop="1rem"
                      />

                      {/* Display category warnings with icons */}
                      {getCategoryWarnings(
                        week.expensesByCategory,
                        week.totalIncome,
                        weeklyThresholds
                      ).map((warning, i) => (
                        <HStack
                          key={i}
                          spacing={2}
                          color="orange.300"
                          alignItems="center"
                        >
                          <Icon as={MdWarning} boxSize={5} />
                          <Text fontWeight="medium">{warning}</Text>
                        </HStack>
                      ))}

                      {/* Display weekly evaluations with bullet points and icons */}
                      {weeklyEvaluations[index].map((evaluation, i) => (
                        <HStack
                          key={i}
                          spacing={2}
                          color="purple.300"
                          alignItems="center"
                        >
                          <Icon as={FaLightbulb} boxSize={5} />
                          <Text fontWeight="medium">{evaluation}</Text>
                        </HStack>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </AccordionPanel>
          </AccordionItem>

          {/* Collapsible Monthly Highlights */}
          <AccordionItem border="none" mt={6}>
            <h2>
              <AccordionButton
                _expanded={{
                  bg: "linear(to-br, teal.500, blue.500)",
                  color: "white",
                }}
                p={4}
                rounded="md"
                transition="all 0.3s ease"
                _hover={{ boxShadow: "lg" }}
              >
                <HStack spacing={4} flex="1" textAlign="left">
                  <Box
                    bgGradient="linear(to-br, teal.500, blue.500)"
                    p={3}
                    rounded="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="lg"
                  >
                    <Icon as={MdDateRange} color="white" boxSize={6} />
                  </Box>
                  <Heading size="lg" fontWeight="bold">
                    Monthly Highlights
                  </Heading>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {sortedMonths.map((month, index) => {
                const expensePercentage = parseFloat(
                  calculateExpensePercentage(
                    month.totalExpenses,
                    month.totalIncome
                  )
                );
                const colorScheme = getColorScheme(expensePercentage);

                return (
                  <Box
                    key={index}
                    w="100%"
                    p={6}
                    mb={6}
                    bgGradient="linear(to-br, #1a202c, #2d3748)"
                    rounded="2xl"
                    boxShadow="0 8px 24px rgba(0, 0, 0, 0.3)"
                    borderLeft="6px solid"
                    borderColor={`${colorScheme.badge}.500`}
                    _hover={{
                      transform: "scale(1.03)",
                      boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)",
                    }}
                    transition="all 0.3s ease"
                  >
                    <HStack justify="space-between" mb={3}>
                      <Heading
                        size="md"
                        color="whiteAlpha.900"
                        fontWeight="bold"
                      >
                        Month {month.month}
                      </Heading>
                      <Badge
                        variant="solid"
                        colorScheme={colorScheme.badge}
                        px={3}
                        py={1}
                        rounded="lg"
                        boxShadow="sm"
                        fontWeight="bold"
                        display="flex"
                        alignItems="center"
                      >
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

                    <Stack mt={4} spacing={3}>
                      <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        color={`${colorScheme.text}.300`}
                      >
                        Total Expenses: ${month.totalExpenses.toFixed(2)}{" "}
                        <Badge
                          colorScheme={colorScheme.badge}
                          px={2}
                          py={1}
                          rounded="full"
                          fontSize="sm"
                          fontWeight="bold"
                        >
                          {expensePercentage}% of Income
                        </Badge>
                      </Text>

                      <Text color="whiteAlpha.800" fontSize="md">
                        Total Income:{" "}
                        <Badge
                          variant="outline"
                          colorScheme="blue"
                          fontSize="md"
                          px={2}
                          py={1}
                          rounded="full"
                          fontWeight="bold"
                        >
                          ${month.totalIncome.toFixed(2)}
                        </Badge>
                      </Text>

                      <Divider
                        borderColor={`${colorScheme.badge}.300`}
                        opacity={0.4}
                        marginTop="1rem"
                      />

                      {/* Corrected category warnings for monthly data */}
                      {getCategoryWarnings(
                        month.expensesByCategory,
                        month.totalIncome,
                        weeklyThresholds
                      ).map((warning, i) => (
                        <HStack
                          key={i}
                          spacing={2}
                          color="orange.300"
                          alignItems="center"
                        >
                          <Icon as={MdWarning} boxSize={5} />
                          <Text fontWeight="medium">{warning}</Text>
                        </HStack>
                      ))}

                      {/* Monthly evaluations */}
                      {monthlyEvaluations[index].map((evaluation, i) => (
                        <HStack
                          key={i}
                          spacing={2}
                          color="purple.300"
                          alignItems="center"
                        >
                          <Icon as={FaLightbulb} boxSize={5} />
                          <Text fontWeight="medium">{evaluation}</Text>
                        </HStack>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </AccordionPanel>
          </AccordionItem>

          {/* Collapsible Yearly Highlights */}
          <AccordionItem border="none" mt={6}>
            <h2>
              <AccordionButton
                _expanded={{
                  bg: "linear(to-br, teal.500, blue.500)",
                  color: "white",
                }}
                p={4}
                rounded="md"
                transition="all 0.3s ease"
                _hover={{ boxShadow: "lg" }}
              >
                <HStack spacing={4} flex="1" textAlign="left">
                  <Box
                    bgGradient="linear(to-br, teal.500, blue.500)"
                    p={3}
                    rounded="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="lg"
                  >
                    <Icon as={MdOutlineDateRange} color="white" boxSize={6} />
                  </Box>
                  <Heading size="lg" fontWeight="bold">
                    Yearly Highlights
                  </Heading>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {sortedYears.map((year, index) => {
                const expensePercentage = parseFloat(
                  calculateExpensePercentage(
                    year.totalExpenses,
                    year.totalIncome
                  )
                );
                const colorScheme = getColorScheme(expensePercentage);

                return (
                  <Box
                    key={index}
                    w="100%"
                    p={6}
                    mb={6}
                    bgGradient="linear(to-br, #1a202c, #2d3748)"
                    rounded="2xl"
                    boxShadow="0 8px 24px rgba(0, 0, 0, 0.3)"
                    borderLeft="6px solid"
                    borderColor={`${colorScheme.badge}.500`}
                    _hover={{
                      transform: "scale(1.03)",
                      boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)",
                    }}
                    transition="all 0.3s ease"
                  >
                    <HStack justify="space-between" mb={3}>
                      <Heading
                        size="md"
                        color="whiteAlpha.900"
                        fontWeight="bold"
                      >
                        Year {year.year}
                      </Heading>
                      <Badge
                        variant="solid"
                        colorScheme={colorScheme.badge}
                        px={3}
                        py={1}
                        rounded="lg"
                        boxShadow="sm"
                        fontWeight="bold"
                        display="flex"
                        alignItems="center"
                      >
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

                    <Stack mt={4} spacing={3}>
                      <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        color={`${colorScheme.text}.300`}
                      >
                        Total Expenses: ${year.totalExpenses.toFixed(2)}{" "}
                        <Badge
                          colorScheme={colorScheme.badge}
                          px={2}
                          py={1}
                          rounded="full"
                          fontSize="sm"
                          fontWeight="bold"
                        >
                          {expensePercentage}% of Income
                        </Badge>
                      </Text>

                      <Text color="whiteAlpha.800" fontSize="md">
                        Total Income:{" "}
                        <Badge
                          variant="outline"
                          colorScheme="blue"
                          fontSize="md"
                          px={2}
                          py={1}
                          rounded="full"
                          fontWeight="bold"
                        >
                          ${year.totalIncome.toFixed(2)}
                        </Badge>
                      </Text>

                      <Divider
                        borderColor={`${colorScheme.badge}.300`}
                        opacity={0.4}
                        marginTop="1rem"
                      />

                      {/* Corrected category warnings for yearly data */}
                      {getCategoryWarnings(
                        year.expensesByCategory,
                        year.totalIncome,
                        weeklyThresholds
                      ).map((warning, i) => (
                        <HStack
                          key={i}
                          spacing={2}
                          color="orange.300"
                          alignItems="center"
                        >
                          <Icon as={MdWarning} boxSize={5} />
                          <Text fontWeight="medium">{warning}</Text>
                        </HStack>
                      ))}

                      {/* Yearly evaluations */}
                      {yearlyEvaluations[index].map((evaluation, i) => (
                        <HStack
                          key={i}
                          spacing={2}
                          color="purple.300"
                          alignItems="center"
                        >
                          <Icon as={FaLightbulb} boxSize={5} />
                          <Text fontWeight="medium">{evaluation}</Text>
                        </HStack>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>

      {/* Button to fetch AI-generated advice */}
      <VStack
        spacing="4"
        align="stretch"
        bg="transparent"
        p="4"
        borderRadius="lg"
        boxShadow="md"
      >
        <Button
          mt={6}
          w="full"
          onClick={fetchAdvice}
          isLoading={loadingAdvice}
          loadingText="Fetching Advice"
          size="lg"
          rounded="full"
          bgGradient="linear(to-r, #3a3d5e, #4a81a0)" // Enhanced gradient with deep blues
          color="white"
          fontWeight="bold"
          fontSize="xl"
          transition="all 0.3s ease"
          _hover={{
            bgGradient: "linear(to-r, #4b5d7a, #5b9bb5)",
            transform: "scale(1.05)",
            boxShadow:
              "0 8px 20px rgba(0, 0, 0, 0.25), 0px 0px 12px rgba(75, 93, 122, 0.6)",
          }}
          _active={{
            transform: "scale(0.98)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          Get Financial Advice
        </Button>
      </VStack>

      {/* Display AI-generated advice */}
      <Box
        mt={8}
        p={6}
        bgGradient="radial-gradient(circle at center, #303030 0%, #34373f 25%, #2f3246 50%, #303030 100%)" // Darker, more sophisticated gradient
        rounded="2xl"
        boxShadow="0px 6px 25px rgba(0, 0, 0, 0.4), 0px 0px 15px rgba(39, 48, 70, 0.5)"
      >
        <HStack spacing={4} mb={4} align="center">
          <Box
            bgGradient="linear(to-br, #5b9bb5, #4b5d7a)"
            p={3}
            rounded="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0px 0px 12px rgba(75, 93, 122, 0.5)"
          >
            <Icon as={FaLightbulb} color="white" boxSize={5} />
          </Box>
          <Heading
            size="lg"
            color="whiteAlpha.900"
            fontWeight="bold"
            textShadow="0px 0px 8px rgba(0, 0, 0, 0.4)"
          >
            Financial Advice
          </Heading>
        </HStack>

        {loadingAdvice ? (
          <Spinner color="teal.300" size="lg" />
        ) : (
          advice.map((paragraph, index) => (
            <Text
              key={index}
              color="whiteAlpha.800"
              mb={3}
              fontSize="lg"
              lineHeight="1.8"
              letterSpacing="wider"
            >
              {paragraph}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
};

export default ExpenseHighlights;
