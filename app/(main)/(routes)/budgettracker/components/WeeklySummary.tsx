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
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from "chart.js";
import { WeeklySummaryLineChart } from "./charts/LineChart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
);

interface WeeklyTotals {
  week: string;
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

interface WeeklySummaryProps {
  weeklyTotals: WeeklyTotals[];
}

const getMaxExpenseCategory = (expensesByCategory: Record<string, number>) => {
  return Object.entries(expensesByCategory).reduce(
    (max, current) => (current[1] > max[1] ? current : max),
    ["", 0]
  );
};

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ weeklyTotals }) => {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const toggleExpand = (week: string) => {
    setExpandedWeek(expandedWeek === week ? null : week);
  };

  const sortedWeeklyTotals = [...weeklyTotals].sort((a, b) => {
    const weekNumberA = parseInt(a.week.replace(/\D/g, ""));
    const weekNumberB = parseInt(b.week.replace(/\D/g, ""));
    return weekNumberA - weekNumberB;
  });

  return (
    <Box boxShadow="lg" p={[3, 6]} rounded="lg" overflowX="auto">
      <Heading size="md" mb={4} color="white">
        <Badge colorScheme="blue">Weekly Summary</Badge>
      </Heading>

      <Box mb={6} mt={6}>
        <Heading size="sm" color="white" mb={2}>
          Weekly Income vs Expenses (Line Chart)
        </Heading>
        <WeeklySummaryLineChart weeklyTotals={sortedWeeklyTotals} />
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
                Week
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
            {sortedWeeklyTotals.map((total, index) => {
              const [maxCategory, maxAmount] = getMaxExpenseCategory(
                total.expensesByCategory
              );
              const isExpanded = expandedWeek === total.week;

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
                    onClick={() => toggleExpand(total.week)}
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
                      {total.week}
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

export default WeeklySummary;
