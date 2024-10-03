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
  };
}

interface MonthlySummaryLineChartProps {
  monthlyTotals: MonthlyTotals[];
}

interface WeeklySummaryLineChartProps {
  weeklyTotals: WeeklyTotals[];
}

interface YearlySummaryLineChartProps {
  yearlyTotals: YearlyTotals[];
}

const BudgetTrackerPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<number>(0);
  const [newExpenseType, setNewExpenseType] = useState<"income" | "expense">(
    "expense"
  );
  const [newCategory, setNewCategory] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<string>("");
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);

  const [weeklyTotals, setWeeklyTotals] = useState<WeeklyTotals[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState<YearlyTotals[]>([]);

  const toast = useToast();
  const bg = useColorModeValue("gray.50", "gray.800");

  const [numAdults, setNumAdults] = useState<number>(0);
  const [numChildren, setNumChildren] = useState<number>(0);

  const fetchExpenses = useQuery(api.expense.getExpenses);
  const addExpenseMutation = useMutation(api.expense.createExpense);
  const deleteExpenseMutation = useMutation(api.expense.deleteExpense);
  const updateExpenseMutation = useMutation(api.expense.updateExpense);
  // Import the mutation from your generated API
  const setHouseholdMutation = useMutation(api.household.setHousehold);
  const updateFinancialSummaryMutation = useMutation(
    api.financial.updateFinancialSummary
  );

  const categoryColors = {
    housing_cost: "#FF6384",
    food_cost: "#36A2EB",
    transportation_cost: "#FFCE56",
    healthcare_cost: "#4BC0C0",
    other_necessities_cost: "#9966FF",
    childcare_cost: "#FF9F40",
    taxes: "#C9CBCF",
  };

  const handleSaveFinancialSummary = async () => {
    const userId = "your-user-id"; // Retrieve this ID dynamically as needed

    const categoryTotals = getCategoryTotals();
    const totalExpenses = Object.values(categoryTotals).reduce(
      (acc, curr) => acc + curr,
      0
    );
    const totalIncome = expenses.reduce(
      (acc, exp) => acc + (exp.type === "income" ? exp.amount : 0),
      0
    );

    try {
      await updateFinancialSummaryMutation({
        userId,
        update: {
          ...categoryTotals,
          totalExpenses,
          medianFamilyIncome: totalIncome,
        },
      });
      toast({
        title: "Financial Data Updated",
        description: "Your financial summary has been updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating financial summary:", error);
      toast({
        title: "Error Updating Data",
        description: "There was an error updating your financial summary.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Function to handle saving the household data
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
      { year: yearString, totalIncome, totalExpenses },
    ];
    setYearlyTotals(newYearlyTotals);
    setExpenses([]);
  };

  const addExpense = async () => {
    if (newExpense <= 0 || !newCategory) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount and select a category.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      await addExpenseMutation({
        amount: newExpense,
        type: newExpenseType,
        date: new Date().toISOString(),
        category: newCategory,
      });
      // Clear fields after adding expense
      setNewExpense(0);
      setNewCategory("");
      toast({
        title: "Expense Added",
        description: "Your new expense has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return true; // Indicate successful addition
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({
        title: "Error Adding Expense",
        description: "There was an error adding the expense.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false; // Indicate failure
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
    type: "income" | "expense",
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

    console.log("New Weekly Totals:", newWeeklyTotals); // Check how the weekly totals are being calculated
    console.log("New Monthly Totals:", newMonthlyTotals); // Check how the monthly totals are being calculated
    console.log("New Yearly Totals:", newYearlyTotals); // Check how the yearly totals are being calculated

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
        acc[year] = { totalIncome: 0, totalExpenses: 0 };
      }

      if (curr.type === "income") {
        acc[year].totalIncome += curr.amount;
      } else {
        acc[year].totalExpenses += curr.amount;
      }

      return acc;
    }, {});

    return Object.keys(totals).map((year) => ({
      year,
      totalIncome: totals[year].totalIncome,
      totalExpenses: totals[year].totalExpenses,
    }));
  };

  const userId = "your-user-id"; // This should be dynamically obtained from your auth context

  const householdData = useQuery(api.household.getHouseholdByUserId, {
    userId,
  });

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

  const categoryTotals = getCategoryTotals();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddExpenseAndSaveSummary = async () => {
    // Validate input first
    if (newExpense <= 0 || !newCategory) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount and select a category.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Attempt to add the expense
    try {
      const newEntry = {
        amount: newExpense,
        type: newExpenseType,
        date: new Date().toISOString(),
        category: newCategory,
      };

      await addExpenseMutation(newEntry);

      // Clear the input fields after successful addition
      setNewExpense(0);
      setNewCategory("");
      toast({
        title: "Expense Added",
        description: "Your new expense has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Update local expense state to include the new expense for accurate recalculations
      setExpenses((prevExpenses) => [
        ...prevExpenses,
        { ...newEntry, id: Date.now() },
      ]); // Update with actual ID if available

      // Prepare data and update financial summary immediately
      const updatedExpenses = [...expenses, { ...newEntry, id: Date.now() }];
      await handleSaveFinancialSummary();
    } catch (error) {
      console.error(
        "Error during expense addition or financial summary update:",
        error
      );
      toast({
        title: "Error",
        description: "There was an error processing your request.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const financialData = useQuery(api.financial.getFinancialSummary, { userId });

  const formatCategoryName = (key: string): string => {
    return (
      key
        // Split camelCase with space
        .replace(/([A-Z])/g, " $1")
        // Capitalize the first letter of each word
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
    );
  };

  const WeeklySummaryLineChart = ({
    weeklyTotals,
  }: WeeklySummaryLineChartProps) => {
    const data = {
      labels: weeklyTotals.map((data) => data.week), // Using the week labels
      datasets: [
        {
          label: "Total Income",
          data: weeklyTotals.map((data) => data.totalIncome),
          borderColor: "#68D391",
          backgroundColor: "rgba(104, 211, 145, 0.5)",
          fill: true,
        },
        {
          label: "Total Expenses",
          data: weeklyTotals.map((data) => data.totalExpenses),
          borderColor: "#FC8181",
          backgroundColor: "rgba(252, 129, 129, 0.5)",
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount ($)",
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      elements: {
        line: {
          tension: 0.4,
        },
        point: {
          radius: 6,
        },
      },
    };

    return <Line data={data} options={options as any} />;
  };

  // Use this function in the JSX for the monthly summary table body
  const MonthlySummaryLineChart = ({
    monthlyTotals,
  }: MonthlySummaryLineChartProps) => {
    const data = {
      labels: monthlyTotals.map((data) => data.month),
      datasets: [
        {
          label: "Total Income",
          data: monthlyTotals.map((data) => data.totalIncome),
          borderColor: "#68D391",
          backgroundColor: "rgba(104, 211, 145, 0.5)",
          fill: true,
        },
        {
          label: "Total Expenses",
          data: monthlyTotals.map((data) => data.totalExpenses),
          borderColor: "#FC8181",
          backgroundColor: "rgba(252, 129, 129, 0.5)",
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount ($)",
          },
        },
      },
      interaction: {
        mode: "nearest", // Correctly using a supported mode string literal
        axis: "x",
        intersect: false,
      },
      elements: {
        line: {
          tension: 0.4, // Controls the curve of the lines
        },
        point: {
          radius: 6, // Radius of the point markers
        },
      },
    };

    return <Line data={data} options={options as any} />;
  };

  const YearlySummaryLineChart = ({
    yearlyTotals,
  }: YearlySummaryLineChartProps) => {
    const data = {
      labels: yearlyTotals.map((data) => data.year.toString()), // Using the year labels
      datasets: [
        {
          label: "Total Income",
          data: yearlyTotals.map((data) => data.totalIncome),
          borderColor: "#68D391",
          backgroundColor: "rgba(104, 211, 145, 0.5)",
          fill: true,
        },
        {
          label: "Total Expenses",
          data: yearlyTotals.map((data) => data.totalExpenses),
          borderColor: "#FC8181",
          backgroundColor: "rgba(252, 129, 129, 0.5)",
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount ($)",
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      elements: {
        line: {
          tension: 0.4,
        },
        point: {
          radius: 6,
        },
      },
    };

    return <Line data={data} options={options as any} />;
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
        <VStack spacing={4}>
          <FormControl>
            <FormLabel htmlFor="numAdults">Number of Adults</FormLabel>
            <Input
              id="numAdults"
              placeholder="Number of Adults"
              type="number"
              size="sm"
              value={numAdults}
              onChange={(e) => setNumAdults(Number(e.target.value))}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="numChildren">Number of Children</FormLabel>
            <Input
              id="numChildren"
              placeholder="Number of Children"
              type="number"
              size="sm"
              value={numChildren}
              onChange={(e) => setNumChildren(Number(e.target.value))}
            />
          </FormControl>
          <Button colorScheme="green" onClick={saveHousehold}>
            Save Household Info
          </Button>
        </VStack>
        <Heading size="lg" mb={4}>
          Add New Expense
        </Heading>

        {/* <ExpenseForm onAddExpense={handleAddExpense} /> */}

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
              setNewExpenseType(e.target.value as "income" | "expense")
            }
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
          <Select
            placeholder="Select Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            {newExpenseType === "income" ? (
              <>
                <option value="median_family_income">
                  Median Family Income
                </option>
                <option value="Other">Other</option>
              </>
            ) : (
              <>
                <option value="housing_cost">Housing Cost</option>
                <option value="food_cost">Food Cost</option>
                <option value="transportation_cost">Transportation Cost</option>
                <option value="healthcare_cost">Healthcare Cost</option>
                <option value="other_necessities_cost">
                  Other Necessities Cost
                </option>
                <option value="childcare_cost">Childcare Cost</option>
                <option value="taxes">Taxes</option>
              </>
            )}
          </Select>
          <Button colorScheme="blue" onClick={handleAddExpenseAndSaveSummary}>
            Add Expense and Save Financial Data
          </Button>

          <Button colorScheme="blue" onClick={addExpense}>
            Add
          </Button>
          <Button colorScheme="blue" onClick={handleSaveFinancialSummary}>
            Save Financial Data
          </Button>
        </VStack>
      </Box>

      <Flex
        direction={["column", "row"]}
        justify="center"
        align="center"
        wrap="wrap"
        gap={5}
        mt={5}
      >
        {/* Pie Chart Box */}
        <Box
          boxShadow="md"
          p={4}
          justifyContent="center"
          rounded="md"
          bg="white"
          flex="1"
          maxW={"40%"}
        >
          <Pie data={combinedData} options={chartOptions} />
        </Box>

        {/* Bar Chart Box */}
        <Box boxShadow="md" p={4} rounded="md" bg="white" flex="1" minW={"40%"}>
          <ExpenseBreakdownBarChart expenses={expenses} />
        </Box>

        {/* Line Chart Box */}
        <Box boxShadow="md" p={4} rounded="md" bg="white" flex="1" minW={"30%"}>
          <MonthlySummaryLineChart monthlyTotals={monthlyTotals} />
          <WeeklySummaryLineChart weeklyTotals={weeklyTotals} />
          <YearlySummaryLineChart yearlyTotals={yearlyTotals} />
        </Box>
      </Flex>

      <Box boxShadow="lg" p={5} rounded="md" bg="white" mt={5}>
        <Heading size="md" mb={4}>
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

      <Box flex="1" boxShadow="lg" p={5} rounded="md" bg="white">
        <Heading size="md" mb={4}>
          Expense Breakdown by Category
        </Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Category</Th>
              <Th>Total Amount</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Object.keys(categoryTotals).map((key) => (
              <Tr key={key}>
                <Td>{formatCategoryName(key)}</Td>
                <Td>
                  ${categoryTotals[key as keyof CategoryTotals].toFixed(2)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <VStack spacing={6} align="stretch">
        {/* Weekly Summary */}
        <WeeklySummary weeklyTotals={weeklyTotals} />
        <MonthlySummary monthlyTotals={monthlyTotals} />

        {/* Yearly Summary */}
        <Box boxShadow="lg" p={5} rounded="lg">
          <Heading size="md" mb={4}>
            <Badge colorScheme="purple">Yearly Summary</Badge>
          </Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th color="white">Year</Th>
                <Th color="white">Total Income</Th>
                <Th color="white">Total Expenses</Th>
              </Tr>
            </Thead>
            <Tbody>
              {yearlyTotals.map((total, index) => (
                <Tr key={index}>
                  <Td color="white">{total.year}</Td>
                  <Td color="white">${total.totalIncome.toFixed(2)}</Td>
                  <Td color="white">${total.totalExpenses.toFixed(2)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      <Flex direction={["column", "row"]} gap={5} mt={"10"}>
        <Box boxShadow="lg" p={5} rounded="md" bg="white" mt={5}>
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
      </Flex>
    </Container>
  );
};

export default BudgetTrackerPage;
