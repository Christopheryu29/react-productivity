import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  Input,
  Progress,
  ChakraProvider,
  useToast,
  Spinner,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Flex,
  Tooltip,
  Icon,
  SlideFade,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Heading,
  Divider,
  useBreakpointValue,
} from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import * as tf from "@tensorflow/tfjs";
import { FaPiggyBank, FaCalendarAlt, FaChartPie } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { CSVLink } from "react-csv";

const SavingsTargetPrediction = () => {
  const [savingsTarget, setSavingsTarget] = useState<number>(0);
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [remainingSavings, setRemainingSavings] = useState<number | null>(null);
  const [monthlySuggestion, setMonthlySuggestion] = useState<number | null>(
    null
  );
  const [monthsLeft, setMonthsLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [isBehindTarget, setIsBehindTarget] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<string>("");
  const [spendingAnalysis, setSpendingAnalysis] = useState<string[]>([]);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const toast = useToast();
  const currentYear = new Date().getFullYear();

  const currentMonth = new Date().getMonth();
  const isDecember = currentMonth === 11;
  const targetYear = isDecember ? currentYear + 1 : currentYear;

  const userExpenses = useQuery(api.expense.getExpenses) || [];
  const userSavingsTarget = useQuery(api.target.getSavingsTarget, {
    year: targetYear,
  });

  const setSavingsTargetMutation = useMutation(api.target.setSavingsTarget);

  const userFinancialData =
    userExpenses?.map((expense) => ({
      month: new Date(expense.date).toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      totalIncome: expense.type === "income" ? expense.amount : 0,
      totalExpenses: expense.type === "expense" ? expense.amount : 0,
      expensesByCategory: expense.category
        ? { [expense.category]: expense.amount }
        : {},
    })) || [];

  const monthlySavings = userExpenses.reduce((savings, expense) => {
    const month = new Date(expense.date).getMonth();
    savings[month] =
      (savings[month] || 0) +
      (expense.type === "income" ? expense.amount : -expense.amount);
    return savings;
  }, Array(12).fill(0));
  // Simplify line chart to display savings per month
  const lineChartData = {
    labels: monthlySavings.map((_, index) => `Month ${index + 1}`),
    datasets: [
      {
        label: "Monthly Savings",
        data: monthlySavings,
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        pointBackgroundColor: "cyan",
        tension: 0.1,
      },
    ],
  };

  const calculateCurrentSavings = () => {
    if (!userFinancialData || userFinancialData.length === 0) return;
    const totalIncome = userFinancialData.reduce(
      (sum, data) => sum + data.totalIncome,
      0
    );
    const totalExpenses = userFinancialData.reduce(
      (sum, data) => sum + data.totalExpenses,
      0
    );
    setCurrentSavings(totalIncome - totalExpenses);
  };

  const calculateMonthsLeft = () => {
    const currentMonthIndex = currentMonth;
    setMonthsLeft(11 - currentMonthIndex);
  };

  useEffect(() => {
    setIsLoading(true);
    calculateCurrentSavings();
    calculateMonthsLeft();
    if (userSavingsTarget) {
      setSavingsTarget(userSavingsTarget.targetAmount);
    }
    setIsLoading(false);
  }, [userExpenses, userSavingsTarget]);

  const handleSavingsTargetChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const target = parseFloat(e.target.value);
    if (isNaN(target) || target <= 0) {
      setInputError(true);
    } else {
      setInputError(false);
      setSavingsTarget(target);
    }
  };

  const saveSavingsTarget = async () => {
    if (savingsTarget > 0) {
      setIsSaving(true);
      try {
        await setSavingsTargetMutation({
          targetAmount: savingsTarget,
          year: targetYear,
        });

        toast({
          title: "Savings target saved!",
          description: `Your target of $${savingsTarget} has been saved for ${targetYear}.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: "Error saving target",
          description:
            "There was an error saving your target. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({
        title: "Invalid target",
        description: "Savings target must be greater than 0.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const calculateSavingsSuggestion = () => {
    if (savingsTarget <= currentSavings) {
      setRemainingSavings(0);
      setMonthlySuggestion(0);
      setPredictionResult(
        "Congratulations! You have already met or exceeded your savings target."
      );
      setIsBehindTarget(false);
      toast({
        title: "Target Achieved!",
        description: "You have already reached your savings target.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      const remaining = savingsTarget - currentSavings;
      const suggestion = remaining / monthsLeft;
      setRemainingSavings(remaining);
      setMonthlySuggestion(suggestion);
      saveSavingsTarget();
      calculateAdvancedPrediction();
    }
  };

  const calculateAdvancedPrediction = async () => {
    const monthsPassed = userFinancialData.length;
    const monthlyNetSavings = userFinancialData.map(
      (data) => data.totalIncome - data.totalExpenses
    );

    const minSavings = Math.min(...monthlyNetSavings);
    const maxSavings = Math.max(...monthlyNetSavings);
    const normalizedSavings = monthlyNetSavings.map(
      (savings) => (savings - minSavings) / (maxSavings - minSavings)
    );

    const xValues = Array.from({ length: monthsPassed }, (_, i) => i + 1);
    const xTensor = tf.tensor2d(xValues, [xValues.length, 1]);
    const yTensor = tf.tensor2d(normalizedSavings, [
      normalizedSavings.length,
      1,
    ]);

    const model = tf.sequential();
    model.add(
      tf.layers.dense({ units: 64, activation: "relu", inputShape: [1] })
    );
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: "adam", loss: "meanSquaredError" });

    await model.fit(xTensor, yTensor, { epochs: 200, validationSplit: 0.2 });

    const nextMonth = monthsPassed + 1;
    const predictionTensor = tf.tensor2d([nextMonth], [1, 1]);
    const normalizedPrediction = model.predict(predictionTensor) as tf.Tensor;
    const predictedSavings =
      normalizedPrediction.dataSync()[0] * (maxSavings - minSavings) +
      minSavings;

    const projectedSavings = predictedSavings + currentSavings;

    const difference = projectedSavings - savingsTarget;

    if (difference >= 0) {
      if (difference >= savingsTarget * 0.1) {
        setPredictionResult(
          "You are likely to exceed your savings target by a significant margin. Excellent progress!"
        );
      } else {
        setPredictionResult(
          "You are currently on track to meet your savings target. Keep up the good work!"
        );
      }
      setIsBehindTarget(false);
    } else {
      const achievableWithMinorAdjustments =
        projectedSavings >= savingsTarget * 0.95;
      const achievableWithModerateAdjustments =
        projectedSavings >= savingsTarget * 0.8;

      if (achievableWithMinorAdjustments) {
        setPredictionResult(
          "The target is achievable with minor adjustments. Slightly increase your monthly savings to stay on track."
        );
      } else if (achievableWithModerateAdjustments) {
        setPredictionResult(
          "The target is achievable with moderate adjustments. Consider a more focused savings plan."
        );
      } else {
        setPredictionResult(
          "You are at risk of not meeting your target. Significant adjustments are recommended."
        );
      }
      setIsBehindTarget(true);
    }

    xTensor.dispose();
    yTensor.dispose();
    predictionTensor.dispose();
  };

  const csvHeaders = [
    { label: "Month", key: "month" },
    { label: "Income", key: "totalIncome" },
    { label: "Expenses", key: "totalExpenses" },
    { label: "Net Savings", key: "netSavings" },
    { label: "Cumulative Savings", key: "cumulativeSavings" },
    { label: "Expense Category", key: "topCategory" },
  ];

  let cumulativeSavings = 0;

  const csvData = userFinancialData.map((data) => {
    const netSavings = data.totalIncome - data.totalExpenses;
    cumulativeSavings += netSavings;

    // Example logic for top expense category (adjust based on your data structure)
    const categories = data.expensesByCategory || {};
    const topCategoryEntry = Object.entries(categories).reduce(
      (max, entry) => (entry[1] > max[1] ? entry : max),
      ["None", 0]
    );
    const [topCategory, topCategoryExpense] = topCategoryEntry;

    return {
      month: data.month,
      totalIncome: data.totalIncome,
      totalExpenses: data.totalExpenses,
      netSavings,
      cumulativeSavings,
      topCategory,
    };
  });

  if (isLoading) {
    return (
      <ChakraProvider>
        <VStack spacing={6} p={6}>
          <Spinner size="xl" />
          <Text>Loading financial data...</Text>
        </VStack>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <VStack
        spacing={6}
        p={10}
        rounded="2xl"
        boxShadow="2xl"
        mx="auto"
        align="stretch"
        textAlign="center"
        className="bg-gray-100 dark:bg-[radial-gradient(circle_at_center,_#303030_0%,_#34373f_25%,_#2f3246_50%,_#303030_100%)]"
      >
        <Heading
          letterSpacing="wide"
          size="lg"
          className="text-gray-800 dark:text-white"
          fontWeight="bold"
          mb={10}
          mt={4}
        >
          Savings Target Prediction
        </Heading>
        {/* December-Specific Enhancements */}
        {isDecember && (
          <>
            {/* Transition Alert */}
            <Alert
              status="info"
              rounded="lg"
              shadow="lg"
              mb={6}
              className="bg-gray-100 dark:bg-gray-700"
              color="white"
              px={6}
              py={5}
            >
              <AlertIcon boxSize="2rem" mr={4} color="white" />
              <Flex direction="column" flex="1">
                <AlertTitle
                  fontWeight="bold"
                  fontSize="lg"
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  🎯 Transition to Next Year
                </AlertTitle>
                <AlertDescription fontSize="md" lineHeight="1.6">
                  <Text>
                    You are setting a savings target for <strong>2025</strong>.
                    Reflect on your progress this year, celebrate your
                    achievements, and start preparing for a financially stronger
                    new year. 💪
                  </Text>
                </AlertDescription>
              </Flex>
            </Alert>

            {/* Current Year's Summary */}
            <Box
              className="bg-gray-100 dark:bg-gray-700"
              rounded="xl"
              p={6}
              shadow="md"
              textAlign="center"
              mb={6}
            >
              <Heading
                size="md"
                className="text-gray-800 dark:text-white"
                mb={4}
              >
                2024 Savings Summary
              </Heading>
              <Text
                fontSize="lg"
                className="text-gray-800 dark:text-white"
                mb={2}
              >
                Total Savings Achieved This Year
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="teal.300">
                ${currentSavings.toFixed(2)}
              </Text>
              <Divider borderColor="gray.600" my={3} />
              <Text
                fontSize="lg"
                className="text-gray-800 dark:text-white"
                mb={2}
              >
                Percentage of Target Achieved
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="cyan.400">
                {((currentSavings / savingsTarget) * 100).toFixed(2)}%
              </Text>
              <Box mt={6}>
                <Heading size="md" mb={6}>
                  Monthly Trend Analysis
                </Heading>
                <Line data={lineChartData} />
              </Box>
              <Divider borderColor="gray.600" my={3} />
              <Text fontSize="lg" className="text-gray-800 dark:text-white">
                Use this summary to guide your 2025 planning.
              </Text>
            </Box>

            {/* Spending Trends */}
            <Box
              bgGradient="linear(to-br, blue.50, blue.100, blue.200)"
              _dark={{ bgGradient: "linear(to-br, gray.800, gray.900)" }}
              rounded="xl"
              p={8}
              shadow="lg"
              textAlign="center"
              mb={6}
            >
              <Heading
                size="md"
                color="gray.800"
                _dark={{ color: "white" }}
                fontWeight="bold"
                letterSpacing="wide"
                mb={4}
              >
                📊 December Spending Insights
              </Heading>
              <Text
                fontSize="lg"
                color="gray.700"
                _dark={{ color: "gray.300" }}
                lineHeight="1.8"
                mb={4}
              >
                December tends to be a high-spending month due to holidays and
                year-end expenses. Here's a breakdown of your spending trends:
              </Text>

              {userExpenses.length > 0 ? (
                <>
                  {/* Spending Breakdown */}
                  <Box
                    maxH="200px"
                    overflowY="auto"
                    bg="white"
                    _dark={{ bg: "gray.800" }}
                    p={4}
                    rounded="lg"
                    shadow="md"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    {Object.entries(
                      userExpenses
                        .filter((expense) => {
                          const expenseDate = new Date(expense.date);
                          return expenseDate.getMonth() === 11; // December
                        })
                        .reduce<Record<string, number>>((acc, expense) => {
                          if (expense.type === "expense" && expense.category) {
                            acc[expense.category] =
                              (acc[expense.category] || 0) + expense.amount;
                          }
                          return acc;
                        }, {})
                    ).map(([category, amount]) => (
                      <Flex
                        key={category}
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color="gray.800"
                          _dark={{ color: "gray.200" }}
                        >
                          {category}
                        </Text>
                        <Text
                          fontSize="md"
                          fontWeight="bold"
                          color="blue.600"
                          _dark={{ color: "blue.300" }}
                        >
                          ${amount.toFixed(2)}
                        </Text>
                      </Flex>
                    ))}
                  </Box>
                </>
              ) : (
                <Text
                  fontSize="md"
                  color="gray.500"
                  _dark={{ color: "gray.400" }}
                  mt={4}
                >
                  No expenses recorded for December yet.
                </Text>
              )}

              <Text
                fontSize="md"
                mt={6}
                color="gray.700"
                _dark={{ color: "gray.300" }}
                lineHeight="1.6"
              >
                Use this breakdown to identify areas where you can reduce
                spending and plan your budget effectively for{" "}
                <strong>2025</strong>.
              </Text>
            </Box>
          </>
        )}
        <Box
          className="bg-gray-100 dark:bg-gray-700"
          rounded="xl"
          p={6}
          shadow="md"
        >
          <Text fontSize="lg" className="text-gray-800 dark:text-white">
            Current Savings this Year
          </Text>
          <Text fontSize="4xl" fontWeight="bold" color="green.400">
            ${currentSavings.toFixed(2)}
          </Text>
        </Box>

        <FormControl
          isInvalid={inputError}
          className="bg-gray-100 dark:bg-gray-700"
          p={5}
          rounded="xl"
          shadow="md"
          w="100%"
        >
          <FormLabel
            className="text-gray-800 dark:text-white"
            fontSize="lg"
            fontWeight="medium"
          >
            Set {isDecember ? "Next Year's" : "Annual"} Savings Target
            <Tooltip
              label={`Your savings goal for ${targetYear}`}
              fontSize="sm"
            >
              <InfoOutlineIcon ml={2} />
            </Tooltip>
          </FormLabel>
          <Input
            placeholder="Enter target amount"
            type="number"
            value={savingsTarget}
            color="white"
            onChange={handleSavingsTargetChange}
            className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md"
          />
          {inputError && (
            <FormErrorMessage>Invalid target amount.</FormErrorMessage>
          )}
        </FormControl>

        <Button
          bgGradient="linear(to-r, teal.400, cyan.500)"
          color="white"
          size={isMobile ? "md" : "lg"}
          fontSize={isMobile ? "sm" : "md"}
          px={isMobile ? 4 : 6}
          py={isMobile ? 3 : 4}
          _hover={{
            bgGradient: "linear(to-r, teal.500, cyan.600)",
            boxShadow:
              "0 0 10px rgba(56, 189, 248, 0.6), 0 0 20px rgba(56, 189, 248, 0.4)",
            transform: "scale(1.02)",
          }}
          _active={{
            bgGradient: "linear(to-r, teal.500, cyan.600)",
            transform: "scale(0.98)",
            boxShadow: "0 0 10px rgba(56, 189, 248, 0.4)",
          }}
          transition="all 0.3s ease-in-out"
          onClick={calculateSavingsSuggestion}
          isLoading={isSaving}
          w="100%"
          rounded="full"
          shadow="xl"
          fontWeight="bold"
        >
          Calculate Savings Suggestion for {targetYear}
        </Button>

        {remainingSavings !== null && (
          <SlideFade in>
            <Box
              className="bg-gray-100 dark:bg-gray-700"
              p={5}
              rounded="xl"
              shadow="lg"
              w="100%"
              textAlign="center"
            >
              <Text
                fontSize="lg"
                className="text-gray-800 dark:text-white"
                mb={1}
              >
                <Icon as={FaPiggyBank} color="cyan.400" mr={2} />
                {isDecember
                  ? "Additional Savings Needed for Next Year"
                  : "Additional Savings Needed"}
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="cyan.300" mb={4}>
                {isDecember
                  ? `$${savingsTarget.toFixed(2)}`
                  : `$${remainingSavings.toFixed(2)}`}
              </Text>

              {!isDecember ? (
                <>
                  <Divider borderColor="gray.600" my={3} />

                  <Text
                    fontSize="lg"
                    className="text-gray-800 dark:text-white"
                    mb={1}
                  >
                    <Icon as={FaCalendarAlt} color="cyan.400" mr={2} />
                    Suggested Monthly Savings
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="teal.300">
                    ${monthlySuggestion?.toFixed(2)} for {monthsLeft} months
                  </Text>
                </>
              ) : (
                <>
                  <Divider borderColor="gray.600" my={3} />

                  <Text
                    fontSize="lg"
                    className="text-gray-800 dark:text-white"
                    mb={1}
                  >
                    <Icon as={FaCalendarAlt} color="cyan.400" mr={2} />
                    Suggested Monthly Savings for Next Year
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="teal.300">
                    ${(savingsTarget / 12).toFixed(2)} for 12 months
                  </Text>
                </>
              )}
            </Box>
          </SlideFade>
        )}

        {predictionResult && (
          <Alert
            status={isBehindTarget ? "warning" : "success"}
            rounded="xl"
            bgGradient={
              isBehindTarget
                ? "linear(to-r, orange.500, red.500)"
                : "linear(to-r, teal.500, green.500)"
            }
            shadow="lg"
            color="whiteAlpha.900"
            p={5}
          >
            <AlertIcon
              boxSize="1.5em"
              color={isBehindTarget ? "orange.300" : "green.300"}
            />
            <Flex direction="column" ml={3} textAlign="left">
              <AlertTitle fontSize="lg" fontWeight="bold">
                {isBehindTarget ? "⚠️ Warning" : "✅ On Track"}
              </AlertTitle>
              <AlertDescription fontSize="md">
                {predictionResult}
              </AlertDescription>
            </Flex>
          </Alert>
        )}

        <SimpleGrid columns={1} spacing={4} w="100%">
          <Text fontSize="lg" color="cyan.400" fontWeight="bold" mb={3}>
            Spending Analysis
          </Text>
          {spendingAnalysis.map((analysis, index) => (
            <Box
              key={index}
              p={4}
              bgGradient="linear(to-br, gray.700 10%, gray.800 90%)"
              border="1px solid"
              borderColor="cyan.700"
              rounded="lg"
              shadow="lg"
              boxShadow="0px 4px 8px rgba(0, 0, 0, 0.4), 0px 8px 16px rgba(0, 0, 0, 0.2)"
              _hover={{
                transform: "scale(1.03)",
                transition: "all 0.3s ease-in-out",
              }}
            >
              <Flex align="center" justify="start">
                <Icon as={FaChartPie} color="cyan.300" boxSize={5} mr={3} />
                <Text
                  color="whiteAlpha.900"
                  fontSize="md"
                  fontWeight="medium"
                  lineHeight="1.5"
                >
                  {analysis}
                </Text>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>

        <Box w="100%">
          <Text fontSize="lg" className="text-gray-800 dark:text-white" mb={2}>
            Progress towards Goal
          </Text>
          <Progress
            bgGradient="linear(to-r, teal.500, green.400)"
            size="lg"
            value={(currentSavings / savingsTarget) * 100}
            hasStripe
            isAnimated
            rounded="full"
          />
          <Text
            mt={3}
            fontSize="md"
            className="text-gray-800 dark:text-white"
            textAlign="center"
          >
            You are{" "}
            <Text as="span" color="cyan.400" fontWeight="bold">
              {((currentSavings / savingsTarget) * 100).toFixed(2)}%
            </Text>{" "}
            towards your goal. Blue color represents your savings progress.
          </Text>
        </Box>
        <Box mb={6}>
          <Heading size="md" mb={4}>
            Exportable Reports
          </Heading>
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename="financial_summary.csv"
            className="btn btn-primary"
          >
            Download Financial Summary as CSV
          </CSVLink>
        </Box>
      </VStack>
    </ChakraProvider>
  );
};

export default SavingsTargetPrediction;
