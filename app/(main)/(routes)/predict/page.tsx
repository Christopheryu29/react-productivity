"use client";
import React, { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api"; // Ensure this is correctly pointing to your generated API client
import {
  Box,
  Button,
  Text,
  VStack,
  Progress,
  Input,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";

// Function to simulate the parsing of CSV data and conversion to tensors
const parseCsvDataToTensors = (
  csvData: string
): { inputs: tf.Tensor; labels: tf.Tensor } => {
  const data = csvData.split("\n").map((line) => {
    const parts = line.split(",").map((x) => parseFloat(x.trim()));
    return {
      features: parts.slice(0, -1),
      label: parts[parts.length - 1],
    };
  });

  // Convert feature arrays to tensor
  const inputs = tf.tensor2d(data.map((item) => item.features));

  // Convert label indices to one-hot encoded labels
  const labels = tf.oneHot(
    data.map((item) => item.label),
    3
  );

  return { inputs, labels };
};

// Function to load and preprocess data
const loadData = async (): Promise<{
  inputs: tf.Tensor;
  labels: tf.Tensor;
}> => {
  try {
    const response = await fetch("/dataset.csv");
    if (!response.ok) throw new Error("Failed to fetch data");
    const csvData = await response.text();
    console.log("Data fetched:", csvData.slice(0, 100)); // Log first 100 chars of data
    return parseCsvDataToTensors(csvData);
  } catch (error) {
    console.error("Error loading data:", error);
    throw error; // Re-throw to ensure further processing is halted
  }
};

// Function to define the model
const defineModel = (numFeatures: number): tf.Sequential => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [numFeatures], // This should match the number of features in your data
      units: 50,
      activation: "relu",
    })
  );
  model.add(tf.layers.dense({ units: 100, activation: "relu" }));
  model.add(tf.layers.dense({ units: 3, activation: "softmax" })); // Assuming 3 categories
  return model;
};

// Function to train the model
const trainModel = async (
  model: tf.Sequential,
  data: { inputs: tf.Tensor; labels: tf.Tensor }
) => {
  try {
    model.compile({
      optimizer: tf.train.adam(),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    console.log("Starting model training");
    const response = await model.fit(data.inputs, data.labels, {
      epochs: 50,
      validationSplit: 0.2,
      callbacks: tf.callbacks.earlyStopping({ patience: 10 }),
    });
    console.log("Model training complete");
    return response;
  } catch (error) {
    console.error("Error during model training:", error);
    throw error; // Ensure errors are not silently ignored
  }
};

interface Expense {
  id: number;
  amount: number;
  type: "income" | "expense" | "savings"; // Updated to include "savings"
  date: string;
  category: string;
}

interface MonthlyTotals {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number; // Added totalSavings to track savings
}

const FinancialHealth = () => {
  const [query, setQuery] = useState("");
  const [advice, setAdvice] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);

  const fetchExpenses = useQuery(api.expense.getExpenses);

  useEffect(() => {
    if (fetchExpenses) {
      const validatedExpenses = fetchExpenses.map((expense: any) => ({
        ...expense,
        type:
          expense.type === "income" ||
          expense.type === "expense" ||
          expense.type === "savings"
            ? expense.type
            : "expense", // Ensuring 'savings' is recognized
      }));
      setExpenses(validatedExpenses);
    }
  }, [fetchExpenses]);

  useEffect(() => {
    const now = new Date();
    const lastReset = localStorage.getItem("lastReset");
    if (!lastReset || new Date(lastReset).getMonth() !== now.getMonth()) {
      resetMonthlyTotals();
      localStorage.setItem("lastReset", now.toISOString());
    }
  }, []);

  const resetMonthlyTotals = () => {
    const now = new Date();
    const monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;

    const totalIncome = expenses
      .filter((exp) => exp.type === "income")
      .reduce((acc, exp) => acc + exp.amount, 0);
    const totalExpenses = expenses
      .filter((exp) => exp.type === "expense")
      .reduce((acc, exp) => acc + exp.amount, 0);
    const totalSavings = expenses
      .filter((exp) => exp.type === "savings")
      .reduce((acc, exp) => acc + exp.amount, 0); // Calculate total savings

    const newMonthlyTotals = [
      ...monthlyTotals,
      { month: monthYear, totalIncome, totalExpenses, totalSavings },
    ];
    setMonthlyTotals(newMonthlyTotals);
    setExpenses([]);
  };

  const totalExpenses = expenses.reduce(
    (acc, expense) => (expense.type === "expense" ? acc + expense.amount : acc),
    0
  );
  const totalIncome = expenses.reduce(
    (acc, expense) => (expense.type === "income" ? acc + expense.amount : acc),
    0
  );
  const totalSavings = expenses.reduce(
    (acc, expense) => (expense.type === "savings" ? acc + expense.amount : acc),
    0
  ); // Added to calculate total savings separately

  const currentBalance = totalIncome - totalExpenses - totalSavings;

  const getAdvice = useAction(api.openai.doSomething); // Use action from generated API

  const handleAdviceRequest = async () => {
    if (query) {
      const result = await getAdvice({ query });
      setAdvice(result || "No advice available at this moment."); // Provide a default message in case of null
    }
  };
  const numFeatures = 10; // Set this to 10 if you confirm your data has 10 features
  const [model, setModel] = useState<tf.Sequential | null>(null);

  // Inside your React component or training script
  useEffect(() => {
    async function prepareModel() {
      try {
        const data = await loadData();
        const model = defineModel(10); // assuming 10 features as determined earlier
        await trainModel(model, data);
        setModel(model);
      } catch (error) {
        console.error("Failed to prepare model:", error);
      }
    }
    prepareModel();
  }, []);

  return (
    <VStack spacing={4} p={5} color={"white"}>
      <Box
        p={5}
        shadow="md"
        borderWidth="1px"
        borderRadius="lg"
        color={"white"}
      >
        <Text fontSize="xl" mb={2} color={"white"}>
          Financial Summary
        </Text>
        <Text color={"white"}>Total Income: ${totalIncome}</Text>
        <Text color={"white"}>Total Expenses: ${totalExpenses}</Text>
        <Text color={"white"}>Total Savings: ${totalSavings}</Text>
        <Text color={"white"}>Current Balance: ${currentBalance}</Text>
      </Box>

      {model && (
        <Box
          p={5}
          shadow="md"
          borderWidth="1px"
          borderRadius="lg"
          color={"white"}
        >
          <Text fontSize="xl" mb={2} color={"white"}>
            AI Model Status
          </Text>
          <Text color={"white"}>Model is ready and trained.</Text>
        </Box>
      )}

      {!model && (
        <Box
          p={5}
          shadow="md"
          borderWidth="1px"
          borderRadius="lg"
          color={"white"}
        >
          <Text fontSize="xl" mb={2} color={"white"}>
            AI Model Status
          </Text>
          <Text color={"white"}>Model is loading...</Text>
        </Box>
      )}
    </VStack>
  );
};

export default FinancialHealth;
