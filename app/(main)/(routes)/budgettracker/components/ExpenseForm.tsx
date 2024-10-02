// components/ExpenseForm.tsx
"use client";

import React, { useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ExpenseFormProps {
  onAddExpense: (newExpense: {
    amount: number;
    type: "income" | "expense";
    category: string;
  }) => void;
}

interface Expense {
  id: number;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense }) => {
  const [newExpense, setNewExpense] = useState<number>(0);
  const [newExpenseType, setNewExpenseType] = useState<"income" | "expense">(
    "expense"
  );
  const [newCategory, setNewCategory] = useState<string>("");

  const addExpenseMutation = useMutation(api.expense.createExpense);
  const toast = useToast();

  const handleAddExpense = async () => {
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

    try {
      const newEntry = {
        amount: newExpense,
        type: newExpenseType,
        category: newCategory,
        date: new Date().toISOString(),
      };

      await addExpenseMutation(newEntry);
      onAddExpense(newEntry);

      setNewExpense(0);
      setNewCategory("");
      toast({
        title: "Expense Added",
        description: "Your new expense has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({
        title: "Error Adding Expense",
        description: "There was an error adding the expense.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={4}>
      <FormControl>
        <FormLabel htmlFor="amount">Amount</FormLabel>
        <Input
          id="amount"
          placeholder="Amount"
          type="number"
          value={newExpense}
          onChange={(e) => setNewExpense(Number(e.target.value))}
        />
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="type">Type</FormLabel>
        <Select
          id="type"
          placeholder="Select Type"
          value={newExpenseType}
          onChange={(e) =>
            setNewExpenseType(e.target.value as "income" | "expense")
          }
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="category">Category</FormLabel>
        <Select
          id="category"
          placeholder="Select Category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        >
          {newExpenseType === "income" ? (
            <>
              <option value="median_family_income">Median Family Income</option>
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
      </FormControl>
      <Button colorScheme="blue" onClick={handleAddExpense}>
        Add Expense
      </Button>
    </VStack>
  );
};

export default ExpenseForm;
