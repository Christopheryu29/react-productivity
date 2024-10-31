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
} from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import * as tf from "@tensorflow/tfjs";

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

  const toast = useToast();
  const currentYear = new Date().getFullYear();
  const userId = "exampleUserId"; // Replace with dynamic user ID from authentication

  // Fetch financial data and user savings target from the backend
  const userExpenses = useQuery(api.expense.getExpenses) || [];
  const userSavingsTarget = useQuery(api.target.getSavingsTarget, {
    year: currentYear,
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

  // Calculate total income and expenses for the current year
  const calculateCurrentSavings = () => {
    if (!userFinancialData || userFinancialData.length === 0) return;
    const totalIncome = userFinancialData.reduce(
      (sum: number, data: FinancialData) => sum + data.totalIncome,
      0
    );
    const totalExpenses = userFinancialData.reduce(
      (sum: number, data: FinancialData) => sum + data.totalExpenses,
      0
    );
    setCurrentSavings(totalIncome - totalExpenses);
  };

  const calculateMonthsLeft = () => {
    const currentMonthIndex = new Date().getMonth();
    setMonthsLeft(12 - (currentMonthIndex + 1));
  };

  // Function to analyze spending by category
  const analyzeSpending = () => {
    const expenseCategories: Record<string, number> = {};

    userExpenses.forEach((expense: any) => {
      if (expense.type === "expense") {
        expenseCategories[expense.category] =
          (expenseCategories[expense.category] || 0) + expense.amount;
      }
    });

    const sortedCategories = Object.entries(expenseCategories).sort(
      (a, b) => b[1] - a[1]
    );

    const analysis = sortedCategories.map(
      ([category, amount]) =>
        `You have spent $${amount.toFixed(2)} on ${category}.`
    );

    setSpendingAnalysis(analysis);
  };

  useEffect(() => {
    setIsLoading(true);
    calculateCurrentSavings();
    calculateMonthsLeft();
    analyzeSpending();
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
          year: currentYear,
        });

        toast({
          title: "Savings target saved!",
          description: `Your target of $${savingsTarget} has been saved.`,
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
      // If the savings target is already met or exceeded
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
      // If the savings target is not yet met, calculate the remaining savings needed
      const remaining = savingsTarget - currentSavings;
      const suggestion = remaining / monthsLeft;
      setRemainingSavings(remaining);
      setMonthlySuggestion(suggestion);
      saveSavingsTarget();
      calculateAdvancedPrediction(); // Trigger AI/ML Logic only if needed
    }
  };

  const calculateAdvancedPrediction = async () => {
    if (savingsTarget <= currentSavings) {
      // If target is already met, skip the prediction and notify user
      setPredictionResult(
        "Congratulations! You have already met or exceeded your savings target."
      );
      setIsBehindTarget(false);
      return;
    }

    const monthsPassed = 12 - monthsLeft;

    const xValues = Array.from({ length: monthsPassed }, (_, i) => i + 1);
    const yValues = userFinancialData
      .filter((data, index) => index < monthsPassed)
      .map((data) => data.totalIncome - data.totalExpenses);

    const xTensor = tf.tensor2d(xValues, [xValues.length, 1]);
    const yTensor = tf.tensor2d(yValues, [yValues.length, 1]);

    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    model.compile({ optimizer: "sgd", loss: "meanSquaredError" });

    await model.fit(xTensor, yTensor, { epochs: 100 });

    const nextMonth = monthsPassed + 1;
    const predictionTensor = tf.tensor2d([nextMonth], [1, 1]);

    const prediction = model.predict(predictionTensor);
    let predictedSavings;

    if (Array.isArray(prediction)) {
      predictedSavings = prediction[0].dataSync()[0];
    } else {
      predictedSavings = (prediction as tf.Tensor).dataSync()[0];
    }

    if (predictedSavings + currentSavings < savingsTarget) {
      setPredictionResult(
        "Based on advanced analysis, you are at risk of not meeting your target."
      );
      setIsBehindTarget(true);
    } else {
      setPredictionResult(
        "Advanced analysis shows you're likely to meet your target."
      );
      setIsBehindTarget(false);
    }

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
      <VStack spacing={6} p={6}>
        <Text fontSize="xl" color={"white"}>
          Your current savings so far this year: ${currentSavings.toFixed(2)}
        </Text>

        <FormControl isInvalid={inputError}>
          <FormLabel color="white">
            Enter your savings target for the year
            <Tooltip
              label="This is the amount you aim to save this year."
              fontSize="md"
            >
              <InfoOutlineIcon ml={2} />
            </Tooltip>
          </FormLabel>
          <Input
            placeholder="Enter savings target"
            type="number"
            value={savingsTarget}
            color={"white"}
            onChange={handleSavingsTargetChange}
          />
          {inputError && (
            <FormErrorMessage>Invalid target amount.</FormErrorMessage>
          )}
        </FormControl>

        <Button
          colorScheme="teal"
          onClick={calculateSavingsSuggestion}
          isLoading={isSaving}
        >
          Calculate Savings Suggestion
        </Button>

        {/* Display Remaining Savings and Monthly Suggestions */}
        {remainingSavings !== null && (
          <SlideFade in>
            <Box>
              <Text fontSize="lg" color={"white"}>
                You need to save ${remainingSavings.toFixed(2)} more to reach
                your goal.
              </Text>
              <Text fontSize="lg" color={"white"}>
                Suggested monthly savings for the remaining {monthsLeft} months:
                ${monthlySuggestion?.toFixed(2)}
              </Text>
            </Box>
          </SlideFade>
        )}

        {/* AI/ML Prediction Result */}
        {predictionResult && (
          <Alert status={isBehindTarget ? "error" : "success"}>
            <AlertIcon />
            <Flex direction="column">
              <AlertTitle>
                {isBehindTarget ? "Risk Alert" : "On Track!"}
              </AlertTitle>
              <AlertDescription>{predictionResult}</AlertDescription>
            </Flex>
          </Alert>
        )}

        {/* Spending Analysis */}
        <SimpleGrid columns={1} spacing={4} width="100%">
          <Text fontSize="lg" color="white">
            Spending Analysis:
          </Text>
          {spendingAnalysis.map((analysis, index) => (
            <Text key={index} color="white">
              {analysis}
            </Text>
          ))}
        </SimpleGrid>

        {/* Savings Progress Bar */}
        <Box width="100%">
          <Text fontSize="lg" color="white" mb={2}>
            Progress toward goal:
          </Text>
          <Progress
            colorScheme="teal"
            size="lg"
            value={(currentSavings / savingsTarget) * 100}
            hasStripe
            isAnimated
          />
        </Box>
      </VStack>
    </ChakraProvider>
  );
};

export default SavingsTargetPrediction;
