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

  // Schema definition in your schema file
  expenses: defineTable({
    id: v.number(), // Use number for unique identifier
    userId: v.string(), // Add userId field to associate each entry with a specific user
    amount: v.number(),
    type: v.string(), // 'income' or 'expense'
    date: v.string(), // ISO date string
    category: v.string(),
  })
    .index("by_user_and_date", ["userId", "date"]) // Add index on userId for efficient querying
    .index("by_type_and_date", ["type", "date"])
    .index("by_category_and_date", ["category", "date"]),

  task: defineTable({
    id: v.string(), // Task ID as a string
    userId: v.string(), // Add userId to link task to a specific user
    title: v.string(),
    status: v.string(), // 'in progress', 'completed', etc.
    label: v.string(), // 'documentation', 'urgent', etc.
    priority: v.string(), // 'low', 'medium', 'high'
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_user", ["userId"]),

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

  target: defineTable({
    userId: v.string(), // Unique identifier for the user
    targetAmount: v.number(), // The user's target savings for the year
    year: v.number(), // The year for which the target applies
    createdAt: v.string(), // ISO date when the target was created
  }).index("by_user", ["userId"]),
});
