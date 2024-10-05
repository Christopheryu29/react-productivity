import React from "react";
import { Line } from "react-chartjs-2";
import { ChartOptions } from "chart.js";

interface WeeklySummaryLineChartProps {
  weeklyTotals: {
    week: string;
    totalIncome: number;
    totalExpenses: number;
  }[];
}

interface MonthlySummaryLineChartProps {
  monthlyTotals: {
    month: string;
    totalIncome: number;
    totalExpenses: number;
  }[];
}

interface YearlySummaryLineChartProps {
  yearlyTotals: {
    year: string;
    totalIncome: number;
    totalExpenses: number;
  }[];
}

const lineChartOptions: ChartOptions<"line"> = {
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

// Helper function to parse a week string like "Week 1 2024" into a comparable Date
const parseWeekString = (weekString: string): Date => {
  const [, weekNumber, year] = weekString.match(/Week (\d+) (\d+)/) || [];
  const firstDayOfYear = new Date(Number(year), 0, 1);
  const daysOffset = (Number(weekNumber) - 1) * 7;
  return new Date(
    firstDayOfYear.setDate(firstDayOfYear.getDate() + daysOffset)
  );
};

// Helper function to parse a month string like "Jan 2024" into a comparable Date
const parseMonthString = (monthString: string): Date => {
  const [month, year] = monthString.split(" ");
  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  return new Date(Number(year), monthMap[month]);
};

export const WeeklySummaryLineChart: React.FC<WeeklySummaryLineChartProps> = ({
  weeklyTotals,
}) => {
  // Sort weeklyTotals by week in chronological order
  const sortedWeeklyTotals = [...weeklyTotals].sort(
    (a, b) =>
      parseWeekString(a.week).getTime() - parseWeekString(b.week).getTime()
  );

  const data = {
    labels: sortedWeeklyTotals.map((data) => data.week),
    datasets: [
      {
        label: "Total Income",
        data: sortedWeeklyTotals.map((data) => data.totalIncome),
        borderColor: "#68D391",
        backgroundColor: "rgba(104, 211, 145, 0.5)",
        fill: true,
      },
      {
        label: "Total Expenses",
        data: sortedWeeklyTotals.map((data) => data.totalExpenses),
        borderColor: "#FC8181",
        backgroundColor: "rgba(252, 129, 129, 0.5)",
        fill: true,
      },
    ],
  };
  return <Line data={data} options={lineChartOptions} />;
};

export const MonthlySummaryLineChart: React.FC<
  MonthlySummaryLineChartProps
> = ({ monthlyTotals }) => {
  // Sort monthlyTotals by month in chronological order
  const sortedMonthlyTotals = [...monthlyTotals].sort(
    (a, b) =>
      parseMonthString(a.month).getTime() - parseMonthString(b.month).getTime()
  );

  const data = {
    labels: sortedMonthlyTotals.map((data) => data.month),
    datasets: [
      {
        label: "Total Income",
        data: sortedMonthlyTotals.map((data) => data.totalIncome),
        borderColor: "#68D391",
        backgroundColor: "rgba(104, 211, 145, 0.5)",
        fill: true,
      },
      {
        label: "Total Expenses",
        data: sortedMonthlyTotals.map((data) => data.totalExpenses),
        borderColor: "#FC8181",
        backgroundColor: "rgba(252, 129, 129, 0.5)",
        fill: true,
      },
    ],
  };
  return <Line data={data} options={lineChartOptions} />;
};

export const YearlySummaryLineChart: React.FC<YearlySummaryLineChartProps> = ({
  yearlyTotals,
}) => {
  const data = {
    labels: yearlyTotals.map((data) => data.year),
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
  return <Line data={data} options={lineChartOptions} />;
};
