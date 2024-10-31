"use client";

import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
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
  useToken,
} from "@chakra-ui/react";
import { FaEdit, FaTrash } from "react-icons/fa";
import StatCards from "./components/StatCards";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseBreakdownBarChart from "./components/charts/ExpenseBreakdownBarChart";
import WeeklySummary from "./components/WeeklySummary";
import MonthlySummary from "./components/MonthlySummary";
import {
  WeeklySummaryLineChart,
  MonthlySummaryLineChart,
  YearlySummaryLineChart,
} from "./components/charts/LineChart";
import YearlySummary from "./components/YearlySummary";
import ExpenseList from "./components/ExpenseList";
import HouseholdForm from "./components/HouseholdForm";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

interface WeeklyTotals {
  week: string;
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

interface YearlyTotals {
  year: string;
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>; // Add this field
  expensesByCategory: Record<string, number>; // Add this field
}

interface CategoryTotals {
  [key: string]: number;
  housingCost: number;
  foodCost: number;
  transportationCost: number;
  healthcareCost: number;
  otherNecessitiesCost: number;
  childcareCost: number;
  taxes: number;
}

interface MonthlyTotalsAggregate {
  [key: string]: {
    totalIncome: number;
    totalExpenses: number;
    incomeByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
  };
}

interface WeeklyTotalsAggregate {
  [key: string]: {
    totalIncome: number;
    totalExpenses: number;
    incomeByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
  };
}

interface YearlyTotalsAggregate {
  [key: string]: {
    totalIncome: number;
    totalExpenses: number;
    incomeByCategory: Record<string, number>; // Add this line
    expensesByCategory: Record<string, number>; // Add this line
  };
}

const BudgetTrackerPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<string>("");
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);

  const [weeklyTotals, setWeeklyTotals] = useState<WeeklyTotals[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState<YearlyTotals[]>([]);

  const toast = useToast();

  const [numAdults, setNumAdults] = useState<number>(0);
  const [numChildren, setNumChildren] = useState<number>(0);

  const fetchExpenses = useQuery(api.expense.getExpenses);
  const deleteExpenseMutation = useMutation(api.expense.deleteExpense);
  const updateExpenseMutation = useMutation(api.expense.updateExpense);
  // Import the mutation from your generated API
  const setHouseholdMutation = useMutation(api.household.setHousehold);
  const categoryColors = {
    housing_cost: "#FF6384",
    food_cost: "#36A2EB",
    transportation_cost: "#FFCE56",
    healthcare_cost: "#4BC0C0",
    other_necessities_cost: "#9966FF",
    childcare_cost: "#FF9F40",
    taxes: "#C9CBCF",
  };

  // Function to handle saving the household data
  const saveHousehold = async (numAdults: number, numChildren: number) => {
    try {
      await setHouseholdMutation({
        numAdults,
        numChildren,
      });
      setNumAdults(numAdults);
      setNumChildren(numChildren);
    } catch (error) {
      toast({
        title: "Error Saving Household Data",
        description: "There was an error saving your household data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error saving household data:", error);
    }
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
    const now = new Date();
    const lastReset = localStorage.getItem("lastReset");
    if (!lastReset || new Date(lastReset).getMonth() !== now.getMonth()) {
      resetMonthlyTotals();
      localStorage.setItem("lastReset", now.toISOString());
    }
  }, []);

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  useEffect(() => {
    const now = new Date();
    const lastMonthlyReset = localStorage.getItem("lastMonthlyReset");
    const lastWeeklyReset = localStorage.getItem("lastWeeklyReset");
    const lastYearlyReset = localStorage.getItem("lastYearlyReset");

    // Reset Monthly
    if (
      !lastMonthlyReset ||
      new Date(lastMonthlyReset).getMonth() !== now.getMonth()
    ) {
      resetMonthlyTotals();
      localStorage.setItem("lastMonthlyReset", now.toISOString());
    }

    // Reset Weekly
    if (
      !lastWeeklyReset ||
      getWeekNumber(new Date(lastWeeklyReset)) !== getWeekNumber(now)
    ) {
      resetWeeklyTotals();
      localStorage.setItem("lastWeeklyReset", now.toISOString());
    }

    // Reset Yearly
    if (
      !lastYearlyReset ||
      new Date(lastYearlyReset).getFullYear() !== now.getFullYear()
    ) {
      resetYearlyTotals();
      localStorage.setItem("lastYearlyReset", now.toISOString());
    }
  }, []);

  // Monthly Reset
  const resetMonthlyTotals = () => {
    const now = new Date();
    const monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;

    const totalIncome = expenses
      .filter((exp) => exp.type === "income")
      .reduce((acc, exp) => acc + exp.amount, 0);
    const totalExpenses = expenses
      .filter((exp) => exp.type === "expense")
      .reduce((acc, exp) => acc + exp.amount, 0);

    // Add incomeByCategory and expensesByCategory as empty objects
    const newMonthlyTotals = [
      ...monthlyTotals,
      {
        month: monthYear,
        totalIncome,
        totalExpenses,
        incomeByCategory: {}, // Include these properties
        expensesByCategory: {}, // Include these properties
      },
    ];

    setMonthlyTotals(newMonthlyTotals);
    setExpenses([]);
  };

  // Weekly Reset
  // Weekly Reset
  const resetWeeklyTotals = () => {
    const now = new Date();
    const weekYear = `Week-${getWeekNumber(now)}-${now.getFullYear()}`;

    const totalIncome = expenses
      .filter((exp) => exp.type === "income")
      .reduce((acc, exp) => acc + exp.amount, 0);
    const totalExpenses = expenses
      .filter((exp) => exp.type === "expense")
      .reduce((acc, exp) => acc + exp.amount, 0);

    // Make sure to include incomeByCategory and expensesByCategory as empty objects
    const newWeeklyTotals: WeeklyTotals = {
      week: weekYear,
      totalIncome,
      totalExpenses,
      incomeByCategory: {}, // Include these properties to match WeeklyTotals type
      expensesByCategory: {}, // Include these properties to match WeeklyTotals type
    };

    setWeeklyTotals([...weeklyTotals, newWeeklyTotals]);
    setExpenses([]);
  };

  // Yearly Reset
  const resetYearlyTotals = () => {
    const now = new Date();
    const year1 = now.getFullYear(); // This is a number
    const yearString = year1.toString(); // Convert to string

    const totalIncome = expenses
      .filter((exp) => exp.type === "income")
      .reduce((acc, exp) => acc + exp.amount, 0);
    const totalExpenses = expenses
      .filter((exp) => exp.type === "expense")
      .reduce((acc, exp) => acc + exp.amount, 0);

    const newYearlyTotals = [
      ...yearlyTotals,
      {
        year: yearString,
        totalIncome,
        totalExpenses,
        incomeByCategory: {}, // Add this line
        expensesByCategory: {}, // Add this line
      },
    ];
    setYearlyTotals(newYearlyTotals);
    setExpenses([]);
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

  const editExpense = async () => {
    if (editingId !== null) {
      await updateExpenseMutation({
        id: editingId,
        amount: editAmount,
        category: editCategory,
        // Add any other fields that need to be updated
      });
      setEditingId(null); // Clear the editing state
      setEditAmount(0); // Reset amount
      setEditCategory(""); // Reset category
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

  const currentBalance = totalIncome - totalExpenses;

  const combinedData = {
    labels: ["Income", "Expenses"],
    datasets: [
      {
        data: [
          expenses
            .filter((e) => e.type === "income")
            .reduce((acc, e) => acc + e.amount, 0),
          expenses
            .filter((e) => e.type === "expense")
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

  useEffect(() => {
    console.log("Expenses Updated:", expenses); // Log expenses to see what data you have

    // Calculate weekly, monthly, and yearly totals
    const newWeeklyTotals = calculateWeeklyTotals(expenses);
    const newMonthlyTotals = calculateMonthlyTotals(expenses);
    const newYearlyTotals = calculateYearlyTotals(expenses);

    // Set state for weekly, monthly, and yearly totals
    setWeeklyTotals(newWeeklyTotals);
    setMonthlyTotals(newMonthlyTotals);
    setYearlyTotals(newYearlyTotals);
  }, [expenses]); // Recalculate whenever expenses update

  const calculateMonthlyTotals = (expenses: Expense[]): MonthlyTotals[] => {
    const totals = expenses.reduce<MonthlyTotalsAggregate>((acc, curr) => {
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

  const calculateWeeklyTotals = (expenses: Expense[]): WeeklyTotals[] => {
    const getWeekNumber = (date: Date): string => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear =
        (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil(
        (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
      );
      return `Week ${weekNumber} ${date.getFullYear()}`; // Use week number and year as the key
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

  const calculateYearlyTotals = (expenses: Expense[]): YearlyTotals[] => {
    const totals = expenses.reduce<YearlyTotalsAggregate>((acc, curr) => {
      const year = new Date(curr.date).getFullYear().toString();

      if (!acc[year]) {
        acc[year] = {
          totalIncome: 0,
          totalExpenses: 0,
          incomeByCategory: {}, // Add this line
          expensesByCategory: {}, // Add this line
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

    return Object.keys(totals).map((year) => ({
      year,
      totalIncome: totals[year].totalIncome,
      totalExpenses: totals[year].totalExpenses,
      incomeByCategory: totals[year].incomeByCategory, // Include this field
      expensesByCategory: totals[year].expensesByCategory, // Include this field
    }));
  };

  const userId = "your-user-id"; // This should be dynamically obtained from your auth context

  const householdData = useQuery(api.household.getHouseholdByUserId);

  useEffect(() => {
    if (householdData) {
      setNumAdults(householdData.numAdults);
      setNumChildren(householdData.numChildren);
    }
  }, [householdData]);

  const getCategoryTotals = (): CategoryTotals => {
    const categoryTotals: CategoryTotals = {
      housingCost: 0,
      foodCost: 0,
      transportationCost: 0,
      healthcareCost: 0,
      otherNecessitiesCost: 0,
      childcareCost: 0,
      taxes: 0,
    };

    expenses.forEach((expense) => {
      if (expense.type === "expense") {
        switch (expense.category) {
          case "housing_cost":
            categoryTotals.housingCost += expense.amount;
            break;
          case "food_cost":
            categoryTotals.foodCost += expense.amount;
            break;
          case "transportation_cost":
            categoryTotals.transportationCost += expense.amount;
            break;
          case "healthcare_cost":
            categoryTotals.healthcareCost += expense.amount;
            break;
          case "other_necessities_cost":
            categoryTotals.otherNecessitiesCost += expense.amount;
            break;
          case "childcare_cost":
            categoryTotals.childcareCost += expense.amount;
            break;
          case "taxes":
            categoryTotals.taxes += expense.amount;
            break;
        }
      }
    });

    return categoryTotals;
  };

  const handleAddExpense = (newExpense: {
    amount: number;
    type: "income" | "expense";
    category: string;
  }) => {
    setExpenses((prevExpenses) => [
      ...prevExpenses,
      {
        ...newExpense,
        id: Date.now(), // Add a unique ID
        date: new Date().toISOString(), // Add the current date
      },
    ]);
  };

  const startEditing = (
    id: number,
    amount: number,
    type: "income" | "expense",
    category: string,
    date: string // Add date here
  ) => {
    setEditingId(id);
    setEditAmount(amount);
    setEditCategory(category);
    // You can add `setEditDate(date)` here if you want to handle the date.
  };

  return (
    <Container maxW="container.xl" p={4}>
      <Heading as="h1" size="2xl" textAlign="center" mb={6} color={"white"}>
        Budget Tracker
      </Heading>
      <StatCards
        numAdults={numAdults}
        numChildren={numChildren}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        currentBalance={currentBalance}
      />

      <Box boxShadow="md" p={5} rounded="md" bg="white">
        <Heading size="lg" mb={4}>
          Household Information
        </Heading>
        {/* Use HouseholdForm component */}
        <HouseholdForm
          numAdults={numAdults}
          numChildren={numChildren}
          onSaveHousehold={saveHousehold}
        />
      </Box>

      <Box boxShadow="md" p={5} rounded="md" bg="white">
        <Heading size="lg" mb={4}>
          Add New Expense
        </Heading>
        <ExpenseForm onAddExpense={handleAddExpense} />
      </Box>

      <VStack spacing={6} align="stretch">
        {/* Weekly Summary */}
        <WeeklySummary weeklyTotals={weeklyTotals} />
        <MonthlySummary monthlyTotals={monthlyTotals} />
        <YearlySummary yearlyTotals={yearlyTotals} />
      </VStack>

      <ExpenseList
        expenses={expenses}
        onEdit={editExpense}
        onDelete={deleteExpenseHandler}
      />
    </Container>
  );
};

export default BudgetTrackerPage;
