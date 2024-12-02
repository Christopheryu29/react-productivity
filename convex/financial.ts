import { mutation, query } from "./_generated/server";

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

export const getFinancialSummary = query(
  async (ctx, { userId }: { userId: string }) => {
    return await ctx.db
      .query("financial")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  }
);
