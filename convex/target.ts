import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to create or update the savings target
export const setSavingsTarget = mutation({
  args: {
    targetAmount: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { targetAmount, year }) => {
    // Get the logged-in user's identity
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

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
  args: { year: v.number() },
  handler: async (ctx, { year }) => {
    // Get the logged-in user's identity
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Retrieve the target for the authenticated user and specified year
    return await ctx.db
      .query("target")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("year"), year))
      .first();
  },
});
