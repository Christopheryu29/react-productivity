import { action } from "./_generated/server";
import OpenAI from "openai";

const apiKey = process.env.OPEN_AI_KEY;
const openai = new OpenAI({ apiKey });

export const doSomething = action({
  handler: async (ctx, { query }) => {
    try {
      const response = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: typeof query === "string" ? query : "default query",
          },
        ],
        model: "gpt-3.5-turbo",
      });

      return response.choices[0].message.content;
    } catch (error: any) {
      // Using 'any' to bypass TypeScript's strict typing temporarily
      console.error("Failed to fetch completion from OpenAI:", error);

      if (error.response && error.response.status === 429) {
        return "Rate limit exceeded. Please try again later.";
      } else if (error.response && error.response.status === 401) {
        return "Unauthorized access. Please check your API key.";
      } else {
        return "An error occurred. Please try again.";
      }
    }
  },
});
