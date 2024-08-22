// convex/tasks.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createTask = mutation({
  args: {
    id: v.string(),
    title: v.string(),
    status: v.string(),
    label: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.insert("task", {
      id: args.id,
      title: args.title,
      status: args.status,
      label: args.label,
      priority: args.priority,
    });
  },
});

export const getTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("task").collect();
  },
});

export const updateTaskStatus = mutation({
  args: { id: v.id("task"), status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      status: args.status,
    });
  },
});

export const deleteTask = mutation({
  args: {
    id: v.id("task"), // Convex's Id<"task"> type
  },
  handler: async (ctx, args) => {
    console.log("Attempting to delete task with ID:", args.id);
    try {
      const result = await ctx.db.delete(args.id);
      console.log("Deletion result:", result);
      return result;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw new Error("Failed to delete task");
    }
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("task"), // Convex ID for the task
    title: v.string(), // Updated title
    status: v.string(),
    label: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      title: args.title,
      status: args.status,
      label: args.label,
      priority: args.priority,
    });
  },
});
