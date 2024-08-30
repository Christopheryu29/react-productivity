// convex/financial.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Define the update structure with optional fields to handle partial updates
interface FinancialUpdate {
  housingCost?: number;
  foodCost?: number;
  transportationCost?: number;
  healthcareCost?: number;
  otherNecessitiesCost?: number;
  childcareCost?: number;
  taxes?: number;
  totalExpenses?: number;
  medianFamilyIncome?: number;
}

// Mutation to update or insert a financial summary
export const updateFinancialSummary = mutation(
  async (
    ctx,
    { userId, update }: { userId: string; update: FinancialUpdate }
  ) => {
    const existing = await ctx.db
      .query("financial")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!existing) {
      // Insert new financial record if it doesn't exist, and ensure all fields are provided for the first insert
      await ctx.db.insert("financial", {
        userId,
        housingCost: update.housingCost ?? 0,
        foodCost: update.foodCost ?? 0,
        transportationCost: update.transportationCost ?? 0,
        healthcareCost: update.healthcareCost ?? 0,
        otherNecessitiesCost: update.otherNecessitiesCost ?? 0,
        childcareCost: update.childcareCost ?? 0,
        taxes: update.taxes ?? 0,
        totalExpenses: update.totalExpenses ?? 0,
        medianFamilyIncome: update.medianFamilyIncome ?? 0,
      });
    } else {
      // Update existing financial record with whatever fields are provided
      await ctx.db.patch(existing._id, {
        ...(update.housingCost !== undefined && {
          housingCost: update.housingCost,
        }),
        ...(update.foodCost !== undefined && { foodCost: update.foodCost }),
        ...(update.transportationCost !== undefined && {
          transportationCost: update.transportationCost,
        }),
        ...(update.healthcareCost !== undefined && {
          healthcareCost: update.healthcareCost,
        }),
        ...(update.otherNecessitiesCost !== undefined && {
          otherNecessitiesCost: update.otherNecessitiesCost,
        }),
        ...(update.childcareCost !== undefined && {
          childcareCost: update.childcareCost,
        }),
        ...(update.taxes !== undefined && { taxes: update.taxes }),
        ...(update.totalExpenses !== undefined && {
          totalExpenses: update.totalExpenses,
        }),
        ...(update.medianFamilyIncome !== undefined && {
          medianFamilyIncome: update.medianFamilyIncome,
        }),
      });
    }
  }
);

// Query to get financial summary
export const getFinancialSummary = query(
  async (ctx, { userId }: { userId: string }) => {
    return await ctx.db
      .query("financial")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  }
);
