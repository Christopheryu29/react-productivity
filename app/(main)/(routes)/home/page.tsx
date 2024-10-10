"use client";
import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Box,
  Heading,
  Container,
  VStack,
  useToast,
  Spinner,
  Grid,
  GridItem,
  Divider,
  Stack,
  Text,
  Button,
} from "@chakra-ui/react";
import { DataTable } from "../task/components/data-table"; // Adjust the import path as needed
import { columns } from "../task/components/columns"; // Adjust the import path as needed
import WeeklySummary from "../budgettracker/components/WeeklySummary";
import ExpenseForm from "../budgettracker/components/ExpenseForm";
import TodayEventCount from "../calendar/components/TodayEventCount";
import CriticalPeriods from "../machine/components/CriticalPeriods";

interface Task {
  id: string;
  title: string;
  status: string;
  label: string;
  priority: string;
}

interface Expense {
  id: number;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
}

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

// Component to display the current date and time
const CurrentDateTime: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Box textAlign="center" p={4} mb={6} bg="gray.100" rounded="md">
      <Heading size="md" color="gray.700">
        Today is {formatDate(currentTime)}
      </Heading>
      <Text fontSize="xl" color="gray.600">
        Current Time: {formatTime(currentTime)}
      </Text>
    </Box>
  );
};

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

const HomePage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [weeklyTotals, setWeeklyTotals] = useState<WeeklyTotals[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState<YearlyTotals[]>([]);

  const fetchedTasks = useQuery(api.task.getTasks);
  const fetchedExpenses = useQuery(api.expense.getExpenses);
  const addExpenseMutation = useMutation(api.expense.createExpense);
  const toast = useToast();

  useEffect(() => {
    if (fetchedTasks) {
      const mappedTasks = fetchedTasks.map((task) => ({
        ...task,
        id: task._id,
      }));
      setTasks(mappedTasks);
      setLoadingTasks(false);
    }
  }, [fetchedTasks]);

  useEffect(() => {
    if (fetchedExpenses) {
      const validatedExpenses = fetchedExpenses.map((expense: any) => ({
        ...expense,
        id: expense._id,
        type:
          expense.type === "income" || expense.type === "expense"
            ? expense.type
            : "expense",
      }));
      setExpenses(validatedExpenses);
      setLoadingExpenses(false);
    }
  }, [fetchedExpenses]);

  useEffect(() => {
    if (expenses.length > 0) {
      setWeeklyTotals(calculateWeeklyTotals(expenses));
      setMonthlyTotals(calculateMonthlyTotals(expenses));
      setYearlyTotals(calculateYearlyTotals(expenses));
    }
  }, [expenses]);

  // Extract critical periods based on high expenses (similar logic to ExpenseHighlights)
  const isCriticalPeriod = (totalExpenses: number, totalIncome: number) => {
    return totalExpenses / totalIncome > 0.8; // Example threshold for critical periods
  };

  let criticalWeeks = weeklyTotals.filter((week) =>
    isCriticalPeriod(week.totalExpenses, week.totalIncome)
  );

  let criticalMonths = monthlyTotals.filter((month) =>
    isCriticalPeriod(month.totalExpenses, month.totalIncome)
  );

  const criticalYears = yearlyTotals.filter((year) =>
    isCriticalPeriod(year.totalExpenses, year.totalIncome)
  );

  // Sort high-spend weeks by year and week number
  criticalWeeks = criticalWeeks.sort((a, b) => {
    const weekA = parseInt(a.week.match(/Week (\d+)/)?.[1] || "0", 10);
    const yearA = parseInt(a.week.match(/(\d{4})/)?.[1] || "0", 10);
    const weekB = parseInt(b.week.match(/Week (\d+)/)?.[1] || "0", 10);
    const yearB = parseInt(b.week.match(/(\d{4})/)?.[1] || "0", 10);
    return yearA === yearB ? weekA - weekB : yearA - yearB;
  });

  // Sort high-spend months by year and month
  criticalMonths = criticalMonths.sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });

  const handleAddExpense = async (newExpense: {
    amount: number;
    type: "income" | "expense";
    category: string;
  }) => {
    try {
      const expenseEntry = {
        ...newExpense,
        id: Date.now(),
        date: new Date().toISOString(),
      };
      await addExpenseMutation(expenseEntry);
      setExpenses((prev) => [...prev, expenseEntry]);
      toast({
        title: "Expense Added",
        description: "Your expense has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error Adding Expense",
        description: "There was an error adding your expense.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error adding expense:", error);
    }
  };

  if (loadingTasks || loadingExpenses) {
    return (
      <Container maxW="container.xl" p={8}>
        <Spinner size="xl" thickness="4px" color="blue.500" />
        <Heading mt={4} color="blue.500">
          Loading...
        </Heading>
      </Container>
    );
  }

  return (
    <Container
      maxW="container.xl"
      p={8}
      minH="100vh"
      display="flex"
      flexDirection="column"
      overflowY="hidden"
    >
      {/* Current Date and Time */}
      <CurrentDateTime />

      {/* Section for Expenses, Weekly Summary, and Critical Periods */}
      <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6} flex="1">
        {/* Left Column: Add New Expense and Today Event Count */}
        <GridItem>
          <Box boxShadow="md" p={5} rounded="md" bg="white" mb={6}>
            <Heading size="lg" mb={4} color="gray.800">
              Add New Expense
            </Heading>
            <ExpenseForm onAddExpense={handleAddExpense} />
          </Box>

          <Box mt={6} boxShadow="md">
            <CriticalPeriods
              criticalWeeks={criticalWeeks}
              criticalMonths={criticalMonths}
              criticalYears={criticalYears}
            />
          </Box>
        </GridItem>

        {/* Right Column: Weekly Summary and Critical Periods */}
        <GridItem>
          <Box boxShadow="md" p={5} rounded="md" bg="gray.700">
            <Heading size="lg" mb={4} color="white" textAlign="center">
              There are
            </Heading>
            <TodayEventCount selectedDate={new Date()} />
          </Box>
          <Box boxShadow="md" p={5} rounded="md">
            <Heading size="lg" mb={4} color={"white"}>
              Weekly Summary
            </Heading>
            <WeeklySummary weeklyTotals={weeklyTotals} />
          </Box>

          {/* Critical Spending Periods */}
        </GridItem>
      </Grid>

      <Divider my={8} />

      {/* Section for Task Overview */}
      <Stack spacing={6} flex="1 0 auto">
        <Heading color="white" size="lg">
          Home - Task Overview
        </Heading>
        <Box color="white" flex="1 0 auto" overflow="auto">
          <DataTable data={tasks} columns={columns} />
        </Box>
      </Stack>
    </Container>
  );
};

export default HomePage;
