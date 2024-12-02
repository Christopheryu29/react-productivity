import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createExpense = mutation({
  args: {
    amount: v.number(),
    type: v.string(),
    date: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const newExpenseId = Date.now();

    return await ctx.db.insert("expenses", {
      id: newExpenseId,
      userId,
      amount: args.amount,
      type: args.type,
      date: args.date,
      category: args.category,
    });
  },
});

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
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

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
