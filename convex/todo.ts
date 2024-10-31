// convex/todo.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to create a new to-do item with userId
export const createTodo = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("todos", {
      text: args.text,
      userId: identity.subject, // Include userId to link to-do to the user
      isCompleted: false,
    });
  },
});

// Query to get to-dos specific to the authenticated user
export const getTodos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject; // Get the userId of the authenticated user

    // Fetch only the to-dos that belong to the authenticated user
    return await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

// Mutation to toggle the completion status of a to-do
export const toggleTodo = mutation({
  args: { id: v.id("todos"), isCompleted: v.boolean() },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      isCompleted: args.isCompleted,
    });
  },
});

// Mutation to delete a to-do item by ID
export const deleteTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
