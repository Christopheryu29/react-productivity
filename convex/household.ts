import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const setHousehold = mutation({
  args: {
    numAdults: v.number(),
    numChildren: v.number(),
  },
  handler: async (ctx, { numAdults, numChildren }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existing = await ctx.db
      .query("household")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) {
      // Update existing entry
      return await ctx.db.patch(existing._id, {
        numAdults,
        numChildren,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      return await ctx.db.insert("household", {
        userId,
        numAdults,
        numChildren,
        lastUpdated: new Date().toISOString(),
      });
    }
  },
});

export const getHouseholdByUserId = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    return await ctx.db
      .query("household")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});
