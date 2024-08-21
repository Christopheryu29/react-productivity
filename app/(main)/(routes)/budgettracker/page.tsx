"use client";
import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import "chart.js/auto";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Text,
  VStack,
  HStack,
  useToast,
  Container,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
  Flex,
  Icon,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaEdit, FaTrash } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

const BudgetTrackerPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<number>(0);
  const [newExpenseType, setNewExpenseType] = useState<
    "income" | "expense" | "savings"
  >("expense");
  const [newCategory, setNewCategory] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<string>("");
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);
  const toast = useToast();
  const bg = useColorModeValue("gray.50", "gray.800");

  const fetchExpenses = useQuery(api.expense.getExpenses);
  const addExpenseMutation = useMutation(api.expense.createExpense);
  const deleteExpenseMutation = useMutation(api.expense.deleteExpense);
  const updateExpenseMutation = useMutation(api.expense.updateExpense);

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

  const addExpense = async () => {
    if (newExpense > 0) {
      await addExpenseMutation({
        amount: newExpense,
        type: newExpenseType,
        date: new Date().toISOString(),
        category:
          newCategory ||
          (newExpenseType === "income" ? "Salary" : "Miscellaneous"),
      });
      setNewExpense(0);
      setNewCategory("");
      toast({
        title: "Expense Added",
        description: "Your new expense has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteExpenseHandler = async (id: number) => {
    await deleteExpenseMutation({ id });
    toast({
      title: "Expense Deleted",
      description: "The expense has been removed.",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  };

  const startEditing = (
    id: number,
    amount: number,
    type: "income" | "expense" | "savings",
    category: string
  ) => {
    setEditingId(id);
    setEditAmount(amount);
    setEditCategory(category);
  };

  const editExpense = async () => {
    if (editingId !== null) {
      await updateExpenseMutation({
        id: editingId,
        amount: editAmount,
        category: editCategory,
      });
      setEditingId(null);
      setEditAmount(0);
      setEditCategory("");
      toast({
        title: "Expense Updated",
        description: "The expense has been updated successfully.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
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

  const combinedData = {
    labels: ["Income", "Expenses", "Savings"],
    datasets: [
      {
        data: [
          expenses
            .filter((e) => e.type === "income")
            .reduce((acc, e) => acc + e.amount, 0),
          expenses
            .filter((e) => e.type === "expense")
            .reduce((acc, e) => acc + e.amount, 0),
          expenses
            .filter((e) => e.type === "savings")
            .reduce((acc, e) => acc + e.amount, 0),
        ],
        backgroundColor: ["#68D391", "#FC8181", "#63B3ED"],
        borderColor: ["#2F855A", "#C53030", "#3182CE"],
        borderWidth: 1,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: ${context.raw}`,
        },
      },
    },
  };

  const calculateMonthlyTotals = () =>
    monthlyTotals.map((total) => ({
      month: `${new Date(
        parseInt(total.month.split("-")[1]),
        parseInt(total.month.split("-")[0]) - 1
      ).toLocaleString("default", { month: "long" })} ${
        total.month.split("-")[1]
      }`,
      totalIncome: total.totalIncome,
      totalExpenses: total.totalExpenses,
      totalSavings: total.totalSavings, // Displaying total savings
    }));

  return (
    <Container maxW="container.xl" p={4}>
      <Heading as="h1" size="2xl" textAlign="center" mb={6} color={"white"}>
        Budget Tracker
      </Heading>
      <StatGroup mb={6}>
        <Stat>
          <StatLabel color={"white"}>Total Income</StatLabel>
          <StatNumber color={"white"}>
            $
            {expenses
              .filter((e) => e.type === "income")
              .reduce((acc, e) => acc + e.amount, 0)}
          </StatNumber>
        </Stat>
        <Stat>
          <StatLabel color={"white"}>Total Expenses</StatLabel>
          <StatNumber color={"white"}>
            $
            {expenses
              .filter((e) => e.type === "expense")
              .reduce((acc, e) => acc + e.amount, 0)}
          </StatNumber>
        </Stat>
        <Stat>
          <StatLabel color={"white"}>Total Savings</StatLabel>
          <StatNumber color={"white"}>
            $
            {expenses
              .filter((e) => e.type === "savings")
              .reduce((acc, e) => acc + e.amount, 0)}
          </StatNumber>
        </Stat>
        <Stat>
          <StatLabel color={"white"}>Current Balance</StatLabel>
          <StatNumber color={"white"}>${currentBalance}</StatNumber>
        </Stat>
      </StatGroup>
      <Box boxShadow="md" p={5} rounded="md" bg="white">
        <Heading size="lg" mb={4}>
          Add New Expense
        </Heading>
        <VStack spacing={4}>
          <Input
            placeholder="Amount"
            type="number"
            value={newExpense}
            onChange={(e) => setNewExpense(Number(e.target.value))}
          />
          <Select
            placeholder="Select Type"
            value={newExpenseType}
            onChange={(e) =>
              setNewExpenseType(
                e.target.value as "income" | "expense" | "savings"
              )
            }
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="savings">Savings</option>
          </Select>
          <Select
            placeholder="Select Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            {newExpenseType === "income" ? (
              <>
                <option value="Salary">Salary</option>
                <option value="Investment">Investment</option>
                <option value="Freelancing">Freelancing</option>
                <option value="Other">Other</option>
              </>
            ) : newExpenseType === "savings" ? (
              <>
                <option value="General Savings">General Savings</option>
                <option value="Retirement Fund">Retirement Fund</option>
                <option value="Education Fund">Education Fund</option>
                <option value="Other Savings">Other Savings</option>
              </>
            ) : (
              <>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Mortgage">Mortgage</option>
                <option value="Debt">Debt</option>
                <option value="Other">Other</option>
              </>
            )}
          </Select>
          <Button colorScheme="blue" onClick={addExpense}>
            Add Expense
          </Button>
        </VStack>
      </Box>
      <Box mt={10} mb={6} width="40%" mx="auto">
        <Pie data={combinedData} options={chartOptions} />
      </Box>

      <Flex direction={["column", "row"]} gap={5}>
        <Box flex="1" boxShadow="lg" p={5} rounded="md" bg="white">
          <Heading size="md" mb={4}>
            Expenses List
          </Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Amount</Th>
                <Th>Type</Th>
                <Th>Category</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {expenses.map((expense) => (
                <Tr key={expense.id}>
                  <Td>${expense.amount}</Td>
                  <Td>{expense.type}</Td>
                  <Td>{expense.category}</Td>
                  <Td>{new Date(expense.date).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="yellow"
                        onClick={() =>
                          startEditing(
                            expense.id,
                            expense.amount,
                            expense.type,
                            expense.category
                          )
                        }
                      >
                        <Icon as={FaEdit} />
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => deleteExpenseHandler(expense.id)}
                      >
                        <Icon as={FaTrash} />
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        <Box flex="1" boxShadow="lg" p={5} rounded="md" bg="white">
          <Heading size="md" mb={4}>
            Monthly Summary
          </Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Month</Th>
                <Th>Total Income</Th>
                <Th>Total Expenses</Th>
                <Th>Total Savings</Th>
              </Tr>
            </Thead>
            <Tbody>
              {monthlyTotals.map((total, index) => (
                <Tr key={index}>
                  <Td>{total.month}</Td>
                  <Td>${total.totalIncome}</Td>
                  <Td>${total.totalExpenses}</Td>
                  <Td>${total.totalSavings}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Flex>
    </Container>
  );
};

export default BudgetTrackerPage;
