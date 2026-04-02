import { classifyRole } from "./classify-role";
import { interpretCompanyContext } from "./interpret-company";
import { generateMockStrategy } from "./mock-llm";
import { buildSourcingPrompt } from "./prompts";
import { validateStrategyForRoleFamily } from "./validate-strategy";
import { tierStrategy } from "./tier-strategy";
import { getRoleRubric } from "./role-rubric";
import { HiringBrief, SourcingStrategy, DepthLevel } from "./types";

// Signal-rich terms that indicate a detailed, structured brief
const DEPTH_SIGNALS = [
  "icp", "ideal candidate", "must have", "must-have", "nice to have",
  "disqualifier", "target companies", "buyer", "customer type",
  "compensation", "equity", "reporting to", "reports to", "team size",
  "kpi", "metric", "quota", "arr", "nrr", "revenue target",
  "why now", "urgency", "timeline", "start date",
  "culture", "values", "mission", "vision",
  "competitor", "market position", "differentiator",
  "stage", "series", "funding", "headcount",
  "objection", "concern", "challenge", "risk",
];

function detectDepth(brief: HiringBrief): DepthLevel {
  const text = `${brief.description}`.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  const signalHits = DEPTH_SIGNALS.filter((s) => text.includes(s)).length;

  const structureMarkers =
    (text.match(/[:\-•\n]/g) || []).length;

  const score =
    (wordCount >= 200 ? 2 : wordCount >= 80 ? 1 : 0) +
    (signalHits >= 8 ? 2 : signalHits >= 4 ? 1 : 0) +
    (structureMarkers >= 10 ? 1 : 0);

  if (score >= 4) return "L3";
  if (score >= 2) return "L2";
  return "L1";
}

export async function generateStrategy(
  brief: HiringBrief
): Promise<SourcingStrategy> {
  const classification = classifyRole(brief);
  const companyCtx = interpretCompanyContext(brief);
  const depth = detectDepth(brief);
  const rubric = getRoleRubric(brief.role, brief.description);

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

  return tierStrategy(validated.strategy, classification.family, companyCtx, depth, brief.company, rubric);
}
