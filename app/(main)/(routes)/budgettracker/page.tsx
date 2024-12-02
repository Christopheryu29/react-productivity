"use client";

import React, { useState, useEffect } from "react";

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
  Heading,
  Text,
  VStack,
  useToast,
  Container,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { FaHome, FaMoneyBillWave } from "react-icons/fa";
import StatCards from "./components/StatCards";
import ExpenseForm from "./components/ExpenseForm";
import WeeklySummary from "./components/WeeklySummary";
import MonthlySummary from "./components/MonthlySummary";
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
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
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
    incomeByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
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

  const setHouseholdMutation = useMutation(api.household.setHousehold);

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

    if (
      !lastMonthlyReset ||
      new Date(lastMonthlyReset).getMonth() !== now.getMonth()
    ) {
      resetMonthlyTotals();
      localStorage.setItem("lastMonthlyReset", now.toISOString());
    }

    if (
      !lastWeeklyReset ||
      getWeekNumber(new Date(lastWeeklyReset)) !== getWeekNumber(now)
    ) {
      resetWeeklyTotals();
      localStorage.setItem("lastWeeklyReset", now.toISOString());
    }

    if (
      !lastYearlyReset ||
      new Date(lastYearlyReset).getFullYear() !== now.getFullYear()
    ) {
      resetYearlyTotals();
      localStorage.setItem("lastYearlyReset", now.toISOString());
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

    const newMonthlyTotals = [
      ...monthlyTotals,
      {
        month: monthYear,
        totalIncome,
        totalExpenses,
        incomeByCategory: {},
        expensesByCategory: {},
      },
    ];

    setMonthlyTotals(newMonthlyTotals);
    setExpenses([]);
  };

  const resetWeeklyTotals = () => {
    const now = new Date();
    const weekYear = `Week-${getWeekNumber(now)}-${now.getFullYear()}`;

    const totalIncome = expenses
      .filter((exp) => exp.type === "income")
      .reduce((acc, exp) => acc + exp.amount, 0);
    const totalExpenses = expenses
      .filter((exp) => exp.type === "expense")
      .reduce((acc, exp) => acc + exp.amount, 0);

    const newWeeklyTotals: WeeklyTotals = {
      week: weekYear,
      totalIncome,
      totalExpenses,
      incomeByCategory: {},
      expensesByCategory: {},
    };

    setWeeklyTotals([...weeklyTotals, newWeeklyTotals]);
    setExpenses([]);
  };

  const resetYearlyTotals = () => {
    const now = new Date();
    const year1 = now.getFullYear();
    const yearString = year1.toString();

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
        incomeByCategory: {},
        expensesByCategory: {},
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

  useEffect(() => {
    const newWeeklyTotals = calculateWeeklyTotals(expenses);
    const newMonthlyTotals = calculateMonthlyTotals(expenses);
    const newYearlyTotals = calculateYearlyTotals(expenses);

    setWeeklyTotals(newWeeklyTotals);
    setMonthlyTotals(newMonthlyTotals);
    setYearlyTotals(newYearlyTotals);
  }, [expenses]);

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

  const calculateYearlyTotals = (expenses: Expense[]): YearlyTotals[] => {
    const totals = expenses.reduce<YearlyTotalsAggregate>((acc, curr) => {
      const year = new Date(curr.date).getFullYear().toString();

      if (!acc[year]) {
        acc[year] = {
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

    return Object.keys(totals).map((year) => ({
      year,
      totalIncome: totals[year].totalIncome,
      totalExpenses: totals[year].totalExpenses,
      incomeByCategory: totals[year].incomeByCategory,
      expensesByCategory: totals[year].expensesByCategory,
    }));
  };

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
        id: Date.now(),
        date: new Date().toISOString(),
      },
    ]);
  };

  const startEditing = (
    id: number,
    amount: number,
    type: "income" | "expense",
    category: string,
    date: string
  ) => {
    setEditingId(id);
    setEditAmount(amount);
    setEditCategory(category);
  };

  return (
    <Container maxW="container.xl" p={4}>
      <Heading
        as="h1"
        size={{ base: "lg", md: "2xl" }}
        textAlign="center"
        mb={6}
        className="text-gray-800 dark:text-white"
      >
        Budget Tracker
      </Heading>
      <Flex justify="center" gap={6} mb={6}>
        <StatCards
          numAdults={numAdults}
          numChildren={numChildren}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          currentBalance={currentBalance}
        />
      </Flex>

      <Flex
        direction={{ base: "column", md: "row" }}
        gap={6}
        align="center"
        justify="center"
      >
        <Flex
          flex="1"
          height="650px"
          direction="column"
          className="bg-white dark:bg-[hsla(240,3%,12%,1)] text-gray-800 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-transform transform hover:scale-105"
          p={6}
          align="stretch"
          justify="space-between"
        >
          <Flex align="center" mb={4}>
            <Icon
              as={FaHome}
              boxSize={5}
              color="gray.500 dark:text-gray-300"
              mr={2}
            />
            <Heading size="md" className="text-gray-800 dark:text-white">
              Household Information
            </Heading>
          </Flex>
          <Divider mb={4} className="border-gray-300 dark:border-gray-600" />
          <Box w="100%" display="flex" justifyContent="center">
            <HouseholdForm
              numAdults={numAdults}
              numChildren={numChildren}
              onSaveHousehold={saveHousehold}
            />
          </Box>
          <Box
            mt={6}
            p={4}
            className="bg-gray-50 dark:bg-gray-800 rounded-md flex-grow"
          >
            <Heading
              size="sm"
              mb={2}
              className="text-gray-700 dark:text-gray-300"
            >
              Household Budget Insights
            </Heading>
            <Divider mb={3} className="border-gray-300 dark:border-gray-600" />
            <Stat>
              <StatLabel className="text-gray-500 dark:text-gray-400">
                Average Expense per Person
              </StatLabel>
              <StatNumber>
                ${(totalExpenses / (numAdults + numChildren || 1)).toFixed(2)}
              </StatNumber>
            </Stat>
            <Stat mt={4}>
              <StatLabel className="text-gray-500 dark:text-gray-400">
                Recommended Monthly Savings
              </StatLabel>
              <StatNumber>${(currentBalance * 0.2).toFixed(2)}</StatNumber>
              <Text fontSize="xs" className="text-gray-500 dark:text-gray-400">
                (20% of Current Balance)
              </Text>
            </Stat>
          </Box>
        </Flex>

        <Flex
          flex="1"
          height="650px"
          direction="column"
          className="bg-white dark:bg-[hsla(240,3%,12%,1)] text-gray-800 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-transform transform hover:scale-105"
          p={6}
          align="stretch"
          justify="space-between"
        >
          <Flex align="center" mb={4}>
            <Icon
              as={FaMoneyBillWave}
              boxSize={5}
              color="gray.500 dark:text-gray-300"
              mr={2}
            />
            <Heading size="md" className="text-gray-800 dark:text-white">
              Add New Expense
            </Heading>
          </Flex>
          <Divider mb={4} className="border-gray-300 dark:border-gray-600" />
          <Box w="100%" display="flex" justifyContent="center">
            <ExpenseForm onAddExpense={handleAddExpense} />
          </Box>
          <Box mt={6} flexGrow="1">
            <Text
              fontSize="sm"
              className="text-gray-600 dark:text-gray-400"
              textAlign="center"
            >
              For more information about expense prediction, please visit the
              <Text
                as="span"
                color="blue.400"
                fontWeight="bold"
                cursor="pointer"
              >
                {" "}
                Machine Page
              </Text>
              .
            </Text>
          </Box>
        </Flex>
      </Flex>

      <VStack spacing={6} align="stretch">
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
