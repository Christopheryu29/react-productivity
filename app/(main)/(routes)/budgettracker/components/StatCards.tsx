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
  <StatGroup mb={6} gap={4}>
    <Stat p={5} shadow="md" rounded="md">
      <StatLabel color={"white"}>Number of Adults</StatLabel>
      <StatNumber color={"white"}>{numAdults}</StatNumber>
    </Stat>
    <Stat p={5} shadow="md" rounded="md">
      <StatLabel color={"white"}>Number of Children</StatLabel>
      <StatNumber color={"white"}>{numChildren}</StatNumber>
    </Stat>
    <Stat p={5} shadow="md" rounded="md">
      <StatLabel color={"white"}>Total Income</StatLabel>
      <StatNumber color={"white"}>${totalIncome.toFixed(2)}</StatNumber>
    </Stat>
    <Stat p={5} shadow="md" rounded="md">
      <StatLabel color={"white"}>Total Expenses</StatLabel>
      <StatNumber color={"white"}>${totalExpenses.toFixed(2)}</StatNumber>
    </Stat>
    <Stat p={5} shadow="md" rounded="md">
      <StatLabel color={"white"}>Current Balance</StatLabel>
      <StatNumber color={"white"}>${currentBalance.toFixed(2)}</StatNumber>
    </Stat>
  </StatGroup>
);

export default StatCards;
