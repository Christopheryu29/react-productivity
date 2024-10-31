// machine/components/MonthlyPrediction.tsx
import React, { useEffect, useState, useCallback } from "react";
import { VStack, Text, Button, Spinner, Heading } from "@chakra-ui/react";
import * as tf from "@tensorflow/tfjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface MonthlyData {
  date: string;
  income: number;
  expenses: number;
}

const MonthlyPrediction: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [incomeModel, setIncomeModel] = useState<tf.LayersModel | null>(null);
  const [expenseModel, setExpenseModel] = useState<tf.LayersModel | null>(null);
  const [predictedIncome, setPredictedIncome] = useState<number | null>(null);
  const [predictedExpenses, setPredictedExpenses] = useState<number | null>(
    null
  );
  const expenses = useQuery(api.expense.getExpenses);

  const SEQUENCE_LENGTH = 6; // Using last 6 months data for prediction

  const prepareMonthlyData = (
    expenses: any[]
  ): { income: number[]; expenses: number[] } => {
    const monthlyData: MonthlyData[] = [];

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
      const dataIndex = monthlyData.findIndex(
        (data) => data.date === monthYear
      );

      if (dataIndex === -1) {
        monthlyData.push({
          date: monthYear,
          income: expense.type === "income" ? expense.amount : 0,
          expenses: expense.type === "expense" ? expense.amount : 0,
        });
      } else {
        if (expense.type === "income") {
          monthlyData[dataIndex].income += expense.amount;
        } else {
          monthlyData[dataIndex].expenses += expense.amount;
        }
      }
    });

    console.log("Debug - Monthly Data:", monthlyData);

    return {
      income: monthlyData.map((data) => data.income),
      expenses: monthlyData.map((data) => data.expenses),
    };
  };

  const createSequences = (data: number[], sequenceLength: number) => {
    const sequences = [];
    for (let i = 0; i < data.length - sequenceLength; i++) {
      sequences.push(data.slice(i, i + sequenceLength + 1));
    }
    return sequences;
  };

  const normalizeData = (data: number[], min: number, max: number) => {
    return data.map((value) => (value - min) / (max - min));
  };

  const denormalizeValue = (value: number, min: number, max: number) => {
    return value * (max - min) + min;
  };

  const initializeModel = useCallback(async () => {
    setIsLoading(true);

    if (expenses) {
      const { income, expenses: expenseValues } = prepareMonthlyData(expenses);

      const incomeMin = Math.min(...income);
      const incomeMax = Math.max(...income);
      const expenseMin = Math.min(...expenseValues);
      const expenseMax = Math.max(...expenseValues);

      console.log("Debug - Income Min:", incomeMin, "Income Max:", incomeMax);
      console.log(
        "Debug - Expense Min:",
        expenseMin,
        "Expense Max:",
        expenseMax
      );

      const normalizedIncome = normalizeData(income, incomeMin, incomeMax);
      const normalizedExpenses = normalizeData(
        expenseValues,
        expenseMin,
        expenseMax
      );

      const incomeSequences = createSequences(
        normalizedIncome,
        SEQUENCE_LENGTH
      );
      const expenseSequences = createSequences(
        normalizedExpenses,
        SEQUENCE_LENGTH
      );

      const inputIncome = incomeSequences.map((seq) =>
        seq.slice(0, SEQUENCE_LENGTH)
      );
      const outputIncome = incomeSequences.map((seq) => seq[SEQUENCE_LENGTH]);

      const inputExpenses = expenseSequences.map((seq) =>
        seq.slice(0, SEQUENCE_LENGTH)
      );
      const outputExpenses = expenseSequences.map(
        (seq) => seq[SEQUENCE_LENGTH]
      );

      const incomeTensor = tf.tensor2d(inputIncome);
      const incomeLabels = tf.tensor1d(outputIncome);
      const expenseTensor = tf.tensor2d(inputExpenses);
      const expenseLabels = tf.tensor1d(outputExpenses);

      const createDenseModel = () => {
        const model = tf.sequential();
        model.add(
          tf.layers.dense({
            units: 20,
            inputShape: [SEQUENCE_LENGTH],
            activation: "relu",
          })
        );
        model.add(tf.layers.dropout({ rate: 0.2 })); // Dropout to prevent overfitting
        model.add(tf.layers.dense({ units: 20, activation: "relu" }));
        model.add(tf.layers.dense({ units: 1 }));
        model.compile({
          optimizer: tf.train.adam(0.001),
          loss: "meanSquaredError",
        });
        return model;
      };

      const incomeModel = createDenseModel();
      const expenseModel = createDenseModel();

      const trainModel = async (
        model: tf.LayersModel,
        inputs: tf.Tensor2D,
        labels: tf.Tensor1D
      ) => {
        const earlyStopping = tf.callbacks.earlyStopping({
          patience: 10,
          minDelta: 0.001,
        });
        return model.fit(inputs, labels, {
          epochs: 150,
          validationSplit: 0.2,
          callbacks: earlyStopping,
        });
      };

      await trainModel(incomeModel, incomeTensor, incomeLabels);
      await trainModel(expenseModel, expenseTensor, expenseLabels);

      setIncomeModel(incomeModel);
      setExpenseModel(expenseModel);

      incomeTensor.dispose();
      incomeLabels.dispose();
      expenseTensor.dispose();
      expenseLabels.dispose();
    }
    setIsLoading(false);
  }, [expenses]);

  useEffect(() => {
    initializeModel();
  }, [initializeModel]);

  const makePrediction = () => {
    if (!incomeModel || !expenseModel || !expenses) return;
    setIsLoading(true);

    const { income, expenses: expenseValues } = prepareMonthlyData(expenses);
    const incomeMin = Math.min(...income);
    const incomeMax = Math.max(...income);
    const expenseMin = Math.min(...expenseValues);
    const expenseMax = Math.max(...expenseValues);

    const lastIncomeSequence = normalizeData(
      income.slice(-SEQUENCE_LENGTH),
      incomeMin,
      incomeMax
    );
    const lastExpenseSequence = normalizeData(
      expenseValues.slice(-SEQUENCE_LENGTH),
      expenseMin,
      expenseMax
    );

    const incomePredictionTensor = incomeModel.predict(
      tf.tensor2d([lastIncomeSequence])
    ) as tf.Tensor;
    const expensePredictionTensor = expenseModel.predict(
      tf.tensor2d([lastExpenseSequence])
    ) as tf.Tensor;

    const incomePrediction = denormalizeValue(
      incomePredictionTensor.dataSync()[0],
      incomeMin,
      incomeMax
    );
    const expensePrediction = denormalizeValue(
      expensePredictionTensor.dataSync()[0],
      expenseMin,
      expenseMax
    );

    console.log("Debug - Predicted Income Value:", incomePrediction);
    console.log("Debug - Predicted Expense Value:", expensePrediction);

    setPredictedIncome(incomePrediction);
    setPredictedExpenses(expensePrediction);

    incomePredictionTensor.dispose();
    expensePredictionTensor.dispose();
    setIsLoading(false);
  };

  return (
    <VStack spacing={4} align="center">
      <Heading size="md">Next Month’s Predictions</Heading>
      {isLoading ? (
        <Spinner size="lg" />
      ) : (
        <>
          <Text color="white">
            Predicted Income: ${predictedIncome?.toFixed(2)}
          </Text>
          <Text color="white">
            Predicted Expenses: ${predictedExpenses?.toFixed(2)}
          </Text>
        </>
      )}
      <Button
        colorScheme="teal"
        onClick={makePrediction}
        isDisabled={!incomeModel || !expenseModel}
      >
        Recalculate Prediction
      </Button>
    </VStack>
  );
};

export default MonthlyPrediction;
