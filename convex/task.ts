// convex/task.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to create a new task with userId
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

    const userId = identity.subject; // Retrieve userId from authenticated identity

    // Insert the task with userId included
    return await ctx.db.insert("task", {
      id: args.id,
      userId, // Add userId to associate the task with the user
      title: args.title,
      status: args.status,
      label: args.label,
      priority: args.priority,
    });
  },
});

// Query to get tasks specific to the authenticated user
export const getTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject; // Retrieve userId

    // Fetch tasks that belong to the authenticated user
    return await ctx.db
      .query("task")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

// Mutation to update a task's status
export const updateTaskStatus = mutation({
  args: { id: v.id("task"), status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      status: args.status,
    });
  },
});

// Mutation to delete a task by ID
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

// Mutation to update a task with userId as a context
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
