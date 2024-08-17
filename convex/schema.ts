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

  tasks: defineTable({
    id: v.string(), // Task ID as a string to match the provided example
    title: v.string(),
    status: v.string(), // 'in progress', 'completed', etc.
    label: v.string(), // 'documentation', 'urgent', etc.
    priority: v.string(), // 'low', 'medium', 'high'
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),
});
