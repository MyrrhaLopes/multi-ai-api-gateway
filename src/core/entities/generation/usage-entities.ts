import z from "zod";

export const UsageSchema = z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    creditCost: z.number().optional()
});
export type Usage = z.infer<typeof UsageSchema>;