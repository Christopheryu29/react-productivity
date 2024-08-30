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
  type: "income" | "expense";
  date: string;
  category: string;
}

interface MonthlyTotals {
  month: string;
  totalIncome: number;
  totalExpenses: number;
}

interface CategoryTotals {
  housingCost: number;
  foodCost: number;
  transportationCost: number;
  healthcareCost: number;
  otherNecessitiesCost: number;
  childcareCost: number;
  taxes: number;
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
  const [housingCost, setHousingCost] = useState<number>(0);
  const [foodCost, setFoodCost] = useState<number>(0);
  const [transportationCost, setTransportationCost] = useState<number>(0);
  const [healthcareCost, setHealthcareCost] = useState<number>(0);
  const [otherNecessitiesCost, setOtherNecessitiesCost] = useState<number>(0);
  const [childcareCost, setChildcareCost] = useState<number>(0);
  const [taxes, setTaxes] = useState<number>(0);
  const [medianFamilyIncome, setMedianFamilyIncome] = useState<number>(0);
  const updateFinancialSummaryMutation = useMutation(
    api.financial.updateFinancialSummary
  );

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
      { month: monthYear, totalIncome, totalExpenses },
    ];
    setMonthlyTotals(newMonthlyTotals);
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
    }));

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
      await addExpenseMutation({
        amount: newExpense,
        type: newExpenseType,
        date: new Date().toISOString(),
        category: newCategory,
      });
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

      // Prepare data for updating financial summary
      const categoryTotals = getCategoryTotals();
      const totalExpenses = Object.values(categoryTotals).reduce(
        (acc, curr) => acc + curr,
        0
      );
      const totalIncome = expenses.reduce(
        (acc, exp) => acc + (exp.type === "income" ? exp.amount : 0),
        0
      );

      // Update financial summary
      await updateFinancialSummaryMutation({
        userId: "your-user-id", // Make sure this ID is correctly retrieved
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

  return (
    <Container maxW="container.xl" p={4}>
      <Heading as="h1" size="2xl" textAlign="center" mb={6} color={"white"}>
        Budget Tracker
      </Heading>
      <StatGroup mb={6}>
        <Stat>
          <StatLabel color={"white"}>Number of Adults</StatLabel>
          <StatNumber color={"white"}>{numAdults}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel color={"white"}>Number of Children</StatLabel>
          <StatNumber color={"white"}>{numChildren}</StatNumber>
        </Stat>
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
          <StatLabel color={"white"}>Current Balance</StatLabel>
          <StatNumber color={"white"}>${currentBalance}</StatNumber>
        </Stat>
      </StatGroup>

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

      <Box mt={10} mb={6} width="40%" mx="auto">
        <Pie data={combinedData} options={chartOptions} />
      </Box>
      <Box boxShadow="lg" p={5} rounded="md" bg="white">
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

      <Flex direction={["column", "row"]} gap={5} mt={"10"}>
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
              </Tr>
            </Thead>
            <Tbody>
              {monthlyTotals.map((total, index) => (
                <Tr key={index}>
                  <Td>{total.month}</Td>
                  <Td>${total.totalIncome}</Td>
                  <Td>${total.totalExpenses}</Td>
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
