// machine/components/MonthlyPrediction.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  VStack,
  Text,
  Button,
  Spinner,
  Heading,
  Box,
  HStack,
  Icon,
  useBreakpointValue,
} from "@chakra-ui/react";
import * as tf from "@tensorflow/tfjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  FaDollarSign,
  FaChartLine,
  FaRedo,
  FaExclamationTriangle,
} from "react-icons/fa";

interface MonthlyData {
  date: string;
  income: number;
  expenses: number;
  expensesByCategory: Record<string, number>;
}

const SEQUENCE_LENGTH = 6;

const MonthlyPrediction: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [incomeModel, setIncomeModel] = useState<tf.LayersModel | null>(null);
  const [expenseModels, setExpenseModels] = useState<
    Record<string, tf.LayersModel>
  >({});
  const [predictedIncome, setPredictedIncome] = useState<number | null>(null);
  const [predictedExpenses, setPredictedExpenses] = useState<
    Record<string, number | null>
  >({});
  const [totalPredictedExpenses, setTotalPredictedExpenses] = useState<
    number | null
  >(null);
  const expenses = useQuery(api.expense.getExpenses);

  const prepareMonthlyData = (
    expenses: any[]
  ): { income: number[]; expensesByCategory: Record<string, number[]> } => {
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
          expensesByCategory:
            expense.type === "expense"
              ? { [expense.category]: expense.amount }
              : {},
        });
      } else {
        if (expense.type === "income") {
          monthlyData[dataIndex].income += expense.amount;
        } else {
          monthlyData[dataIndex].expenses += expense.amount;
          monthlyData[dataIndex].expensesByCategory[expense.category] =
            (monthlyData[dataIndex].expensesByCategory[expense.category] || 0) +
            expense.amount;
        }
      }
    });

    const income = monthlyData.map((data) => data.income);
    const expensesByCategory: Record<string, number[]> = {};
    monthlyData.forEach((data) => {
      for (const [category, amount] of Object.entries(
        data.expensesByCategory
      )) {
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = Array(monthlyData.length).fill(0);
        }
        expensesByCategory[category][monthlyData.indexOf(data)] = amount;
      }
    });

    return { income, expensesByCategory };
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
      const { income, expensesByCategory } = prepareMonthlyData(expenses);

      const incomeMin = Math.min(...income);
      const incomeMax = Math.max(...income);

      const incomeSequences = createSequences(
        normalizeData(income, incomeMin, incomeMax),
        SEQUENCE_LENGTH
      );
      const inputIncome = incomeSequences.map((seq) =>
        seq.slice(0, SEQUENCE_LENGTH)
      );
      const outputIncome = incomeSequences.map((seq) => seq[SEQUENCE_LENGTH]);

      const incomeTensor = tf.tensor2d(inputIncome);
      const incomeLabels = tf.tensor1d(outputIncome);

      const createDenseModel = () => {
        const model = tf.sequential();
        model.add(
          tf.layers.dense({
            units: 20,
            inputShape: [SEQUENCE_LENGTH],
            activation: "relu",
          })
        );
        model.add(tf.layers.dropout({ rate: 0.2 }));
        model.add(tf.layers.dense({ units: 20, activation: "relu" }));
        model.add(tf.layers.dense({ units: 1 }));
        model.compile({
          optimizer: tf.train.adam(0.001),
          loss: "meanSquaredError",
        });
        return model;
      };

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

      const incomeModel = createDenseModel();
      await trainModel(incomeModel, incomeTensor, incomeLabels);

      const trainedExpenseModels: Record<string, tf.LayersModel> = {};
      for (const [category, values] of Object.entries(expensesByCategory)) {
        const categoryMin = Math.min(...values);
        const categoryMax = Math.max(...values);

        const normalizedValues = normalizeData(
          values,
          categoryMin,
          categoryMax
        );
        const categorySequences = createSequences(
          normalizedValues,
          SEQUENCE_LENGTH
        );
        const inputCategory = categorySequences.map((seq) =>
          seq.slice(0, SEQUENCE_LENGTH)
        );
        const outputCategory = categorySequences.map(
          (seq) => seq[SEQUENCE_LENGTH]
        );

        const expenseTensor = tf.tensor2d(inputCategory);
        const expenseLabels = tf.tensor1d(outputCategory);

        const expenseModel = createDenseModel();
        await trainModel(expenseModel, expenseTensor, expenseLabels);

        trainedExpenseModels[category] = expenseModel;

        expenseTensor.dispose();
        expenseLabels.dispose();
      }

      setIncomeModel(incomeModel);
      setExpenseModels(trainedExpenseModels);

      incomeTensor.dispose();
      incomeLabels.dispose();
    }
    setIsLoading(false);
  }, [expenses]);

  useEffect(() => {
    initializeModel();
  }, [initializeModel]);

  const makePrediction = () => {
    if (!incomeModel || Object.keys(expenseModels).length === 0 || !expenses)
      return;
    setIsLoading(true);

    const { income, expensesByCategory } = prepareMonthlyData(expenses);
    const incomeMin = Math.min(...income);
    const incomeMax = Math.max(...income);

    const lastIncomeSequence = normalizeData(
      income.slice(-SEQUENCE_LENGTH),
      incomeMin,
      incomeMax
    );
    const incomePredictionTensor = incomeModel.predict(
      tf.tensor2d([lastIncomeSequence])
    ) as tf.Tensor;
    const incomePrediction = denormalizeValue(
      incomePredictionTensor.dataSync()[0],
      incomeMin,
      incomeMax
    );

    const categoryPredictions: Record<string, number | null> = {};
    let totalPrediction = 0;

    for (const [category, model] of Object.entries(expenseModels)) {
      const values = expensesByCategory[category];
      const categoryMin = Math.min(...values);
      const categoryMax = Math.max(...values);

      const lastCategorySequence = normalizeData(
        values.slice(-SEQUENCE_LENGTH),
        categoryMin,
        categoryMax
      );
      const categoryPredictionTensor = model.predict(
        tf.tensor2d([lastCategorySequence])
      ) as tf.Tensor;
      const categoryPrediction = denormalizeValue(
        categoryPredictionTensor.dataSync()[0],
        categoryMin,
        categoryMax
      );

      categoryPredictions[category] = categoryPrediction;
      totalPrediction += categoryPrediction;

      categoryPredictionTensor.dispose();
    }

    setPredictedIncome(incomePrediction);
    setPredictedExpenses(categoryPredictions);
    setTotalPredictedExpenses(totalPrediction);

    incomePredictionTensor.dispose();
    setIsLoading(false);
  };

  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <VStack
      spacing={6}
      align="center"
      p={8}
      className="bg-gray-100 dark:bg-[radial-gradient(circle_at_center,_#303030_0%,_#34373f_25%,_#2f3246_50%,_#303030_100%)]"
      rounded="xl"
      boxShadow="2xl"
      w="100%"
      mx="auto"
    >
      <Heading
        size="lg"
        className="text-gray-800 dark:text-white dark:filter "
        fontWeight="bold"
        mb={10}
        mt={4}
      >
        Next Month’s Predictions
      </Heading>

      {expenses && expenses.length >= SEQUENCE_LENGTH ? (
        isLoading ? (
          <Spinner size="xl" color="teal.300" />
        ) : (
          <VStack spacing={4} w="100%">
            <Box
              w="100%"
              p={6}
              bg="transparent"
              backdropFilter="blur(12px)"
              border="1px solid rgba(255, 255, 255, 0.2)"
              borderRadius="2xl"
              boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.4)"
              transition="transform 0.3s ease, box-shadow 0.3s ease"
              _hover={{
                transform: "scale(1.015)",
                boxShadow: "0 12px 40px rgba(0, 255, 255, 0.4)",
              }}
            >
              {isMobile ? (
                <VStack align="start">
                  <Icon
                    as={FaDollarSign}
                    color="teal.300"
                    boxSize={8}
                    className="dark:filter dark:drop-shadow-[0_0_8px_teal]"
                  />
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    className="text-gray-800 dark:text-white"
                  >
                    Predicted Income:
                  </Text>
                  <Text
                    fontSize="2xl"
                    fontWeight="extrabold"
                    color="teal.200"
                    className="dark:filter dark:drop-shadow-[0_0_6px_teal]"
                  >
                    ${predictedIncome?.toFixed(2) || "N/A"}
                  </Text>
                </VStack>
              ) : (
                <HStack justify="space-between" align="center">
                  <Icon
                    as={FaDollarSign}
                    color="teal.300"
                    boxSize={8}
                    className="dark:filter dark:drop-shadow-[0_0_8px_teal]"
                  />
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    className="text-gray-800 dark:text-white"
                  >
                    Predicted Income:
                  </Text>
                  <Text
                    fontSize="2xl"
                    fontWeight="extrabold"
                    color="teal.200"
                    className="dark:filter dark:drop-shadow-[0_0_6px_teal]"
                  >
                    ${predictedIncome?.toFixed(2) || "N/A"}
                  </Text>
                </HStack>
              )}
            </Box>

            <Box
              w="100%"
              p={6}
              mt={4}
              bg="transparent"
              backdropFilter="blur(12px)"
              border="1px solid rgba(255, 255, 255, 0.2)"
              borderRadius="2xl"
              boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.4)"
              transition="transform 0.3s ease, box-shadow 0.3s ease"
              _hover={{
                transform: "scale(1.015)",
                boxShadow: "0 12px 40px rgba(255, 165, 0, 0.4)",
              }}
            >
              {isMobile ? (
                <VStack align="start">
                  <Icon
                    as={FaChartLine}
                    color="orange.300"
                    boxSize={8}
                    className="dark:filter dark:drop-shadow-[0_0_8px_orange]"
                  />
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    className="text-gray-800 dark:text-white"
                  >
                    Total Predicted Expenses:
                  </Text>
                  <Text
                    fontSize="2xl"
                    fontWeight="extrabold"
                    color="orange.200"
                    className="dark:filter dark:drop-shadow-[0_0_6px_orange]"
                  >
                    ${totalPredictedExpenses?.toFixed(2) || "N/A"}
                  </Text>
                </VStack>
              ) : (
                <HStack justify="space-between" align="center">
                  <Icon
                    as={FaChartLine}
                    color="orange.300"
                    boxSize={8}
                    className="dark:filter dark:drop-shadow-[0_0_8px_orange]"
                  />
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    className="text-gray-800 dark:text-white"
                  >
                    Total Predicted Expenses:
                  </Text>
                  <Text
                    fontSize="2xl"
                    fontWeight="extrabold"
                    color="orange.200"
                    className="dark:filter dark:drop-shadow-[0_0_6px_orange]"
                  >
                    ${totalPredictedExpenses?.toFixed(2) || "N/A"}
                  </Text>
                </HStack>
              )}
            </Box>

            {Object.entries(predictedExpenses).map(([category, amount], i) => (
              <Box
                key={i}
                w="100%"
                p={6}
                mt={4}
                bg="transparent"
                backdropFilter="blur(12px)"
                border="1px solid rgba(255, 255, 255, 0.2)"
                borderRadius="2xl"
                boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.4)"
                transition="transform 0.3s ease, box-shadow 0.3s ease"
                _hover={{
                  transform: "scale(1.015)",
                  boxShadow: "0 12px 40px rgba(255, 69, 69, 0.4)",
                }}
              >
                {isMobile ? (
                  <VStack align="start">
                    <Icon
                      as={FaChartLine}
                      color="red.300"
                      boxSize={8}
                      className="dark:filter dark:drop-shadow-[0_0_8px_red]"
                    />
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      className="text-gray-800 dark:text-white"
                    >
                      Predicted {category} Expenses:
                    </Text>
                    <Text
                      fontSize="2xl"
                      fontWeight="extrabold"
                      color="red.200"
                      className="dark:filter dark:drop-shadow-[0_0_6px_red]"
                    >
                      ${amount?.toFixed(2) || "N/A"}
                    </Text>
                  </VStack>
                ) : (
                  <HStack justify="space-between" align="center">
                    <Icon
                      as={FaChartLine}
                      color="red.300"
                      boxSize={8}
                      className="dark:filter dark:drop-shadow-[0_0_8px_red]"
                    />
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      className="text-gray-800 dark:text-white"
                    >
                      Predicted {category} Expenses:
                    </Text>
                    <Text
                      fontSize="2xl"
                      fontWeight="extrabold"
                      color="red.200"
                      className="dark:filter dark:drop-shadow-[0_0_6px_red]"
                    >
                      ${amount?.toFixed(2) || "N/A"}
                    </Text>
                  </HStack>
                )}
              </Box>
            ))}
          </VStack>
        )
      ) : (
        <Box
          p={6}
          bg="rgba(245, 158, 11, 0.2)"
          border="1px solid"
          borderColor="orange.400"
          rounded="lg"
          textAlign="center"
        >
          <HStack justify="center" spacing={2}>
            <Icon as={FaExclamationTriangle} color="orange.400" boxSize={6} />
            <Text fontSize="lg" fontWeight="bold" color="orange.300">
              Insufficient Data
            </Text>
          </HStack>
          <Text mt={2} color="orange.200" fontSize="md">
            Please provide at least {SEQUENCE_LENGTH} months of historical data.
          </Text>
        </Box>
      )}

      <Button
        size="lg"
        onClick={makePrediction}
        isDisabled={!incomeModel || Object.keys(expenseModels).length === 0}
        mt={10}
        mb={6}
        w="100%"
        rounded="full"
        fontWeight="bold"
        transition="all 0.3s ease-in-out"
        bgGradient="linear(to-r, teal.500, cyan.500, blue.600)"
        color="white"
        boxShadow="0px 4px 10px rgba(0, 255, 255, 0.3)"
        _hover={{
          bgGradient: "linear(to-r, blue.500, cyan.500, teal.400)",
          boxShadow: "0px 6px 15px rgba(0, 255, 255, 0.5)",
          transform: "scale(1.08)",
        }}
        _active={{
          bgGradient: "linear(to-r, cyan.600, teal.500, blue.700)",
          boxShadow: "0px 4px 8px rgba(0, 255, 255, 0.4)",
          transform: "scale(0.97)",
        }}
        _disabled={{
          bgGradient: "linear(to-r, gray.400, gray.500)",
          color: "gray.300",
          cursor: "not-allowed",
          opacity: 0.7,
          boxShadow: "none",
        }}
      >
        <HStack spacing={2}>
          <Text>Recalculate Prediction</Text>
          <Icon
            as={FaRedo}
            boxSize={5}
            color="whiteAlpha.900"
            style={{
              animation: "spin 1s linear infinite",
              transition: "all 0.3s ease-in-out",
            }}
          />
        </HStack>
      </Button>
    </VStack>
  );
};

export default MonthlyPrediction;
