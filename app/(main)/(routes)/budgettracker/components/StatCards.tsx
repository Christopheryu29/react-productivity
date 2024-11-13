import React from "react";
import { Stat, StatLabel, StatNumber, StatGroup } from "@chakra-ui/react";

interface StatCardsProps {
  numAdults: number;
  numChildren: number;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
}

const StatCards: React.FC<StatCardsProps> = ({
  numAdults,
  numChildren,
  totalIncome,
  totalExpenses,
  currentBalance,
}) => (
  <StatGroup
    mt={6}
    mb={6}
    gap={4}
    display="flex"
    justifyContent="center"
    flexWrap="wrap"
  >
    <Stat
      p={6}
      minH="120px" // Set a minimum height to make all cards uniform
      shadow="lg"
      rounded="lg"
      className="bg-white dark:bg-[hsla(240,3%,12%,1)] text-gray-800 dark:text-white transform hover:scale-105"
    >
      <StatLabel className="text-gray-600 dark:text-gray-400 font-semibold">
        Number of Adults
      </StatLabel>
      <StatNumber className="text-gray-900 dark:text-gray-100 font-bold text-xl">
        {numAdults}
      </StatNumber>
    </Stat>
    <Stat
      p={6}
      minH="120px"
      shadow="lg"
      rounded="lg"
      className="bg-white dark:bg-[hsla(240,3%,12%,1)] text-gray-800 dark:text-white transform hover:scale-105"
    >
      <StatLabel className="text-gray-600 dark:text-gray-400 font-semibold">
        Number of Children
      </StatLabel>
      <StatNumber className="text-gray-900 dark:text-gray-100 font-bold text-xl">
        {numChildren}
      </StatNumber>
    </Stat>
    <Stat
      p={6}
      minH="120px"
      shadow="lg"
      rounded="lg"
      className="bg-white dark:bg-[hsla(240,3%,12%,1)] text-gray-800 dark:text-white transform hover:scale-105"
    >
      <StatLabel className="text-gray-600 dark:text-gray-400 font-semibold">
        Total Income
      </StatLabel>
      <StatNumber className="text-green-500 dark:text-green-300 font-bold text-xl">
        ${totalIncome.toFixed(2)}
      </StatNumber>
    </Stat>
    <Stat
      p={6}
      minH="120px"
      shadow="lg"
      rounded="lg"
      className="bg-white dark:bg-[hsla(240,3%,12%,1)] text-gray-800 dark:text-white transform hover:scale-105"
    >
      <StatLabel className="text-gray-600 dark:text-gray-400 font-semibold">
        Total Expenses
      </StatLabel>
      <StatNumber className="text-red-500 dark:text-red-300 font-bold text-xl">
        ${totalExpenses.toFixed(2)}
      </StatNumber>
    </Stat>
    <Stat
      p={6}
      minH="120px"
      shadow="lg"
      rounded="lg"
      className="bg-white dark:bg-[hsla(240,3%,12%,1)] text-gray-800 dark:text-white transform hover:scale-105"
    >
      <StatLabel className="text-gray-600 dark:text-gray-400 font-semibold">
        Current Balance
      </StatLabel>
      <StatNumber className="text-blue-500 dark:text-blue-300 font-bold text-xl">
        ${currentBalance.toFixed(2)}
      </StatNumber>
    </Stat>
  </StatGroup>
);

export default StatCards;
