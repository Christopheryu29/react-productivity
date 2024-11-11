import React, { useState } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Heading,
  Badge,
  Text,
} from "@chakra-ui/react";
import { YearlySummaryLineChart } from "./charts/LineChart";
import { Bar, Pie } from "react-chartjs-2";

interface YearlyTotals {
  year: string;
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>; // Add this field
  expensesByCategory: Record<string, number>; // Add this field
}

interface YearlySummaryProps {
  yearlyTotals: YearlyTotals[];
}
const getMaxExpenseCategory = (expensesByCategory: Record<string, number>) => {
  return Object.entries(expensesByCategory).reduce(
    (max, current) => (current[1] > max[1] ? current : max),
    ["", 0]
  );
};

const YearlySummary: React.FC<YearlySummaryProps> = ({ yearlyTotals }) => {
  // State to manage which year is expanded
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  // Toggle the expansion of a row
  const toggleExpand = (year: string) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  // Sort yearlyTotals by the year in ascending order
  const sortedYearlyTotals = [...yearlyTotals].sort((a, b) =>
    a.year.localeCompare(b.year)
  );

  return (
    <Box boxShadow="lg" p={[3, 6]} rounded="lg" overflowX="auto">
      <Heading size="md" mb={4} color="white">
        <Badge colorScheme="purple">Yearly Summary</Badge>
      </Heading>

      {/* Line Chart for Yearly Trends */}
      <Box mb={6} mt={6}>
        <Heading size="sm" color="white" mb={2}>
          Yearly Income vs Expenses (Line Chart)
        </Heading>
        <YearlySummaryLineChart yearlyTotals={sortedYearlyTotals} />
      </Box>

      <Box overflowX="auto">
        <Table
          variant="simple"
          size="md"
          style={{ borderCollapse: "separate", borderSpacing: "0 10px" }}
          width="100%"
        >
          <Thead>
            <Tr>
              <Th
                color="white"
                px={[2, 4]}
                py={4}
                textAlign="center"
                width="33%"
              >
                Year
              </Th>
              <Th
                color="white"
                px={[2, 4]}
                py={4}
                textAlign="center"
                width="33%"
              >
                Total Income
              </Th>
              <Th
                color="white"
                px={[2, 4]}
                py={4}
                textAlign="center"
                width="33%"
              >
                Total Expenses
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedYearlyTotals.map((total, index) => {
              // Find the category with the highest expense
              const [maxCategory, maxAmount] = getMaxExpenseCategory(
                total.expensesByCategory
              );

              // Check if this row is expanded
              const isExpanded = expandedYear === total.year;

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
                    onClick={() => toggleExpand(total.year)}
                    cursor="pointer"
                    _hover={{ bg: "gray.700" }}
                    width="100%"
                  >
                    <Td
                      color="white"
                      px={[2, 4]}
                      py={3}
                      textAlign="center"
                      width="33%"
                    >
                      {total.year}
                    </Td>
                    <Td
                      color="white"
                      px={[2, 4]}
                      py={3}
                      textAlign="center"
                      width="33%"
                    >
                      ${total.totalIncome.toFixed(2)}
                    </Td>
                    <Td
                      color="white"
                      px={[2, 4]}
                      py={3}
                      textAlign="center"
                      width="33%"
                    >
                      ${total.totalExpenses.toFixed(2)}
                    </Td>
                  </Tr>
                  {isExpanded && (
                    <>
                      {/* Display the most significant expense */}
                      <Tr>
                        <Td
                          colSpan={3}
                          color="white"
                          px={[2, 4]}
                          py={2}
                          textAlign="center"
                        >
                          <Text fontWeight="bold" color="red.500">
                            Highest Expense: {maxCategory} - $
                            {maxAmount.toFixed(2)}
                          </Text>
                        </Td>
                      </Tr>
                      {/* Income by Category */}
                      <Tr>
                        <Td colSpan={3} px={[2, 4]} py={2}>
                          <Box
                            mt={2}
                            p={4}
                            rounded="md"
                            border="1px solid"
                            borderColor="green.500"
                            overflowX="auto"
                          >
                            <Heading size="sm" color="white" mb={2}>
                              Income Breakdown
                            </Heading>
                            <Table size="sm" width="100%">
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
                                      <Td color="white">
                                        ${amount.toFixed(2)}
                                      </Td>
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
                        <Td colSpan={3} px={[2, 4]} py={2}>
                          <Box
                            mt={2}
                            p={4}
                            rounded="md"
                            border="1px solid"
                            borderColor="red.500"
                            overflowX="auto"
                          >
                            <Heading size="sm" color="white" mb={2}>
                              Expenses Breakdown
                            </Heading>
                            <Table size="sm" width="100%">
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
                                      <Td color="white">
                                        ${amount.toFixed(2)}
                                      </Td>
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
                        <Td colSpan={3} px={[2, 4]} py={2}>
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
                        <Td colSpan={3} px={[2, 4]} py={2}>
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
    </Box>
  );
};

export default YearlySummary;
