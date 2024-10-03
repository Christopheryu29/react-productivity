"use client"; // Import necessary librariesimport React, { useEffect, useState } from 'react';
import React, { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import {
  Box,
  Button,
  Text,
  VStack,
  useToast,
  ChakraProvider,
  Heading,
  CircularProgress,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react";
import { useAction, useMutation, useQuery } from "convex/react";
import WeeklySummary from "../budgettracker/components/WeeklySummary";
import { api } from "@/convex/_generated/api";
import MonthlySummary from "../budgettracker/components/MonthlySummary";

type Tensor = tf.Tensor;
type Sequential = tf.Sequential;
type FinancialData = {
  numAdults: number;
  numChildren: number;
  housing_cost: number;
  food_cost: number;
  transportation_cost: number;
  healthcare_cost: number;
  other_necessities_cost: number;
  childcare_cost: number;
  taxes: number;
  total_cost: number;
  median_family_income: number;
};

interface WeeklyTotals {
  week: string;
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

interface WeeklyTotalsAggregate {
  [week: string]: {
    totalIncome: number;
    totalExpenses: number;
    incomeByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
  };
}

interface MonthlyTotals {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

interface Expense {
  id: number;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
}

interface MonthlyTotals {
  month: string;
  totalIncome: number;
  totalExpenses: number;
}

interface MonthlyTotalsAggregate {
  [month: string]: {
    totalIncome: number;
    totalExpenses: number;
    incomeByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
  };
}

interface CategoryTotals {
  [key: string]: number;
  housing_cost: number;
  food_cost: number;
  transportation_cost: number;
  healthcare_cost: number;
  other_necessities_cost: number;
  childcare_cost: number;
  taxes: number;
}

const normalizeTensor = (tensor: Tensor): Tensor => {
  const min = tensor.min();
  const max = tensor.max();
  const range = max.sub(min).add(1e-5); // Adding a small constant to the range to prevent division by zero
  return tensor.sub(min).div(range);
};

const parseCsvDataToTensors = async (csvData: string) => {
  const rows = csvData.trim().split("\n").slice(1);
  const data = rows.map((row) => {
    const cols = row
      .split(",")
      .map((num, index) => {
        if (index === 1) {
          // Custom parsing for a specific column
          const matches = num.match(/(\d+)p(\d+)c/);
          return matches
            ? [parseFloat(matches[1]), parseFloat(matches[2])]
            : [0, 0];
        }
        return parseFloat(num);
      })
      .flat();
    return {
      features: cols.slice(1, cols.length - 1),
      label: cols[cols.length - 1],
    };
  });

  // Filter out rows with NaN values
  const filteredData = data.filter(
    (d) => !d.features.some(isNaN) && !isNaN(d.label)
  );

  // Map to tensors
  const features = filteredData.map((d) => d.features);
  const labels = filteredData.map((d) => d.label);

  const featureTensor = tf.tensor2d(features);
  const labelTensor = tf.tensor1d(labels);

  return {
    inputs: normalizeTensor(featureTensor),
    labels: normalizeTensor(labelTensor),
  };
};

// Adjusted data validity check
const checkDataValidity = (features: number[][], labels: number[]) => {
  const featureTensor = tf.tensor2d(features);
  const labelTensor = tf.tensor1d(labels);

  if (
    featureTensor.any().isNaN().dataSync()[0] ||
    labelTensor.any().isNaN().dataSync()[0]
  ) {
    console.error("Data contains NaN values.");
    featureTensor.dispose();
    labelTensor.dispose();
    throw new Error("Invalid data detected");
  }

  return { featureTensor, labelTensor };
};

const loadData = async () => {
  const response = await fetch("./dataset_low.csv");
  const csvData = await response.text();
  return parseCsvDataToTensors(csvData);
};

const defineModel = (numFeatures: number): Sequential => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [numFeatures],
      units: 50,
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );
  model.add(
    tf.layers.dense({
      units: 100,
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );
  model.add(tf.layers.dense({ units: 1, activation: "linear" }));
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "meanSquaredError",
    metrics: ["mse"],
  });
  return model;
};

const trainModel = async (
  model: Sequential,
  inputs: Tensor,
  labels: Tensor
) => {
  return model.fit(inputs, labels, {
    epochs: 50,
    validationSplit: 0.2,
    callbacks: [tf.callbacks.earlyStopping({ patience: 10 })],
  });
};
const handlePredictClick = async (
  model: Sequential,
  inputData: Tensor
): Promise<number> => {
  if (!model) {
    throw new Error("Model not loaded");
  }

  const prediction = model.predict(inputData) as Tensor;
  const predictionValues = await prediction.data();
  console.log("Prediction Values:", predictionValues);

  if (
    !predictionValues ||
    predictionValues.length === 0 ||
    Number.isNaN(predictionValues[0])
  ) {
    throw new Error("No valid prediction values returned");
  }

  return predictionValues[0];
};
const calculateWeeklyTotals = (expenses: Expense[]): WeeklyTotals[] => {
  const getWeekNumber = (date: Date): string => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
    );
    return `Week ${weekNumber} ${date.getFullYear()}`;
  };

  const totals = expenses.reduce<WeeklyTotalsAggregate>((acc, curr) => {
    const weekYear = getWeekNumber(new Date(curr.date));
    if (!acc[weekYear]) {
      acc[weekYear] = {
        totalIncome: 0,
        totalExpenses: 0,
        incomeByCategory: {},
        expensesByCategory: {},
      };
    }
    if (curr.type === "income") {
      acc[weekYear].totalIncome += curr.amount;
      acc[weekYear].incomeByCategory[curr.category] =
        (acc[weekYear].incomeByCategory[curr.category] || 0) + curr.amount;
    } else {
      acc[weekYear].totalExpenses += curr.amount;
      acc[weekYear].expensesByCategory[curr.category] =
        (acc[weekYear].expensesByCategory[curr.category] || 0) + curr.amount;
    }
    return acc;
  }, {});

  return Object.keys(totals).map((week) => ({
    week,
    totalIncome: totals[week].totalIncome,
    totalExpenses: totals[week].totalExpenses,
    incomeByCategory: totals[week].incomeByCategory,
    expensesByCategory: totals[week].expensesByCategory,
  }));
};

const calculateMonthlyTotals = (expenses: Expense[]): MonthlyTotals[] => {
  const totals = expenses.reduce((acc: any, curr: Expense) => {
    const monthYear = new Date(curr.date).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    if (!acc[monthYear]) {
      acc[monthYear] = {
        totalIncome: 0,
        totalExpenses: 0,
        incomeByCategory: {},
        expensesByCategory: {},
      };
    }
    if (curr.type === "income") {
      acc[monthYear].totalIncome += curr.amount;
      acc[monthYear].incomeByCategory[curr.category] =
        (acc[monthYear].incomeByCategory[curr.category] || 0) + curr.amount;
    } else {
      acc[monthYear].totalExpenses += curr.amount;
      acc[monthYear].expensesByCategory[curr.category] =
        (acc[monthYear].expensesByCategory[curr.category] || 0) + curr.amount;
    }
    return acc;
  }, {});

  return Object.keys(totals).map((month) => ({
    month,
    totalIncome: totals[month].totalIncome,
    totalExpenses: totals[month].totalExpenses,
    incomeByCategory: totals[month].incomeByCategory,
    expensesByCategory: totals[month].expensesByCategory,
  }));
};

const FinancialHealthComponent = () => {
  const fetchExpenses = useQuery(api.expense.getExpenses);

  const [model, setModel] = useState<Sequential | null>(null);
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const setHouseholdMutation = useMutation(api.household.setHousehold);
  const userId = "your-user-id";
  const financialData = useQuery(api.financial.getFinancialSummary, { userId });
  const [numAdults, setNumAdults] = useState<number>(0);
  const [numChildren, setNumChildren] = useState<number>(0);
  const householdData = useQuery(api.household.getHouseholdByUserId, {
    userId,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [weeklyTotals, setWeeklyTotals] = useState<WeeklyTotals[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);

  useEffect(() => {
    if (householdData) {
      console.log("Household data loaded:", householdData);
      // Here you can set state or perform actions based on the household data
    }
  }, [householdData]);
  useEffect(() => {
    if (fetchExpenses) {
      const validatedExpenses = fetchExpenses.map((expense: any) => ({
        ...expense,
        type:
          expense.type === "income" || expense.type === "expense"
            ? expense.type
            : "expense",
      }));
      setExpenses(validatedExpenses);
    }
  }, [fetchExpenses]);

  // Calculate weekly totals whenever expenses are updated
  useEffect(() => {
    if (expenses.length > 0) {
      setWeeklyTotals(calculateWeeklyTotals(expenses));
      setMonthlyTotals(calculateMonthlyTotals(expenses)); // Calculate and set monthly totals
    }
  }, [expenses]);

  useEffect(() => {
    loadData().then(({ inputs, labels }) => {
      if (inputs.shape.length < 2) {
        console.error("Input tensor shape is incomplete or incorrect.");
        toast({
          title: "Data Error",
          description: "Input tensor shape is incomplete or incorrect.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return; // Exit if the shape is not correct
      }

      const numFeatures = inputs.shape[1];
      if (typeof numFeatures !== "number") {
        console.error("Number of features is undefined.");
        toast({
          title: "Initialization Error",
          description:
            "Could not determine the number of features from the input data.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return; // Exit if numFeatures is undefined
      }

      const model = defineModel(numFeatures);
      trainModel(model, inputs, labels).then(() => {
        setModel(model);
      });
    });
  }, []);

  const calculateFinancialHealth = (data: FinancialData): string => {
    const {
      numAdults,
      numChildren,
      housing_cost,
      food_cost,
      transportation_cost,
      healthcare_cost,
      other_necessities_cost,
      childcare_cost,
      taxes,
      total_cost,
      median_family_income,
    } = data;

    // Calculate expense to income ratio
    const expenseRatio = total_cost / median_family_income;

    // Additional financial metrics might consider number of dependents
    const dependentFactor = 1 + 0.3 * numChildren; // Increasing the threshold by 30% per child

    // Define thresholds for scoring based on adjusted expense ratio
    let score: string;
    if (expenseRatio < 0.5 * dependentFactor) {
      score = "Excellent";
    } else if (expenseRatio < 0.7 * dependentFactor) {
      score = "Good";
    } else if (expenseRatio < 0.85 * dependentFactor) {
      score = "Fair";
    } else {
      score = "Poor";
    }

    return score;
  };

  const evaluateExpenses = (data: FinancialData) => {
    const suggestions = [];
    const {
      housing_cost,
      food_cost,
      transportation_cost,
      healthcare_cost,
      other_necessities_cost,
      childcare_cost,
      taxes,
      median_family_income,
    } = data;

    // Define thresholds as percentages of median income
    const thresholds = {
      housing: 0.3, // Housing should not exceed 30% of income
      food: 0.15, // Food should not exceed 15% of income
      transportation: 0.15,
      healthcare: 0.1,
      other_necessities: 0.1,
      childcare: 0.1, // Adjust based on typical childcare costs in your area
      taxes: 0.25, // Taxes are generally a fixed percentage but can be adjusted
    };

    if (housing_cost > thresholds.housing * median_family_income) {
      suggestions.push("Housing costs are too high.");
    }
    if (food_cost > thresholds.food * median_family_income) {
      suggestions.push("Food costs are too high.");
    }
    if (
      transportation_cost >
      thresholds.transportation * median_family_income
    ) {
      suggestions.push("Transportation costs are too high.");
    }
    if (healthcare_cost > thresholds.healthcare * median_family_income) {
      suggestions.push("Healthcare costs are too high.");
    }
    if (
      other_necessities_cost >
      thresholds.other_necessities * median_family_income
    ) {
      suggestions.push("Other necessities are too high.");
    }
    if (childcare_cost > thresholds.childcare * median_family_income) {
      suggestions.push("Childcare costs are too high.");
    }
    if (taxes > thresholds.taxes * median_family_income) {
      suggestions.push("Tax liability is too high.");
    }

    return suggestions;
  };
  const getAdvice = useAction(api.openai.doSomething);
  const [financialAdvice, setFinancialAdvice] = useState("");

  const [financialHealth, setFinancialHealth] = useState("");
  const [expenseSuggestions, setExpenseSuggestions] = useState("");

  useEffect(() => {
    loadData().then(({ inputs, labels }) => {
      const numFeatures = inputs.shape[1];
      if (numFeatures) {
        const model = defineModel(numFeatures);
        trainModel(model, inputs, labels).then(() => setModel(model));
      }
    });
  }, []);

  const onClickPredict = async () => {
    if (!model) {
      toast({
        title: "Model Error",
        description: "Prediction model is not loaded yet.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!financialData || !householdData) {
      toast({
        title: "Data Error",
        description: "Financial or household data is not loaded.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = {
        numAdults: householdData.numAdults,
        numChildren: householdData.numChildren,
        housing_cost: financialData.housingCost,
        food_cost: financialData.foodCost,
        transportation_cost: financialData.transportationCost,
        healthcare_cost: financialData.healthcareCost,
        other_necessities_cost: financialData.otherNecessitiesCost,
        childcare_cost: financialData.childcareCost || 0, // Assuming it could be undefined/null
        taxes: financialData.taxes,
        total_cost: financialData.totalExpenses,
        median_family_income: financialData.medianFamilyIncome,
      };

      const healthScore = calculateFinancialHealth(data);
      const suggestions = evaluateExpenses(data);
      setFinancialHealth(healthScore);
      setExpenseSuggestions(
        suggestions.join(" ") || "All expenses are within acceptable limits."
      );

      const adviceQuery = `
      Given our household's financial details—${
        householdData.numAdults
      } adults and ${
        householdData.numChildren
      } children—with a housing cost of $${data.housing_cost.toFixed(
        2
      )}, food cost of $${data.food_cost.toFixed(2)}, 
      transportation cost of $${data.transportation_cost.toFixed(
        2
      )}, healthcare cost of $${data.healthcare_cost.toFixed(2)}, 
      costs for other necessities at $${data.other_necessities_cost.toFixed(
        2
      )}, childcare expenses of $${data.childcare_cost.toFixed(2)}, 
      and taxes of $${data.taxes.toFixed(
        2
      )}, totaling $${data.total_cost.toFixed(
        2
      )} in expenses against a median family income of $${data.median_family_income.toFixed(
        2
      )}—
      how can we optimize our budget to improve our financial health status from '${healthScore}'? 
      What specific strategies would you recommend for reducing expenses and enhancing savings, particularly in areas where we are overspending? 
      Additionally, are there adjustments we should consider in our investment strategy to secure our long-term financial stability?
    `;

      const adviceResult = await getAdvice({ query: adviceQuery });
      setFinancialAdvice(adviceResult || "No advice available at this moment.");
    } catch (error) {
      console.error("Error during prediction:", error);
      toast({
        title: "Prediction Error",
        description:
          "An error occurred during the financial health prediction.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }

    setIsLoading(false);
  };

  const saveHousehold = async () => {
    // Placeholder for userId - you might be fetching this from a user context or auth context
    const userId = "your-user-id"; // Replace this with actual user ID fetching logic
    await setHouseholdMutation({
      userId,
      numAdults,
      numChildren,
    });
    toast({
      title: "Household Information Saved",
      description:
        "The number of adults and children has been updated successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <ChakraProvider>
      <VStack spacing={8} align="stretch" p={4}>
        <Box
          p={5}
          shadow="md"
          borderWidth="1px"
          color={"white"}
          flex="1"
          borderRadius="md"
        >
          <Heading color={"white"} fontSize="xl">
            Financial Health Dashboard
          </Heading>
          {isLoading ? (
            <CircularProgress isIndeterminate color="green.300" />
          ) : (
            <Text mt={4} color={"white"}>
              {model ? "Model is ready and trained." : "Model is loading..."}
            </Text>
          )}
        </Box>
        <WeeklySummary weeklyTotals={weeklyTotals} />
        <MonthlySummary monthlyTotals={monthlyTotals} />

        <Box p={5} shadow="md" borderWidth="1px" bg="white" borderRadius="md">
          <Heading size="md" mb={4} color={"gray.800"}>
            Household Information
          </Heading>
          {householdData ? (
            <Text color={"gray.800"}>
              Number of Adults: {householdData.numAdults}, Number of Children:{" "}
              {householdData.numChildren}
            </Text>
          ) : (
            <Text color={"gray.800"}>Loading household information...</Text>
          )}
        </Box>

        <Box boxShadow="lg" p={5} rounded="md" bg="white">
          <Heading size="md" mb={4} color={"gray.800"}>
            Financial Summary
          </Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Category</Th>
                <Th>Amount ($)</Th>
              </Tr>
            </Thead>
            <Tbody>
              {financialData && (
                <>
                  <Tr>
                    <Td>Housing Cost</Td>
                    <Td isNumeric>{financialData.housingCost.toFixed(2)}</Td>
                  </Tr>
                  <Tr>
                    <Td>Food Cost</Td>
                    <Td isNumeric>{financialData.foodCost.toFixed(2)}</Td>
                  </Tr>
                  <Tr>
                    <Td>Transportation Cost</Td>
                    <Td isNumeric>
                      {financialData.transportationCost.toFixed(2)}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td>Healthcare Cost</Td>
                    <Td isNumeric>{financialData.healthcareCost.toFixed(2)}</Td>
                  </Tr>
                  <Tr>
                    <Td>Other Necessities Cost</Td>
                    <Td isNumeric>
                      {financialData.otherNecessitiesCost.toFixed(2)}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td>Childcare Cost</Td>
                    <Td isNumeric>{financialData.childcareCost.toFixed(2)}</Td>
                  </Tr>
                  <Tr>
                    <Td>Taxes</Td>
                    <Td isNumeric>{financialData.taxes.toFixed(2)}</Td>
                  </Tr>
                  <Tr>
                    <Td>Total Expenses</Td>
                    <Td isNumeric>{financialData.totalExpenses.toFixed(2)}</Td>
                  </Tr>
                  <Tr>
                    <Td>Median Family Income</Td>
                    <Td isNumeric>
                      {financialData.medianFamilyIncome.toFixed(2)}
                    </Td>
                  </Tr>
                </>
              )}
            </Tbody>
          </Table>
        </Box>

        <Button
          isLoading={isLoading}
          loadingText="Calculating"
          colorScheme="teal"
          onClick={onClickPredict}
          isDisabled={!model}
        >
          Check Financial Health
        </Button>

        {!isLoading && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            bg="white"
            flex="1"
            borderRadius="md"
          >
            <Text fontSize="lg" color={"gray.800"} mb={2}>
              Financial Health: <strong>{financialHealth}</strong>
            </Text>
            <Text fontSize="lg" color={"gray.800"} mb={2}>
              Expense Analysis: {expenseSuggestions}
            </Text>
            <Accordion allowToggle>
              <AccordionItem>
                <h2>
                  <AccordionButton
                    _expanded={{ bg: "teal.100", color: "teal.800" }}
                  >
                    <Box
                      flex="1"
                      textAlign="left"
                      fontSize="lg"
                      fontWeight="bold"
                    >
                      View Detailed Advice
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4} color={"gray.800"}>
                  {financialAdvice}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
        )}
      </VStack>
    </ChakraProvider>
  );
};

export default FinancialHealthComponent;
