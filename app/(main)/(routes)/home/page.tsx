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
  useBreakpointValue,
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
    <Box
      textAlign="center"
      p={10}
      mb={10}
      bgGradient="linear(to-r, #0f2027, #203a43, #2c5364)"
      rounded="2xl"
      boxShadow="dark-lg"
      border="none"
      transition="background 0.5s ease-in-out"
    >
      <Heading
        size="2xl"
        color="cyan.200"
        mb={5}
        fontWeight="extrabold"
        textShadow="1px 1px 5px rgba(0, 0, 0, 0.6)"
      >
        {formatDate(currentTime)}
      </Heading>
      <Text
        fontSize="4xl"
        color="cyan.100"
        fontWeight="extrabold"
        textShadow="1px 1px 5px rgba(0, 0, 0, 0.6)"
      >
        {formatTime(currentTime)}
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
  const isMobile = useBreakpointValue({ base: true, md: false });

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
  };

  if (loadingTasks || loadingExpenses) {
    return (
      <Container
        maxW="container.xl"
        p={8}
        display="flex"
        alignItems="center"
        justifyContent="center"
        h="100vh"
      >
        <Spinner size="xl" thickness="4px" color="gray.300" />
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" p={isMobile ? 4 : 8} minH="100vh">
      {/* Header with Date and Time */}
      <Box
        textAlign="center"
        p={isMobile ? 6 : 10}
        mb={10}
        className="bg-white dark:bg-[rgba(40,40,55,0.85)] text-gray-800 dark:text-white rounded-2xl shadow-lg backdrop-blur-sm"
      >
        <Heading
          size={isMobile ? "xl" : "2xl"}
          className="text-gray-800 dark:text-white mb-3 font-extrabold"
          textShadow="0px 3px 8px rgba(0, 0, 0, 0.4)"
        >
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Heading>
        <Text
          fontSize={isMobile ? "2xl" : "3xl"}
          className="text-gray-700 dark:text-gray-300 font-medium"
        >
          {new Date().toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </Box>

      {/* Main Content Layout */}
      {isMobile ? (
        // Stack layout for mobile view
        <Stack spacing={6}>
          <Box className="bg-white dark:bg-[rgba(40,40,55,0.85)] text-gray-800 dark:text-white rounded-xl shadow-md p-4">
            <Heading
              size="md"
              className="text-gray-800 dark:text-white mb-3 font-semibold"
            >
              Add New Expense
            </Heading>
            <ExpenseForm onAddExpense={handleAddExpense} />
          </Box>

          <Box className="bg-white dark:bg-[rgba(40,40,55,0.85)] rounded-xl shadow-md">
            <CriticalPeriods
              criticalWeeks={criticalWeeks}
              criticalMonths={criticalMonths}
              criticalYears={criticalYears}
            />
          </Box>

          <Box className="bg-white dark:bg-[rgba(40,40,55,0.85)]  text-center p-4 rounded-xl shadow-lg">
            <Heading
              size="md"
              className="text-gray-800 dark:text-white mb-3 font-semibold"
            >
              Today’s Events
            </Heading>
            <TodayEventCount selectedDate={new Date()} />
          </Box>

          <Box className="bg-white dark:bg-[rgba(40,40,55,0.85)]  rounded-xl shadow-lg">
            <Heading
              size="md"
              className="text-gray-800 dark:text-white mb-3 p-3 text-center font-semibold"
            >
              Weekly Summary
            </Heading>
            <WeeklySummary weeklyTotals={weeklyTotals} />
          </Box>
        </Stack>
      ) : (
        // Grid layout for desktop view
        <Grid templateColumns="1fr 2fr" gap={6} flex="1">
          {/* Left Column: Expense Form and Critical Periods */}
          <GridItem>
            <Box className="bg-white dark:bg-[rgba(40,40,55,0.85)] text-gray-800 dark:text-white rounded-xl shadow-md p-6 mb-6">
              <Heading
                size="md"
                className="text-gray-800 dark:text-white mb-3 font-semibold"
              >
                Add New Expense
              </Heading>
              <ExpenseForm onAddExpense={handleAddExpense} />
            </Box>

            <Box className="bg-white dark:bg-[rgba(40,40,55,0.85)] rounded-xl shadow-md mt-6">
              <CriticalPeriods
                criticalWeeks={criticalWeeks}
                criticalMonths={criticalMonths}
                criticalYears={criticalYears}
              />
            </Box>
          </GridItem>

          {/* Right Column: Today’s Events and Weekly Summary */}
          <GridItem>
            <Box className="bg-white dark:bg-[rgba(40,40,55,0.85)] text-gray-800 dark:text-white text-center p-8 rounded-xl shadow-lg">
              <Heading
                size="lg"
                className="text-gray-800 dark:text-white mb-3 font-semibold"
              >
                Today’s Events
              </Heading>
              <TodayEventCount selectedDate={new Date()} />
            </Box>

            <Box className="bg-white dark:bg-[rgba(40,40,55,0.85)]  text-gray-800 dark:text-white rounded-xl shadow-lg p-8 mt-6">
              <Heading
                size="lg"
                className="text-gray-800 dark:text-white mb-3 font-semibold"
              >
                Weekly Summary
              </Heading>
              <WeeklySummary weeklyTotals={weeklyTotals} />
            </Box>
          </GridItem>
        </Grid>
      )}

      <Divider my={8} borderColor="rgba(255, 255, 255, 0.1)" />

      {/* Task Overview */}
      <Stack spacing={isMobile ? 6 : 8} flex="1 0 auto">
        <Heading
          className="text-gray-800 dark:text-white font-semibold"
          size={isMobile ? "md" : "lg"}
        >
          Task Overview
        </Heading>
        <Box
          className="overflow-auto text-gray-800 dark:text-white rounded-xl shadow-lg  border border-gray-200 dark:border-gray-700"
          style={{
            backgroundColor: "transparent",
            backgroundImage:
              "radial-gradient(circle at center, #303030 0%, #34373f 25%, #2f3246 50%, #303030 100%)",
          }}
        >
          <div className="bg-white dark:bg-transparent rounded-xl shadow-lg">
            <DataTable data={tasks} columns={columns} />
          </div>
        </Box>
      </Stack>
    </Container>
  );
};

export default HomePage;
