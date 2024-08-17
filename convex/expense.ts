import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to add a new expense
export const createExpense = mutation({
  args: {
    amount: v.number(),
    type: v.string(),
    date: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate a unique ID for the expense
    const newExpenseId = Date.now(); // Consider a more robust ID strategy if needed

    return await ctx.db.insert("expenses", {
      id: newExpenseId,
      amount: args.amount,
      type: args.type,
      date: args.date,
      category: args.category,
    });
  },
});

// Query to get all expenses
export const getExpenses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("expenses").collect();
  },
});

// Mutation to delete an expense by ID
export const deleteExpense = mutation({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    // Ensure the ID is valid and check if the expense exists
    const expense = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (!expense) {
      throw new Error("Expense not found");
    }

    return await ctx.db.delete(expense._id); // Use _id from the result to delete
  },
});

// Mutation to update an expense
export const updateExpense = mutation({
  args: {
    id: v.number(),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify if the expense exists
    const expense = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (!expense) {
      throw new Error("Expense not found");
    }

    return await ctx.db.patch(expense._id, {
      ...(args.amount !== undefined ? { amount: args.amount } : {}),
      ...(args.category !== undefined ? { category: args.category } : {}),
    });
  },
});
