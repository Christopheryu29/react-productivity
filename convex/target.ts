import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to create or update the savings target
export const setSavingsTarget = mutation({
  args: {
    userId: v.string(),
    targetAmount: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { userId, targetAmount, year }) => {
    // Check if the savings target already exists for the given user and year
    const existingTarget = await ctx.db
      .query("target")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("year"), year))
      .first();

    const currentDate = new Date().toISOString();

    if (existingTarget) {
      // If the target already exists, update it
      await ctx.db.patch(existingTarget._id, {
        targetAmount,
        createdAt: currentDate,
      });
    } else {
      // If no target exists, create a new one
      await ctx.db.insert("target", {
        userId,
        targetAmount,
        year,
        createdAt: currentDate,
      });
    }
  },
});

// Query to get the savings target for a user for a given year
export const getSavingsTarget = query({
  args: { userId: v.string(), year: v.number() },
  handler: async (ctx, { userId, year }) => {
    return await ctx.db
      .query("target")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("year"), year))
      .first();
  },
});
