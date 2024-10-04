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
  // State to manage which week is expanded
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // Toggle the expansion of a row
  const toggleExpand = (week: string) => {
    setExpandedWeek(expandedWeek === week ? null : week);
  };

  return (
    <Box boxShadow="lg" p={5} rounded="lg">
      <Heading size="md" mb={4} color="white">
        <Badge colorScheme="blue">Weekly Summary</Badge>
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th color="white">Week</Th>
            <Th color="white">Total Income</Th>
            <Th color="white">Total Expenses</Th>
          </Tr>
        </Thead>
        <Tbody>
          {weeklyTotals.map((total, index) => {
            // Find the category with the highest expense
            const [maxCategory, maxAmount] = getMaxExpenseCategory(
              total.expensesByCategory
            );

            // Check if this row is expanded
            const isExpanded = expandedWeek === total.week;

            return (
              <React.Fragment key={index}>
                <Tr
                  onClick={() => toggleExpand(total.week)}
                  cursor="pointer"
                  _hover={{ bg: "gray.700" }}
                >
                  <Td color="white">{total.week}</Td>
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

export default WeeklySummary;
