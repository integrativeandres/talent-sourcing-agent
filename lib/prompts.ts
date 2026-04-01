import { HiringBrief, RoleClassification } from "./types";

export function buildSourcingPrompt(
  brief: HiringBrief,
  classification: RoleClassification
): string {
  return `
You are an expert recruiting intelligence system.

Your job is to generate a sourcing strategy for a specific role.

Before generating the sourcing strategy, explicitly determine:
1. the primary function of the role:
- Build product
- Generate demand
- Close revenue
- Retain & expand customers
- Operate / deliver services

2. the primary metric this role owns

3. the stage of the lifecycle this role sits in

Use this classification to guide all downstream sourcing decisions.

Role classification:
- family: ${classification.family}
- primitive: ${classification.primitive}
- primary metric: ${classification.primaryMetric}
- lifecycle stage: ${classification.lifecycleStage}

Role guardrails:
- If the role is marketing, do not include sales titles, quota language, pipeline language, or enterprise seller archetypes. Include acquisition, conversion, funnels, experimentation, lifecycle, demand gen, or channel language where relevant.
- If the role is sales, do not include marketing language like CAC, paid media, SEO, or lifecycle marketing. Include pipeline, closing, quota, executive buyers, deal cycle, and revenue ownership.
- If the role is customer success, do not collapse into sales or support. Include retention, expansion, onboarding, adoption, NRR, customer lifecycle, and post-sale ownership.
- If the role is engineering, do not include commercial seller or marketing language. Include systems, architecture, shipping, technical ownership, stack, and product-building signals.

Interpret the ICP through the lens of the role.
Do not assume the ICP describes the same function as the role.
Translate ICP traits into the correct functional equivalent for the role.

Return valid JSON only with this exact shape:
{
  "targetProfiles": ["..."],
  "searchChannels": ["..."],
  "keywords": ["..."],
  "outreachAngle": "...",
  "sampleBooleanSearch": "..."
}

Requirements:
- targetProfiles must describe real candidate archetypes, not generic seniority labels
- searchChannels must be tactical and role-specific
- keywords must be usable and relevant to the role family
- outreachAngle must sound like a recruiter speaking the candidate's language
- sampleBooleanSearch must be specific to the role and avoid adjacent-role contamination

Role: ${brief.role}
Company: ${brief.company}
Hiring Brief:
${brief.description}
`.trim();
}