"use client";

import React, { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api"; // Ensure this is correctly pointing to your generated API client

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

function FinancialAdviceForm() {
  const [query, setQuery] = useState("");
  const [advice, setAdvice] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);

  const fetchExpenses = useQuery(api.expense.getExpenses);

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

  const getAdvice = useAction(api.openai.doSomething); // Use action from generated API

  const handleAdviceRequest = async () => {
    if (query) {
      const result = await getAdvice({ query });
      setAdvice(result || "No advice available at this moment."); // Provide a default message in case of null
    }
  };

  return (
    <div>
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p>Total Income: ${totalIncome}</p>
        <p>Total Expenses: ${totalExpenses}</p>
        <p>Total Savings: ${totalSavings}</p>
        <p>Current Balance: ${currentBalance}</p>
      </div>
      <tbody>
        {expenses.map((expense) => (
          <tr key={expense.id}>
            <td className="border px-4 py-2">${expense.amount}</td>
            <td className="border px-4 py-2">{expense.type}</td>
            <td className="border px-4 py-2">{expense.category}</td>
            <td className="border px-4 py-2">
              {new Date(expense.date).toLocaleDateString()}
            </td>
            <td className="border px-4 py-2"></td>
          </tr>
        ))}
      </tbody>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a financial question"
      />
      <button onClick={handleAdviceRequest}>Get Advice</button>
      <p>Advice: {advice}</p>
    </div>
  );
}

export default FinancialAdviceForm;
