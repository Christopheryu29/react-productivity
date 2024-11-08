// components/ExpenseForm.tsx
"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import the date picker styles

interface ExpenseFormProps {
  onAddExpense: (newExpense: {
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
  }) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense }) => {
  const [newExpense, setNewExpense] = useState<number>(0);
  const [newExpenseType, setNewExpenseType] = useState<"income" | "expense">(
    "expense"
  );
  const [newCategory, setNewCategory] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Default to the current date

  const addExpenseMutation = useMutation(api.expense.createExpense);
  const toast = useToast();

  const handleAddExpense = async () => {
    // Validate inputs before proceeding
    if (newExpense <= 0 || !newCategory || !selectedDate) {
      toast({
        title: "Invalid Input",
        description:
          "Please enter a valid amount, select a category, and pick a date.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Prepare the new entry
    const newEntry = {
      amount: newExpense,
      type: newExpenseType,
      category: newCategory,
      date: selectedDate.toISOString(),
    };

    // Attempt to add expense via mutation without any error handling
    addExpenseMutation(newEntry); // Do not await if you don't want to handle errors synchronously

    // Always proceed with the success actions
    onAddExpense(newEntry);
    toast({
      title: "Expense Added",
      description: "Your new expense has been added successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    // Reset form fields after success actions
    setNewExpense(0);
    setNewCategory("");
    setSelectedDate(new Date());
  };

  const bgColor = useColorModeValue("#303030", "#303030");

  return (
    <Box
      bg={bgColor}
      p={6}
      borderRadius="lg"
      boxShadow="2xl"
      w="full"
      maxW="400px"
      color="whiteAlpha.900"
    >
      <VStack spacing={4}>
        <FormControl>
          <FormLabel htmlFor="amount">Amount</FormLabel>
          <Input
            id="amount"
            placeholder="Amount"
            type="number"
            value={newExpense}
            onChange={(e) => setNewExpense(Number(e.target.value))}
            bg="whiteAlpha.200"
            color="whiteAlpha.900"
            _placeholder={{ color: "whiteAlpha.600" }}
            focusBorderColor="blue.400"
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
            bg="whiteAlpha.200"
            color="whiteAlpha.900"
            _placeholder={{ color: "whiteAlpha.600" }}
            focusBorderColor="blue.400"
          >
            <option value="income" style={{ color: "black" }}>
              Income
            </option>
            <option value="expense" style={{ color: "black" }}>
              Expense
            </option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="category">Category</FormLabel>
          <Select
            id="category"
            placeholder="Select Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            bg="whiteAlpha.200"
            color="whiteAlpha.900"
            _placeholder={{ color: "whiteAlpha.600" }}
            focusBorderColor="blue.400"
          >
            {newExpenseType === "income" ? (
              <>
                <option value="median_family_income" style={{ color: "black" }}>
                  Median Family Income
                </option>
                <option value="Other" style={{ color: "black" }}>
                  Other
                </option>
              </>
            ) : (
              <>
                <option value="housing_cost" style={{ color: "black" }}>
                  Housing Cost
                </option>
                <option value="food_cost" style={{ color: "black" }}>
                  Food Cost
                </option>
                <option value="transportation_cost" style={{ color: "black" }}>
                  Transportation Cost
                </option>
                <option value="healthcare_cost" style={{ color: "black" }}>
                  Healthcare Cost
                </option>
                <option
                  value="other_necessities_cost"
                  style={{ color: "black" }}
                >
                  Other Necessities Cost
                </option>
                <option value="childcare_cost" style={{ color: "black" }}>
                  Childcare Cost
                </option>
                <option value="taxes" style={{ color: "black" }}>
                  Taxes
                </option>
              </>
            )}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="date" fontWeight="bold" fontSize="sm">
            Selected Date
          </FormLabel>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            showPopperArrow={false}
            popperContainer={({ children }) => (
              <div style={{ zIndex: 1000, position: "relative" }}>
                {children}
              </div>
            )}
            portalId="date-picker-portal" // Ensures DatePicker is rendered within a portal
            className="chakra-datepicker"
            customInput={
              <Input
                bg="transparent"
                color="white"
                _placeholder={{ color: "gray.400" }}
                focusBorderColor="blue.400"
                placeholder="Select Date"
              />
            }
          />
        </FormControl>

        <Button colorScheme="blue" onClick={handleAddExpense} width="full">
          Add Expense
        </Button>
      </VStack>
    </Box>
  );
};

export default ExpenseForm;
