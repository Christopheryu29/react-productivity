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
    startDate: v.string(),
    endDate: v.string(),
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
    id: v.number(),
    userId: v.string(),
    amount: v.number(),
    type: v.string(),
    date: v.string(),
    category: v.string(),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_type_and_date", ["type", "date"])
    .index("by_category_and_date", ["category", "date"]),

  task: defineTable({
    id: v.string(),
    userId: v.string(),
    title: v.string(),
    status: v.string(),
    label: v.string(),
    priority: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_user", ["userId"]),

  household: defineTable({
    userId: v.string(),
    numAdults: v.number(),
    numChildren: v.number(),
    lastUpdated: v.string(),
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
    medianFamilyIncome: v.number(),
  }).index("by_user", ["userId"]),

  target: defineTable({
    userId: v.string(),
    targetAmount: v.number(),
    year: v.number(),
    createdAt: v.string(),
  }).index("by_user", ["userId"]),
});
