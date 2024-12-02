import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const setSavingsTarget = mutation({
  args: {
    targetAmount: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { targetAmount, year }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingTarget = await ctx.db
      .query("target")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("year"), year))
      .first();

    const currentDate = new Date().toISOString();

    if (existingTarget) {
      await ctx.db.patch(existingTarget._id, {
        targetAmount,
        createdAt: currentDate,
      });
    } else {
      await ctx.db.insert("target", {
        userId,
        targetAmount,
        year,
        createdAt: currentDate,
      });
    }
  },
});

export const getSavingsTarget = query({
  args: { year: v.number() },
  handler: async (ctx, { year }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    return await ctx.db
      .query("target")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("year"), year))
      .first();
  },
});
