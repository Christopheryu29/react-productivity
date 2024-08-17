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
import "./budget.css";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
          newCategory || (newExpenseType === "income" ? "Salary" : "Food"), // Adjusting default category for simplicity
      });
      setNewExpense(0);
      setNewCategory("");
    }
  };

  const deleteExpenseHandler = async (id: number) => {
    await deleteExpenseMutation({ id });
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
          totalIncome,
          totalExpenses,
          totalSavings,
          monthlyTotals.reduce((acc, mt) => acc + mt.totalSavings, 0),
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
        ],
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
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Wallet</h1>

      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-semibold mb-2">
          Add New{" "}
          {newExpenseType === "income"
            ? "Income"
            : newExpenseType === "savings"
            ? "Savings"
            : "Expense"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            type="number"
            value={newExpense}
            onChange={(e) => setNewExpense(Number(e.target.value))}
            placeholder="Amount"
            className="p-2 border rounded"
          />
          <select
            value={newExpenseType}
            onChange={(e) =>
              setNewExpenseType(
                e.target.value as "income" | "expense" | "savings"
              )
            }
            className="p-2 border rounded"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="savings">Savings</option>
          </select>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="p-2 border rounded"
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
          </select>
        </div>
        <button
          onClick={addExpense}
          className="p-2 bg-blue-500 text-white rounded w-full"
        >
          Add{" "}
          {newExpenseType === "income"
            ? "Income"
            : newExpenseType === "savings"
            ? "Savings"
            : "Expense"}
        </button>
      </div>

      <div className="mb-6 border-b pb-4 chart-container">
        <h2 className="text-xl font-semibold mb-2">
          Income, Expenses, and Savings
        </h2>
        <div className="chart">
          <Pie data={combinedData} options={chartOptions} />
        </div>
      </div>

      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p>Total Income: ${totalIncome}</p>
        <p>Total Expenses: ${totalExpenses}</p>
        <p>Total Savings: ${totalSavings}</p>
        <p>Current Balance: ${currentBalance}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Expenses</h2>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Amount</th>
              <th className="border px-4 py-2">Type</th>
              <th className="border px-4 py-2">Category</th>
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="border px-4 py-2">${expense.amount}</td>
                <td className="border px-4 py-2">{expense.type}</td>
                <td className="border px-4 py-2">{expense.category}</td>
                <td className="border px-4 py-2">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() =>
                      startEditing(
                        expense.id,
                        expense.amount,
                        expense.type,
                        expense.category
                      )
                    }
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteExpenseHandler(expense.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId !== null && (
        <div className="mb-6 border-b pb-4">
          <h2 className="text-xl font-semibold mb-2">Edit Expense</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(Number(e.target.value))}
              placeholder="Amount"
              className="p-2 border rounded"
            />
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="p-2 border rounded"
            >
              {newExpenseType === "income" ? (
                <>
                  <option value="Salary">Salary</option>
                  <option value="Investment">Investment</option>
                  <option value="Freelancing">Freelancing</option>
                  <option value="Other">Other</option>
                </>
              ) : (
                <>
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transport">Transport</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Mortgage">Mortgage</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>
          <button
            onClick={editExpense}
            className="p-2 bg-blue-500 text-white rounded w-full"
          >
            Save Changes
          </button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Monthly Totals</h2>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Month</th>
              <th className="border px-4 py-2">Total Income</th>
              <th className="border px-4 py-2">Total Expenses</th>
              <th className="border px-4 py-2">Total Savings</th>
            </tr>
          </thead>
          <tbody>
            {calculateMonthlyTotals().map((total, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{total.month}</td>
                <td className="border px-4 py-2">${total.totalIncome}</td>
                <td className="border px-4 py-2">${total.totalExpenses}</td>
                <td className="border px-4 py-2">${total.totalSavings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetTrackerPage;
