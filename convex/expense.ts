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
    const identity = await ctx.auth.getUserIdentity(); // Retrieve user identity

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject; // Get the user ID from the authenticated user
    const newExpenseId = Date.now(); // Generate a unique ID for the expense

    // Insert the expense with the userId included
    return await ctx.db.insert("expenses", {
      id: newExpenseId,
      userId, // Add userId here
      amount: args.amount,
      type: args.type,
      date: args.date,
      category: args.category,
    });
  },
});

// Query to get all expenses for the authenticated user
export const getExpenses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    return await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("userId"), userId)) // Filter by userId
      .collect();
  },
});

// Mutation to delete an expense by ID for the authenticated user
export const deleteExpense = mutation({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const expense = await ctx.db
      .query("expenses")
      .filter((q) =>
        q.and(q.eq(q.field("id"), args.id), q.eq(q.field("userId"), userId))
      )
      .first();

    if (!expense) {
      throw new Error("Expense not found");
    }

    return await ctx.db.delete(expense._id);
  },
});

// Mutation to update an expense for the authenticated user
export const updateExpense = mutation({
  args: {
    id: v.number(),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const expense = await ctx.db
      .query("expenses")
      .filter((q) =>
        q.and(q.eq(q.field("id"), args.id), q.eq(q.field("userId"), userId))
      )
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
