import { classifyRole } from "./classify-role";
import { interpretCompanyContext } from "./interpret-company";
import { generateMockStrategy } from "./mock-llm";
import { buildSourcingPrompt } from "./prompts";
import { validateStrategyForRoleFamily } from "./validate-strategy";
import { tierStrategy } from "./tier-strategy";
import { HiringBrief, SourcingStrategy } from "./types";

export async function generateStrategy(
  brief: HiringBrief
): Promise<SourcingStrategy> {
  const classification = classifyRole(brief);
  const companyCtx = interpretCompanyContext(brief);

  const prompt = buildSourcingPrompt(brief, classification, companyCtx);

  const rawStrategy = await generateMockStrategy(
    prompt,
    brief,
    classification,
    companyCtx
  );

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

  // V2: tier profiles, prioritize channels, generate filters
  return tierStrategy(validated.strategy, classification.family, companyCtx);
}
