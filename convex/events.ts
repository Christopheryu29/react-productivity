// convex/events.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addEvent = mutation({
  args: {
    title: v.string(),
    userId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    description: v.optional(v.string()),
    isAllDay: v.boolean(),
    color: v.optional(v.string()),
    recurringDay: v.optional(v.string()), // Accept the recurringDay argument
  },
  handler: async (
    ctx,
    {
      title,
      userId,
      startDate,
      endDate,
      description,
      isAllDay,
      color,
      recurringDay,
    }
  ) => {
    return await ctx.db.insert("events", {
      title,
      userId,
      startDate,
      endDate,
      description,
      isAllDay,
      color,
      completed: false, // Assumes a 'completed' field is present
      recurringDay, // Store the recurringDay in the event
    });
  },
});

export const getEventsForDateRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    return await ctx.db
      .query("events")
      .filter((q) =>
        q.and(
          q.gte(q.field("startDate"), startDate),
          q.lte(q.field("endDate"), endDate)
        )
      )
      .collect();
  },
});

export const toggleCompletion = mutation({
  args: {
    eventId: v.id("events"),
    completed: v.boolean(),
  },
  handler: async (ctx, { eventId, completed }) => {
    return await ctx.db.patch(eventId, { completed });
  },
});

export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, { eventId }) => {
    await ctx.db.delete(eventId);
  },
});
