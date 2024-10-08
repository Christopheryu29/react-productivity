import React, { useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Badge,
  Text,
} from "@chakra-ui/react";
import { MonthlySummaryLineChart } from "./charts/LineChart";
import { Bar, Pie } from "react-chartjs-2";

interface MonthlyTotals {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

interface MonthlySummaryProps {
  monthlyTotals: MonthlyTotals[];
}
const getMaxExpenseCategory = (expensesByCategory: Record<string, number>) => {
  return Object.entries(expensesByCategory).reduce(
    (max, current) => (current[1] > max[1] ? current : max),
    ["", 0]
  );
};

// Helper function to convert month strings into a comparable date object
const parseMonthString = (monthString: string) => {
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
  return new Date(parseInt(year), monthMap[month]);
};

const MonthlySummary: React.FC<MonthlySummaryProps> = ({ monthlyTotals }) => {
  // State to manage which month is expanded
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  // Toggle the expansion of a row
  const toggleExpand = (month: string) => {
    setExpandedMonth(expandedMonth === month ? null : month);
  };

  // Sort monthlyTotals by the parsed date
  const sortedMonthlyTotals = [...monthlyTotals].sort((a, b) => {
    return (
      parseMonthString(a.month).getTime() - parseMonthString(b.month).getTime()
    );
  });

  return (
    <Box boxShadow="lg" p={5} rounded="lg">
      <Heading size="md" mb={4} color="white">
        <Badge colorScheme="green">Monthly Summary</Badge>
      </Heading>

      {/* Line Chart for Monthly Trends */}
      <Box mb={6} mt={6}>
        <Heading size="sm" color="white" mb={2}>
          Monthly Income vs Expenses (Line Chart)
        </Heading>
        <MonthlySummaryLineChart monthlyTotals={sortedMonthlyTotals} />
      </Box>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th color="white">Month</Th>
            <Th color="white">Total Income</Th>
            <Th color="white">Total Expenses</Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedMonthlyTotals.map((total, index) => {
            // Find the category with the highest expense
            const [maxCategory, maxAmount] = getMaxExpenseCategory(
              total.expensesByCategory
            );

            // Check if this row is expanded
            const isExpanded = expandedMonth === total.month;

            // Prepare data for charts
            const pieData = {
              labels: Object.keys(total.expensesByCategory),
              datasets: [
                {
                  data: Object.values(total.expensesByCategory),
                  backgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56",
                    "#4BC0C0",
                    "#9966FF",
                    "#FF9F40",
                  ],
                  hoverBackgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56",
                    "#4BC0C0",
                    "#9966FF",
                    "#FF9F40",
                  ],
                },
              ],
            };

            const barData = {
              labels: ["Income", "Expenses"],
              datasets: [
                {
                  label: "Amount ($)",
                  data: [total.totalIncome, total.totalExpenses],
                  backgroundColor: ["#4BC0C0", "#FF6384"],
                },
              ],
            };

            return (
              <React.Fragment key={index}>
                <Tr
                  onClick={() => toggleExpand(total.month)}
                  cursor="pointer"
                  _hover={{ bg: "gray.700" }}
                >
                  <Td color="white">{total.month}</Td>
                  <Td color="white">${total.totalIncome.toFixed(2)}</Td>
                  <Td color="white">${total.totalExpenses.toFixed(2)}</Td>
                </Tr>
                {isExpanded && (
                  <>
                    {/* Display the most significant expense */}
                    <Tr>
                      <Td colSpan={3} color="white">
                        <Text fontWeight="bold" color="red.500">
                          Highest Expense: {maxCategory} - $
                          {maxAmount.toFixed(2)}
                        </Text>
                      </Td>
                    </Tr>
                    {/* Income by Category */}
                    <Tr>
                      <Td colSpan={3} color="white">
                        <Box
                          mt={2}
                          p={4}
                          rounded="md"
                          border="1px solid"
                          borderColor="green.500"
                        >
                          <Heading size="sm" color="white" mb={2}>
                            Income Breakdown
                          </Heading>
                          <Table size="sm">
                            <Thead>
                              <Tr>
                                <Th color="white">Category</Th>
                                <Th color="white">Amount ($)</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {Object.entries(total.incomeByCategory).map(
                                ([category, amount], i) => (
                                  <Tr key={i}>
                                    <Td color="white">{category}</Td>
                                    <Td color="white">${amount.toFixed(2)}</Td>
                                  </Tr>
                                )
                              )}
                            </Tbody>
                          </Table>
                        </Box>
                      </Td>
                    </Tr>
                    {/* Expenses by Category */}
                    <Tr>
                      <Td colSpan={3} color="white">
                        <Box
                          mt={2}
                          p={4}
                          rounded="md"
                          border="1px solid"
                          borderColor="red.500"
                        >
                          <Heading size="sm" color="white" mb={2}>
                            Expenses Breakdown
                          </Heading>
                          <Table size="sm">
                            <Thead>
                              <Tr>
                                <Th color="white">Category</Th>
                                <Th color="white">Amount ($)</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {Object.entries(total.expensesByCategory).map(
                                ([category, amount], i) => (
                                  <Tr key={i}>
                                    <Td color="white">{category}</Td>
                                    <Td color="white">${amount.toFixed(2)}</Td>
                                  </Tr>
                                )
                              )}
                            </Tbody>
                          </Table>
                        </Box>
                      </Td>
                    </Tr>
                    {/* Pie Chart for Expenses Breakdown */}
                    <Tr>
                      <Td colSpan={3}>
                        <Box mt={4} mb={4} w="100%">
                          <Heading size="sm" color="white" mb={2}>
                            Expenses Breakdown (Pie Chart)
                          </Heading>
                          <Pie data={pieData} />
                        </Box>
                      </Td>
                    </Tr>
                    {/* Bar Chart for Income vs. Expenses */}
                    <Tr>
                      <Td colSpan={3}>
                        <Box mt={4} mb={4} w="100%">
                          <Heading size="sm" color="white" mb={2}>
                            Income vs Expenses (Bar Chart)
                          </Heading>
                          <Bar data={barData} />
                        </Box>
                      </Td>
                    </Tr>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
};

export default MonthlySummary;