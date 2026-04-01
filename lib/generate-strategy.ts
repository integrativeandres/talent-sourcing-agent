import { classifyRole } from "./classify-role";
import { generateMockStrategy } from "./mock-llm";
import { buildSourcingPrompt } from "./prompts";
import { validateStrategyForRoleFamily } from "./validate-strategy";
import { HiringBrief, SourcingStrategy } from "./types";

export async function generateStrategy(
  brief: HiringBrief
): Promise<SourcingStrategy> {
  const classification = classifyRole(brief);

  const prompt = buildSourcingPrompt(brief, classification);

  const rawStrategy = await generateMockStrategy(prompt, brief, classification);

  const validated = validateStrategyForRoleFamily(
    classification.family,
    rawStrategy
  );

  if (validated.warnings.length > 0) {
    console.warn(
      `[${classification.family}] Strategy validation warnings:`,
      validated.warnings
    );
  }

  return validated.strategy;
}
