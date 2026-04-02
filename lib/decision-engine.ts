import {
  RoleRubric,
  CompanyContext,
  TieredProfile,
  CandidateFilter,
  ProfileTier,
  FilterCategory,
} from "./types";

// ===========================================================================
// Signal scoring — runs BEFORE generation
// ===========================================================================

export interface SignalMatch {
  score: number;
  matched: {
    must: string[];
    strong: string[];
    negative: string[];
  };
}

export function scoreSignals(signals: string[], rubric: RoleRubric): SignalMatch {
  const textLower = signals.map((s) => s.toLowerCase());
  const mustLower = rubric.mustSignals.map((s) => s.toLowerCase());
  const strongLower = rubric.strongSignals.map((s) => s.toLowerCase());
  const antiLower = rubric.antiSignals.map((s) => s.toLowerCase());

  const must: string[] = [];
  const strong: string[] = [];
  const negative: string[] = [];

  for (const signal of textLower) {
    for (let i = 0; i < mustLower.length; i++) {
      if (signal.includes(mustLower[i]) || mustLower[i].includes(signal)) {
        must.push(rubric.mustSignals[i]);
      }
    }
    for (let i = 0; i < strongLower.length; i++) {
      if (signal.includes(strongLower[i]) || strongLower[i].includes(signal)) {
        strong.push(rubric.strongSignals[i]);
      }
    }
    for (let i = 0; i < antiLower.length; i++) {
      if (signal.includes(antiLower[i]) || antiLower[i].includes(signal)) {
        negative.push(rubric.antiSignals[i]);
      }
    }
  }

  // Dedupe
  const dedupe = (arr: string[]) => [...new Set(arr)];
  const mustMatched = dedupe(must);
  const strongMatched = dedupe(strong);
  const negativeMatched = dedupe(negative);

  // Score: +2 per must, +1 per strong, -3 per anti
  const score = mustMatched.length * 2 + strongMatched.length * 1 - negativeMatched.length * 3;

  return {
    score,
    matched: { must: mustMatched, strong: strongMatched, negative: negativeMatched },
  };
}

// ===========================================================================
// Tier assignment — based on signal match, not position
// ===========================================================================

export function assignTier(match: SignalMatch, roleType: string): ProfileTier {
  const { must, strong, negative } = match.matched;

  // Adaptive strictness by role type
  const mustThresholdT1 = roleType === "chief_of_staff" ? 1 : 2;
  const strongThresholdT1 = roleType === "chief_of_staff" ? 1 : 2;

  if (negative.length > 0) return "tier3";

  if (must.length >= mustThresholdT1 && strong.length >= strongThresholdT1) return "tier1";
  if (must.length >= 1 && strong.length >= 1) return "tier2";
  return "tier3";
}

// ===========================================================================
// Profile generation FROM signals — not templates
// ===========================================================================

interface ProfileCandidate {
  signals: string[];
  context: string; // what kind of background (e.g. "direct competitor", "adjacent", "above-title")
}

// Define candidate archetypes per role type — each is a distinct sourcing lane
const ROLE_PROFILE_CANDIDATES: Record<string, ProfileCandidate[]> = {
  revops: [
    { signals: ["forecasting", "pipeline analytics", "CRM", "revenue operations", "go-to-market systems"], context: "RevOps operator who has built the GTM data and systems layer" },
    { signals: ["salesforce", "hubspot", "CRM", "data hygiene", "territory planning"], context: "CRM and systems architect who has owned the sales tech stack" },
    { signals: ["funnel analysis", "conversion analytics", "pipeline analytics", "forecasting"], context: "Analytics-driven RevOps leader who has built forecasting and funnel visibility" },
    { signals: ["revenue operations", "go-to-market systems", "process design"], context: "Process-oriented operator from an adjacent GTM ops role" },
    { signals: ["operations", "strategic planning", "systems thinking"], context: "General ops leader with transferable systems instinct — edge bet" },
  ],
  sales: [
    { signals: ["closed", "deal cycle", "executive buyers", "pipeline", "quota"], context: "Deal closer who has run complex, multi-stakeholder sales cycles" },
    { signals: ["multi-threaded", "enterprise deal", "proof of value", "complex sale"], context: "Enterprise seller who navigates long cycles and executive buying committees" },
    { signals: ["book of business", "pipeline", "quota", "closed"], context: "VP/Head of Sales at a smaller firm operating above title" },
    { signals: ["pipeline", "deal cycle", "executive buyers"], context: "Former founder who has sold directly to senior buyers" },
    { signals: ["pipeline", "closed"], context: "Adjacent commercial operator — conversion bet" },
  ],
  product_marketing: [
    { signals: ["positioning", "messaging", "go-to-market", "product launch"], context: "PMM who has owned positioning, messaging, and launch for a core product line" },
    { signals: ["ICP", "personas", "competitive intel", "enablement"], context: "PMM who has built ICP frameworks, battle cards, and sales enablement" },
    { signals: ["narrative", "positioning", "differentiation", "product launch"], context: "Narrative builder who has shaped how a market thinks about a category" },
    { signals: ["go-to-market", "enablement"], context: "GTM strategist from an adjacent function — edge bet" },
  ],
  chief_of_staff: [
    { signals: ["cross-functional", "execution", "founder support", "strategic initiatives"], context: "CoS who has driven cross-functional initiatives and extended founder leverage" },
    { signals: ["operations", "strategic planning", "board prep", "org design"], context: "CoS who has owned board prep, org design, and internal operations" },
    { signals: ["cross-functional", "execution", "internal systems"], context: "Operator from consulting or strategy who thrives in ambiguity" },
    { signals: ["strategic initiatives", "founder support"], context: "Former founder or early employee with breadth — edge bet" },
  ],
  demand_gen: [
    { signals: ["demand generation", "pipeline", "acquisition", "conversion", "CAC"], context: "Demand gen leader who has built acquisition and pipeline engines" },
    { signals: ["experimentation", "attribution", "funnel optimization", "channel mix"], context: "Growth operator who has run experimentation programs across channels" },
    { signals: ["paid + organic", "acquisition", "conversion"], context: "Performance marketer who ties programs to revenue" },
    { signals: ["demand generation", "pipeline"], context: "Adjacent marketing operator — conversion bet" },
  ],
  customer_success: [
    { signals: ["retention", "NRR", "onboarding", "expansion", "customer lifecycle"], context: "CS leader who has built retention, expansion, and onboarding systems" },
    { signals: ["health score", "renewal playbook", "land and expand", "adoption"], context: "CS operator who has built health scoring and expansion playbooks" },
    { signals: ["retention", "expansion", "customer lifecycle"], context: "Post-sale leader from an adjacent vertical" },
    { signals: ["onboarding", "adoption"], context: "Implementation leader transitioning to strategic CS — edge bet" },
  ],
  engineering: [
    { signals: ["shipped", "architecture", "system design", "production", "technical ownership"], context: "Engineer who has shipped core systems end-to-end and owns architecture decisions" },
    { signals: ["founding engineer", "built from scratch", "technical ownership"], context: "Early-stage builder who has built under ambiguity from zero" },
    { signals: ["open source", "staff engineer", "system design"], context: "Technical community leader with deep craft and domain instinct" },
    { signals: ["architecture", "shipped", "production"], context: "VP/Head of Engineering at a smaller company, still hands-on" },
  ],
  operations: [
    { signals: ["process design", "cross-functional", "operational infrastructure", "throughput"], context: "Ops builder who has designed cross-functional workflows and execution infrastructure" },
    { signals: ["org design", "systems thinking", "workflow"], context: "Strategic ops leader who thinks in systems and measures operational ROI" },
    { signals: ["chief of staff", "cross-functional"], context: "CoS or program leader from an adjacent function" },
    { signals: ["process design", "operational infrastructure"], context: "Ex-consultant now in an operating role — edge bet" },
  ],
};

export function generateSignalDrivenProfiles(
  rubric: RoleRubric,
  ctx: CompanyContext
): TieredProfile[] {
  const candidates = ROLE_PROFILE_CANDIDATES[rubric.roleType];
  if (!candidates) return [];

  const stageDesc = ctx.stage === "unknown" ? "" : ` at a ${ctx.stage} ${ctx.companyType} company`;
  const results: { profile: TieredProfile; score: number }[] = [];

  for (const candidate of candidates) {
    const match = scoreSignals(candidate.signals, rubric);
    const tier = assignTier(match, rubric.roleType);

    // Build description FROM matched signals
    const mustPart = match.matched.must.length > 0
      ? `has owned ${match.matched.must.join(", ")}`
      : "";
    const strongPart = match.matched.strong.length > 0
      ? `with demonstrated ${match.matched.strong.join(", ")}`
      : "";

    const signalDesc = [mustPart, strongPart].filter(Boolean).join(" ");
    const description = `${candidate.context}${stageDesc} — ${signalDesc}`.trim().replace(/ —\s*$/, "");

    // Drop profiles contaminated with anti-signals
    if (match.matched.negative.length > 0) continue;

    results.push({ profile: { tier, description }, score: match.score });
  }

  // Sort by score descending, then slice
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 5).map((r) => r.profile);
}

// ===========================================================================
// Signal-driven filters — directly from rubric
// ===========================================================================

export function generateSignalDrivenFilters(
  rubric: RoleRubric,
  caps: Record<FilterCategory, number>
): CandidateFilter[] {
  const filters: CandidateFilter[] = [];

  // Must-haves from must signals
  for (const signal of rubric.mustSignals.slice(0, caps["must-have"])) {
    filters.push({ category: "must-have", signal });
  }

  // Strong signals
  for (const signal of rubric.strongSignals.slice(0, caps["strong-signal"])) {
    filters.push({ category: "strong-signal", signal });
  }

  // Disqualifiers from anti signals
  for (const signal of rubric.antiSignals.slice(0, caps["disqualifier"])) {
    filters.push({ category: "disqualifier", signal });
  }

  return filters;
}

// ===========================================================================
// Signal-driven keywords — must + strong only, no anti, no generic
// ===========================================================================

export function generateSignalDrivenKeywords(
  rubric: RoleRubric,
  maxKeywords: number
): string[] {
  const antiLower = new Set(rubric.antiSignals.map((s) => s.toLowerCase()));
  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const signal of [...rubric.mustSignals, ...rubric.strongSignals]) {
    const lower = signal.toLowerCase();
    if (antiLower.has(lower)) continue;
    if (seen.has(lower)) continue;
    keywords.push(signal);
    seen.add(lower);
    if (keywords.length >= maxKeywords) break;
  }

  // Add language constraints as additional keywords if space
  for (const term of rubric.languageConstraints) {
    const lower = term.toLowerCase();
    if (seen.has(lower) || antiLower.has(lower)) continue;
    if (keywords.length >= maxKeywords) break;
    keywords.push(term);
    seen.add(lower);
  }

  return keywords;
}

// ===========================================================================
// Signal-driven boolean — (TITLE) AND (MUST) AND (STRONG) NOT (ANTI)
// ===========================================================================

const ROLE_TITLE_GROUPS: Record<string, string> = {
  revops: '"revenue operations" OR "revops" OR "GTM ops" OR "sales operations" OR "head of rev ops"',
  sales: '"vp sales" OR "head of sales" OR "enterprise sales" OR "managing director"',
  product_marketing: '"product marketing" OR "PMM" OR "product marketer" OR "head of product marketing"',
  chief_of_staff: '"chief of staff" OR "CoS" OR "head of staff"',
  demand_gen: '"demand generation" OR "growth marketing" OR "head of demand gen" OR "VP marketing"',
  customer_success: '"head of customer success" OR "vp customer success" OR "director CS"',
  engineering: '"founding engineer" OR "staff engineer" OR "tech lead" OR "head of engineering"',
  operations: '"head of ops" OR "VP operations" OR "chief of staff" OR "COO"',
};

export function generateSignalDrivenBoolean(
  rubric: RoleRubric,
  domainGroup: string
): string {
  const titleGroup = ROLE_TITLE_GROUPS[rubric.roleType] || `"${rubric.roleType}"`;

  const mustTerms = rubric.mustSignals.slice(0, 4).map((s) => `"${s}"`).join(" OR ");
  const antiTerms = rubric.antiSignals.slice(0, 4).map((s) => `"${s}"`).join(" OR ");

  const parts = [`(${titleGroup})`];
  if (mustTerms) parts.push(`(${mustTerms})`);
  parts.push(`(${domainGroup})`);

  let query = parts.join(" AND ");
  if (antiTerms) query += ` NOT (${antiTerms} OR "recruiter" OR "talent acquisition")`;
  else query += ` NOT ("recruiter" OR "talent acquisition")`;

  return query;
}
