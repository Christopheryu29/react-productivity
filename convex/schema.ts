import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"]),

  todos: defineTable({
    text: v.string(),
    userId: v.string(),
    isCompleted: v.boolean(),
  }).index("by_user", ["userId"]),

  events: defineTable({
    title: v.string(),
    userId: v.string(),
    startDate: v.string(), // Changed to string to store ISO date strings
    endDate: v.string(), // Changed to string to store ISO date strings
    description: v.optional(v.string()),
    isAllDay: v.boolean(),
    completed: v.boolean(),
    color: v.optional(v.string()),
    recurringDay: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_date_range", ["startDate", "endDate"])
    .index("by_user_and_date", ["userId", "startDate"]),

  expenses: defineTable({
    id: v.number(), // Use number for unique identifier
    amount: v.number(),
    type: v.string(), // 'income' or 'expense'
    date: v.string(), // ISO date string
    category: v.string(),
  })
    .index("by_type_and_date", ["type", "date"])
    .index("by_category_and_date", ["category", "date"]),

  task: defineTable({
    id: v.string(), // Task ID as a string to match the provided example
    title: v.string(),
    status: v.string(), // 'in progress', 'completed', etc.
    label: v.string(), // 'documentation', 'urgent', etc.
    priority: v.string(), // 'low', 'medium', 'high'
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),

  household: defineTable({
    userId: v.string(), // Unique identifier for the user
    numAdults: v.number(), // Number of adults
    numChildren: v.number(), // Number of children
    lastUpdated: v.string(), // Date when the last update was made
  }).index("by_user", ["userId"]),

  financial: defineTable({
    userId: v.string(),
    housingCost: v.number(),
    foodCost: v.number(),
    transportationCost: v.number(),
    healthcareCost: v.number(),
    otherNecessitiesCost: v.number(),
    childcareCost: v.number(),
    taxes: v.number(),
    totalExpenses: v.number(),
    medianFamilyIncome: v.number(), // You can dynamically calculate or update this as needed
  }).index("by_user", ["userId"]),

  periodic: defineTable({
    userId: v.string(), // Unique identifier for the user
    periodType: v.string(), // 'weekly' or 'monthly'
    periodLabel: v.string(), // E.g., 'Week 35 2024' or 'August 2024'
    totalIncome: v.number(), // Total income for the period
    totalExpenses: v.number(), // Total expenses for the period
    incomeByCategory: v.object({
      medianFamilyIncome: v.number(),
    }), // Income breakdown by category
    expensesByCategory: v.object({
      housingCost: v.number(),
      foodCost: v.number(),
      transportationCost: v.number(),
      healthcareCost: v.number(),
      otherNecessitiesCost: v.number(),
      childcareCost: v.number(),
      taxes: v.number(),
    }), // Expenses breakdown by category
    startDate: v.string(), // Start date of the period (ISO format)
    endDate: v.string(), // End date of the period (ISO format)
  }).index("by_user_and_period", ["userId", "periodType", "periodLabel"]),
});
