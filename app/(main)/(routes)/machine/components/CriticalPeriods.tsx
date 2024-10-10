import React from "react";
import { Box, HStack, Icon, Heading, Text } from "@chakra-ui/react";
import { MdWarning } from "react-icons/md";

interface CriticalPeriodsProps {
  criticalWeeks: { week: string }[];
  criticalMonths: { month: string }[];
  criticalYears: { year: string }[];
}

const CriticalPeriods: React.FC<CriticalPeriodsProps> = ({
  criticalWeeks,
  criticalMonths,
  criticalYears,
}) => {
  return (
    <Box
      w="100%"
      p={6}
      bg="orange.50"
      borderRadius="md"
      boxShadow="lg"
      border="1px solid"
      borderColor="orange.200"
    >
      <HStack spacing={3} mb={3}>
        <Icon as={MdWarning} color="orange.600" boxSize={6} />
        <Heading size="md" color="orange.700">
          Alert: Key Spending Periods
        </Heading>
      </HStack>
      <Text color="orange.700" fontWeight="medium">
        We&apos;ve identified certain time periods where your spending has
        spiked. It&apos;s important to pay attention to these times and review
        your budget for any unexpected or recurring expenses:
      </Text>

      {criticalWeeks.length > 0 && (
        <>
          <Text mt={4} fontWeight="bold" color="orange.600">
            High-Spend Weeks:
          </Text>
          {criticalWeeks.map((week, index) => (
            <Text key={index} color="orange.600">
              • Week of {week.week}
            </Text>
          ))}
        </>
      )}

      {criticalMonths.length > 0 && (
        <>
          <Text mt={4} fontWeight="bold" color="orange.600">
            High-Spend Months:
          </Text>
          {criticalMonths.map((month, index) => (
            <Text key={index} color="orange.600">
              • {month.month}
            </Text>
          ))}
        </>
      )}

      {criticalYears.length > 0 && (
        <>
          <Text mt={4} fontWeight="bold" color="orange.600">
            High-Spend Years:
          </Text>
          {criticalYears.map((year, index) => (
            <Text key={index} color="orange.600">
              • {year.year}
            </Text>
          ))}
        </>
      )}

      {criticalWeeks.length === 0 &&
        criticalMonths.length === 0 &&
        criticalYears.length === 0 && (
          <Text mt={4} color="green.600" fontWeight="bold">
            Excellent! No significant spending surges detected.
          </Text>
        )}
    </Box>
  );
};

export default CriticalPeriods;
