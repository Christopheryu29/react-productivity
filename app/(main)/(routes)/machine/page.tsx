"use client"; // Import necessary libraries
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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react";
import { useAction, useMutation, useQuery } from "convex/react";
import WeeklySummary from "../budgettracker/components/WeeklySummary";
import MonthlySummary from "../budgettracker/components/MonthlySummary";
import { api } from "@/convex/_generated/api";
import PredictionButton from "./components/PredictionButton";
import FinancialHealthHeader from "./components/FinancialHealthHeader";
import ExpenseHighlights from "./components/ExpenseHighlights";
import YearlySummary from "../budgettracker/components/YearlySummary";

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

interface MonthlyTotals {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

interface YearlyTotals {
  year: string;
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

const calculateYearlyTotals = (expenses: Expense[]): YearlyTotals[] => {
  const totals = expenses.reduce<Record<string, YearlyTotals>>((acc, curr) => {
    const year = new Date(curr.date).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = {
        year,
        totalIncome: 0,
        totalExpenses: 0,
        incomeByCategory: {},
        expensesByCategory: {},
      };
    }
    if (curr.type === "income") {
      acc[year].totalIncome += curr.amount;
      acc[year].incomeByCategory[curr.category] =
        (acc[year].incomeByCategory[curr.category] || 0) + curr.amount;
    } else {
      acc[year].totalExpenses += curr.amount;
      acc[year].expensesByCategory[curr.category] =
        (acc[year].expensesByCategory[curr.category] || 0) + curr.amount;
    }
    return acc;
  }, {});

  return Object.values(totals);
};

const normalizeTensor = (tensor: Tensor): Tensor => {
  const min = tensor.min();
  const max = tensor.max();
  const range = max.sub(min).add(1e-5);
  return tensor.sub(min).div(range);
};

const parseCsvDataToTensors = async (csvData: string) => {
  const rows = csvData.trim().split("\n").slice(1);
  const data = rows.map((row) => {
    const cols = row
      .split(",")
      .map((num, index) => {
        if (index === 1) {
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

  const filteredData = data.filter(
    (d) => !d.features.some(isNaN) && !isNaN(d.label)
  );

  const features = filteredData.map((d) => d.features);
  const labels = filteredData.map((d) => d.label);

  const featureTensor = tf.tensor2d(features);
  const labelTensor = tf.tensor1d(labels);

  return {
    inputs: normalizeTensor(featureTensor),
    labels: normalizeTensor(labelTensor),
  };
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

  const totals = expenses.reduce<Record<string, WeeklyTotals>>((acc, curr) => {
    const weekYear = getWeekNumber(new Date(curr.date));
    if (!acc[weekYear]) {
      acc[weekYear] = {
        week: weekYear,
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

  return Object.values(totals);
};

const calculateMonthlyTotals = (expenses: Expense[]): MonthlyTotals[] => {
  const totals = expenses.reduce<Record<string, MonthlyTotals>>((acc, curr) => {
    const monthYear = new Date(curr.date).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    if (!acc[monthYear]) {
      acc[monthYear] = {
        month: monthYear,
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

  return Object.values(totals);
};

const getMaxExpenseCategory = (expensesByCategory: Record<string, number>) => {
  return Object.entries(expensesByCategory).reduce(
    (max, current) => (current[1] > max[1] ? current : max),
    ["", 0]
  );
};

const findMaxExpensePeriod = (
  totals: {
    totalIncome: number; // Add this property
    totalExpenses: number;
    expensesByCategory: Record<string, number>;
    week?: string;
    month?: string;
  }[]
) => {
  return totals.reduce(
    (max, current) =>
      current.totalExpenses > max.totalExpenses ? current : max,
    {
      totalIncome: 0,
      totalExpenses: 0,
      expensesByCategory: {},
      week: "",
      month: "",
    }
  );
};

const evaluateHighExpenses = (totals: {
  expensesByCategory: Record<string, number>;
}) => {
  const [maxCategory, maxAmount] = getMaxExpenseCategory(
    totals.expensesByCategory
  );
  return `The highest expense category is ${maxCategory} with a total of $${maxAmount.toFixed(
    2
  )}. Consider reducing costs in this category.`;
};

// Improved Expense Highlights Section
const thresholds = {
  housing: 0.3, // Housing should not exceed 30% of income
  food: 0.15, // Food should not exceed 15% of income
  transportation: 0.15,
  healthcare: 0.1,
  other_necessities: 0.1,
  childcare: 0.1, // Adjust based on typical childcare costs in your area
  taxes: 0.25, // Taxes are generally a fixed percentage but can be adjusted
};

const FinancialHealthComponent = () => {
  const fetchExpenses = useQuery(api.expense.getExpenses);
  const toast = useToast();
  const userId = "your-user-id"; // Replace with actual userId

  const householdData = useQuery(api.household.getHouseholdByUserId, {
    userId,
  });

  const [model, setModel] = useState<Sequential | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [weeklyTotals, setWeeklyTotals] = useState<WeeklyTotals[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);
  const [financialHealth, setFinancialHealth] = useState("");
  const [expenseSuggestions, setExpenseSuggestions] = useState("");
  const [financialAdvice, setFinancialAdvice] = useState("");

  // Find the week and month with the highest expenses
  const maxExpenseWeek = findMaxExpensePeriod(weeklyTotals);
  const maxExpenseMonth = findMaxExpensePeriod(monthlyTotals);

  // Get suggestions based on the highest expense categories
  const weeklyExpenseSuggestion = maxExpenseWeek.expensesByCategory
    ? evaluateHighExpenses(maxExpenseWeek)
    : "";

  const monthlyExpenseSuggestion = maxExpenseMonth.expensesByCategory
    ? evaluateHighExpenses(maxExpenseMonth)
    : "";

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

  // Calculate weekly and monthly totals whenever expenses are updated
  useEffect(() => {
    if (expenses.length > 0) {
      setWeeklyTotals(calculateWeeklyTotals(expenses));
      setMonthlyTotals(calculateMonthlyTotals(expenses));
    }
  }, [expenses]);

  useEffect(() => {
    loadData().then(({ inputs, labels }) => {
      const numFeatures = inputs.shape[1];
      if (numFeatures) {
        const model = defineModel(numFeatures);
        trainModel(model, inputs, labels).then(() => setModel(model));
      }
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

    if (!yearlyTotals || yearlyTotals.length === 0 || !householdData) {
      toast({
        title: "Data Error",
        description: "Yearly financial data or household data is not loaded.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const currentYearData = yearlyTotals[0];
      const data = {
        numAdults: householdData.numAdults,
        numChildren: householdData.numChildren,
        housing_cost: currentYearData.expensesByCategory["housing_cost"] || 0,
        food_cost: currentYearData.expensesByCategory["food_cost"] || 0,
        transportation_cost:
          currentYearData.expensesByCategory["transportation_cost"] || 0,
        healthcare_cost:
          currentYearData.expensesByCategory["healthcare_cost"] || 0,
        other_necessities_cost:
          currentYearData.expensesByCategory["other_necessities_cost"] || 0,
        childcare_cost:
          currentYearData.expensesByCategory["childcare_cost"] || 0,
        taxes: currentYearData.expensesByCategory["taxes"] || 0,
        total_cost: currentYearData.totalExpenses,
        median_family_income: currentYearData.totalIncome,
      };

      const healthScore = calculateFinancialHealth(data);
      const suggestions = evaluateExpenses(data);
      setFinancialHealth(healthScore);
      setExpenseSuggestions(
        suggestions.join(" ") || "All expenses are within acceptable limits."
      );

      const adviceQuery = `
      Given our household's financial details for ${
        currentYearData.year
      }, with a housing cost of $${data.housing_cost.toFixed(
        2
      )}, food cost of $${data.food_cost.toFixed(2)}, 
      transportation cost of $${data.transportation_cost.toFixed(
        2
      )}, healthcare cost of $${data.healthcare_cost.toFixed(2)}, 
      other necessities at $${data.other_necessities_cost.toFixed(
        2
      )}, childcare expenses of $${data.childcare_cost.toFixed(2)}, 
      and taxes of $${data.taxes.toFixed(
        2
      )}, totaling $${data.total_cost.toFixed(
        2
      )} in expenses against a total income of $${data.median_family_income.toFixed(
        2
      )}. How can we optimize our budget to improve our financial health?
    `;

      const adviceResult = await getAdvice({ query: adviceQuery });

      // Check if `adviceResult` is `null` or empty
      if (!adviceResult) {
        setFinancialAdvice("No advice available at this moment.");
        return;
      }

      // Process the response to remove '**' and format lines
      const formattedAdvice = adviceResult
        .split("\n")
        .map((line) => line.replace(/\*\*/g, "").trim())
        .filter((line) => line.length > 0);

      setFinancialAdvice(formattedAdvice.join("\n"));
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

  const weeklyThresholds = {
    food_cost: 0.15,
    housing_cost: 0.3,
    transportation_cost: 0.15,
    healthcare_cost: 0.1,
    other_necessities_cost: 0.1,
    taxes: 0.25,
  };

  const thresholds = {
    housing: 0.3,
    food_cost: 0.15,
    transportation: 0.15,
    healthcare: 0.1,
    other_necessities: 0.1,
    childcare: 0.1,
    taxes: 0.25,
  };

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

  useEffect(() => {
    if (expenses.length > 0) {
      setWeeklyTotals(calculateWeeklyTotals(expenses));
      setMonthlyTotals(calculateMonthlyTotals(expenses));
    }
  }, [expenses]);

  const getCategoryWarnings = (
    expensesByCategory: Record<string, number>,
    income: number,
    thresholds: Record<string, number>
  ) => {
    const warnings: string[] = [];

    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      const recommendedPercentage =
        thresholds[category as keyof typeof thresholds];
      const actualPercentage = (amount / income) * 100;

      if (
        recommendedPercentage &&
        actualPercentage > recommendedPercentage * 100
      ) {
        warnings.push(
          `Your ${category} expenses are ${actualPercentage.toFixed(
            1
          )}% of your income, exceeding the recommended ${(
            recommendedPercentage * 100
          ).toFixed(1)}%. Consider reducing your ${category} expenses.`
        );
      }
    });

    return warnings;
  };

  const [yearlyTotals, setYearlyTotals] = useState<YearlyTotals[]>([]);

  useEffect(() => {
    if (expenses.length > 0) {
      // Calculate yearly totals from `expenses`
      const yearlyData = calculateYearlyTotals(expenses);
      setYearlyTotals(yearlyData);
    }
  }, [expenses]);

  return (
    <ChakraProvider>
      <VStack spacing={8} align="stretch" p={4}>
        <FinancialHealthHeader isLoading={isLoading} model={model} />
        <WeeklySummary weeklyTotals={weeklyTotals} />
        <MonthlySummary monthlyTotals={monthlyTotals} />
        <YearlySummary yearlyTotals={yearlyTotals} />
        <PredictionButton
          isLoading={isLoading}
          onClickPredict={onClickPredict}
          model={model}
        />

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
                  <Text whiteSpace="pre-wrap">{financialAdvice}</Text>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
        )}
        <ExpenseHighlights
          allWeeks={weeklyTotals}
          allMonths={monthlyTotals}
          allYears={yearlyTotals} // Add this line to pass the yearly data
          weeklyThresholds={weeklyThresholds}
          thresholds={thresholds}
          getCategoryWarnings={getCategoryWarnings}
        />
      </VStack>
    </ChakraProvider>
  );
};

export default FinancialHealthComponent;
