// components/charts/ExpenseBreakdownBarChart.tsx

import React from "react";
import { Bar } from "react-chartjs-2";

interface Expense {
  id: number;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
}

interface ExpenseBreakdownBarChartProps {
  expenses: Expense[];
}

const ExpenseBreakdownBarChart: React.FC<ExpenseBreakdownBarChartProps> = ({
  expenses,
}) => {
  // Calculate totals by category
  const categoryTotals = expenses.reduce(
    (acc: { [key: string]: number }, expense: Expense) => {
      if (expense.type === "expense") {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      }
      return acc;
    },
    {}
  );

  // Prepare data for the bar chart
  const data = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: "Expenses by Category",
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#C9CBCF",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Set to true if you want to display the legend
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.label}: $${context.raw.toFixed(2)}`,
        },
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
  };

  return <Bar data={data} options={options} />;
};

export default ExpenseBreakdownBarChart;
