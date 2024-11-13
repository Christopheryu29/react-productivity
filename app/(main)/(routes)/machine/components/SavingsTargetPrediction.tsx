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

// Define the structure for user financial data
interface FinancialData {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  expensesByCategory?: Record<string, number>;
}

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
  const [financialHealthScore, setFinancialHealthScore] = useState<
    number | null
  >(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const toast = useToast();
  const currentYear = new Date().getFullYear();

  const currentMonth = new Date().getMonth();
  const isDecember = currentMonth === 11;
  const targetYear = isDecember ? currentYear + 1 : currentYear;

  // Fetch financial data and user savings target from the backend
  const userExpenses = useQuery(api.expense.getExpenses) || [];
  const userSavingsTarget = useQuery(api.target.getSavingsTarget, {
    year: targetYear,
  });

  const setSavingsTargetMutation = useMutation(api.target.setSavingsTarget);

  // Map the financial data
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
    const currentMonthIndex = currentMonth; // 0 = January, 11 = December
    // Calculate months remaining in the current year
    setMonthsLeft(11 - currentMonthIndex); // 11 represents December
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
    // Process monthly data into training sets
    const monthsPassed = userFinancialData.length;
    const monthlyNetSavings = userFinancialData.map(
      (data) => data.totalIncome - data.totalExpenses
    );

    // Normalize the data to scale within a range (e.g., -1 to 1)
    const minSavings = Math.min(...monthlyNetSavings);
    const maxSavings = Math.max(...monthlyNetSavings);
    const normalizedSavings = monthlyNetSavings.map(
      (savings) => (savings - minSavings) / (maxSavings - minSavings)
    );

    // Prepare input (months) and output (normalized net savings) tensors
    const xValues = Array.from({ length: monthsPassed }, (_, i) => i + 1);
    const xTensor = tf.tensor2d(xValues, [xValues.length, 1]);
    const yTensor = tf.tensor2d(normalizedSavings, [
      normalizedSavings.length,
      1,
    ]);

    // Build a more complex model with additional layers and dropout regularization
    const model = tf.sequential();
    model.add(
      tf.layers.dense({ units: 64, activation: "relu", inputShape: [1] })
    );
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: "adam", loss: "meanSquaredError" });

    // Train the model
    await model.fit(xTensor, yTensor, { epochs: 200, validationSplit: 0.2 });

    // Predict for the upcoming months
    const nextMonth = monthsPassed + 1;
    const predictionTensor = tf.tensor2d([nextMonth], [1, 1]);
    const normalizedPrediction = model.predict(predictionTensor) as tf.Tensor;
    const predictedSavings =
      normalizedPrediction.dataSync()[0] * (maxSavings - minSavings) +
      minSavings;

    // Calculate projected total savings
    const projectedSavings = predictedSavings + currentSavings;

    // Refined messages based on projected savings compared to target
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

    // Clean up tensors
    xTensor.dispose();
    yTensor.dispose();
    predictionTensor.dispose();
  };

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
          size={isMobile ? "md" : "lg"} // Adjust size based on screen size
          fontSize={isMobile ? "sm" : "md"} // Smaller font size for mobile
          px={isMobile ? 4 : 6} // Smaller padding on mobile
          py={isMobile ? 3 : 4} // Adjust padding for mobile
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
                Additional Savings Needed
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="cyan.300" mb={4}>
                ${remainingSavings.toFixed(2)}
              </Text>

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
      </VStack>
    </ChakraProvider>
  );
};

export default SavingsTargetPrediction;
