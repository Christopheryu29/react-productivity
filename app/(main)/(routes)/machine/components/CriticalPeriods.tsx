import React from "react";
import {
  Box,
  HStack,
  Icon,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Divider,
  Flex,
  Tooltip,
  Stack,
} from "@chakra-ui/react";
import { MdWarning } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import { BiTimeFive } from "react-icons/bi";
import { AiOutlineCalendar, AiOutlineClockCircle } from "react-icons/ai";

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
  const hasCriticalPeriods =
    criticalWeeks.length > 0 ||
    criticalMonths.length > 0 ||
    criticalYears.length > 0;
  const bgColor = useColorModeValue(
    "radial-gradient(circle at center, #303030 0%, #34373f 25%, #2f3246 50%, #303030 100%)",
    "radial-gradient(circle at center, #303030 0%, #34373f 25%, #2f3246 50%, #303030 100%)"
  );

  const textColor = useColorModeValue("#cdd1e0", "#e1e4f0");
  const iconColor = useColorModeValue("#ffb74d", "#ffcc80");
  const checkIconColor = useColorModeValue("#4caf50", "#66bb6a");
  const dividerColor = useColorModeValue(
    "rgba(255, 255, 255, 0.2)",
    "rgba(255, 255, 255, 0.3)"
  );

  return (
    <Box
      w="100%"
      p={8}
      className="rounded-2xl shadow-lg   dark:bg-[radial-gradient(circle at center, #303030 0%, #34373f 25%, #2f3246 50%, #303030 100%)] dark:text-white"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        align="center"
        mb={6}
        spacing={5}
      >
        <Tooltip
          label="Stay alert to key spending periods for financial wellness"
          aria-label="Warning tooltip"
        >
          <Icon as={MdWarning} color={iconColor} boxSize={12} />
        </Tooltip>
        <Heading
          size="lg"
          className="font-bold text-gray-800 dark:text-gray-100 tracking-wide text-shadow-lg text-center md:text-left"
        >
          High Spending Alerts
        </Heading>
      </Stack>
      <Text className="text-gray-700 dark:text-gray-200 text-md font-medium text-justify leading-7 mb-6">
        Identifying these periods can empower you to better manage unexpected
        expenses and maintain budget stability. Review these alerts and make
        informed financial decisions.
      </Text>

      <Divider mt={4} mb={6} borderColor={dividerColor} opacity={0.8} />

      <VStack
        spacing={5}
        align="start"
        mt={4}
        pl={6}
        p={4}
        boxShadow="inset 0 0 15px rgba(255, 183, 77, 0.3)"
      >
        {criticalWeeks.length > 0 && (
          <Box>
            <Flex align="center" mb={2}>
              <Icon as={BiTimeFive} color={iconColor} boxSize={7} mr={2} />
              <Text className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                Significant Weeks:
              </Text>
            </Flex>
            {criticalWeeks.map((week, index) => (
              <Text
                key={index}
                className="ml-8 text-gray-700 dark:text-gray-300 text-md"
              >
                • Week of {week.week}
              </Text>
            ))}
          </Box>
        )}

        {criticalMonths.length > 0 && (
          <Box>
            <Flex align="center" mb={2}>
              <Icon
                as={AiOutlineCalendar}
                color={iconColor}
                boxSize={7}
                mr={2}
              />
              <Text className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                Significant Months:
              </Text>
            </Flex>
            {criticalMonths.map((month, index) => (
              <Text
                key={index}
                className="ml-8 text-gray-700 dark:text-gray-300 text-md"
              >
                • {month.month}
              </Text>
            ))}
          </Box>
        )}

        {criticalYears.length > 0 && (
          <Box>
            <Flex align="center" mb={2}>
              <Icon
                as={AiOutlineClockCircle}
                color={iconColor}
                boxSize={7}
                mr={2}
              />
              <Text className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                Significant Years:
              </Text>
            </Flex>
            {criticalYears.map((year, index) => (
              <Text
                key={index}
                className="ml-8 text-gray-700 dark:text-gray-300 text-md"
              >
                • {year.year}
              </Text>
            ))}
          </Box>
        )}
      </VStack>

      {!hasCriticalPeriods && (
        <HStack mt={10} spacing={5} alignItems="center">
          <Icon as={FaCheckCircle} color={checkIconColor} boxSize={10} />
          <Text className="text-green-600 dark:text-green-400 text-lg font-bold">
            Excellent! No significant spending spikes detected.
          </Text>
        </HStack>
      )}
    </Box>
  );
};

export default CriticalPeriods;
