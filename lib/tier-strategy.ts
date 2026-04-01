import {
  SourcingStrategyV1,
  SourcingStrategy,
  TieredProfile,
  PrioritizedChannel,
  CandidateFilter,
  ProfileTier,
  RoleFamily,
  CompanyArchetype,
  CompanyContext,
} from "./types";

export function tierStrategy(
  v1: SourcingStrategyV1,
  family: RoleFamily,
  ctx: CompanyContext
): SourcingStrategy {
  return {
    targetProfiles: tierProfiles(v1.targetProfiles, family, ctx),
    searchChannels: prioritizeChannels(v1.searchChannels, ctx),
    filters: generateFilters(family, ctx),
    keywords: v1.keywords,
    outreachAngle: v1.outreachAngle,
    sampleBooleanSearch: cleanBoolean(v1.sampleBooleanSearch),
  };
}

// ---------------------------------------------------------------------------
// Profile tiering — score each profile, then assign tier by score
// ---------------------------------------------------------------------------

const ROLE_KEYWORDS: Record<RoleFamily, string[]> = {
  sales: ["pipeline", "quota", "closing", "deal", "revenue", "seller", "commercial", "book of business"],
  marketing: ["acquisition", "funnel", "conversion", "demand", "growth", "channel", "cac", "experimentation"],
  customer_success: ["retention", "nrr", "onboarding", "adoption", "expansion", "renewal", "post-sale", "health score"],
  engineering: ["shipped", "architecture", "system", "infrastructure", "code", "technical", "stack", "platform"],
  operations: ["process", "workflow", "execution", "cross-functional", "throughput", "systems", "operational"],
  general: ["ownership", "built", "outcomes", "leadership"],
};

const STAGE_KEYWORDS: Record<string, string[]> = {
  "pre-seed": ["founding", "scratch", "first hire", "0 to 1", "early-stage"],
  "seed": ["founding", "scratch", "first hire", "0 to 1", "early-stage"],
  "series-a": ["early-stage", "Series A", "building from scratch", "lean team"],
  "series-b": ["Series B", "growth", "scaling"],
  "growth": ["scaling", "growth-stage", "growth stage"],
  "late-stage": ["late-stage", "mature", "optimize"],
  "public": ["public", "enterprise", "large"],
  "pe-backed": ["PE-backed", "private equity", "portfolio"],
  "bootstrapped": ["bootstrapped", "profitable", "self-funded"],
  "unknown": [],
};

const ARCHETYPE_KEYWORDS: Record<CompanyArchetype, string[]> = {
  "b2b-saas": ["saas", "arr", "subscription", "churn", "plg", "product-led"],
  "info-product": ["funnel", "high-ticket", "coaching", "education", "audience", "event", "webinar", "creator", "program", "enrollment", "vsl", "info-product"],
  "professional-services": ["consulting", "advisory", "practice", "engagement", "partner", "delivery", "utilization"],
  "marketplace": ["marketplace", "gmv", "network effect", "supply", "demand", "two-sided", "liquidity"],
  "dev-tools": ["developer", "api", "sdk", "open source", "devtools", "dx", "infrastructure"],
  "healthcare-vertical": ["healthcare", "clinical", "hipaa", "ehr", "patient", "provider", "digital health", "regulatory"],
  "consumer-prosumer": ["consumer", "d2c", "app", "mobile", "viral", "referral", "retention loop"],
  "general": [],
};

function scoreProfile(
  description: string,
  family: RoleFamily,
  ctx: CompanyContext
): number {
  const text = description.toLowerCase();
  let score = 0;

  // Role match (0–2)
  const roleHits = (ROLE_KEYWORDS[family] || []).filter((kw) => text.includes(kw)).length;
  score += Math.min(roleHits, 2);

  // Stage match (0–2)
  const stageHits = (STAGE_KEYWORDS[ctx.stage] || []).filter((kw) => text.toLowerCase().includes(kw.toLowerCase())).length;
  score += Math.min(stageHits, 2);

  // Archetype match (0–2)
  const archHits = (ARCHETYPE_KEYWORDS[ctx.archetype] || []).filter((kw) => text.includes(kw)).length;
  score += Math.min(archHits, 2);

  return score;
}

function tierFromScore(score: number): ProfileTier {
  if (score >= 5) return "tier1";
  if (score >= 3) return "tier2";
  return "tier3";
}

function tierProfiles(
  profiles: string[],
  family: RoleFamily,
  ctx: CompanyContext
): TieredProfile[] {
  const scored = profiles.map((description) => ({
    description,
    score: scoreProfile(description, family, ctx),
  }));

  // Sort by score descending so best profiles render first within each tier
  scored.sort((a, b) => b.score - a.score);

  // Guarantee at least one tier1 — if scoring is soft, promote the top profile
  const result = scored.map((s) => ({
    tier: tierFromScore(s.score),
    description: s.description,
  }));

  if (!result.some((p) => p.tier === "tier1") && result.length > 0) {
    result[0].tier = "tier1";
  }

  return result;
}

// ---------------------------------------------------------------------------
// Channel prioritization — score channels the same way
// ---------------------------------------------------------------------------

function prioritizeChannels(
  channels: string[],
  ctx: CompanyContext
): PrioritizedChannel[] {
  const scored = channels.map((channel) => {
    const text = channel.toLowerCase();
    let score = 0;

    // LinkedIn Recruiter is always primary
    if (text.includes("linkedin recruiter")) score += 3;

    // Archetype-specific channels score higher
    const archHits = (ARCHETYPE_KEYWORDS[ctx.archetype] || []).filter((kw) => text.includes(kw)).length;
    score += Math.min(archHits * 2, 4);

    // Referral mining is always useful
    if (text.includes("referral")) score += 2;

    // Community/conference channels are secondary
    if (text.includes("community") || text.includes("conference") || text.includes("speaker")) score += 1;

    return { channel, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s, i) => ({
    priority: i < 2 ? "primary" : i < 4 ? "secondary" : "edge",
    channel: s.channel,
  }));
}

// ---------------------------------------------------------------------------
// Filters — role-family base + archetype overlays (replace, not append)
// ---------------------------------------------------------------------------

const ROLE_FILTERS: Record<RoleFamily, CandidateFilter[]> = {
  sales: [
    { category: "must-have", signal: "Has personally closed complex, multi-stakeholder deals" },
    { category: "must-have", signal: "Owns or has owned a quota or revenue target" },
    { category: "strong-signal", signal: "Experience selling to the same buyer persona" },
    { category: "strong-signal", signal: "Has built pipeline from scratch, not just inherited accounts" },
    { category: "nice-to-have", signal: "Experience in the same market or vertical" },
    { category: "nice-to-have", signal: "Has structured proof-of-value or pilot engagements" },
    { category: "disqualifier", signal: "Only account management, no new business or deal closing" },
    { category: "disqualifier", signal: "No evidence of quota-carrying or revenue ownership" },
  ],
  marketing: [
    { category: "must-have", signal: "Has owned acquisition, conversion, or demand gen outcomes" },
    { category: "must-have", signal: "Can tie marketing programs to measurable pipeline or revenue" },
    { category: "strong-signal", signal: "Experience with the same buyer persona or market" },
    { category: "strong-signal", signal: "Has built and run experimentation programs" },
    { category: "nice-to-have", signal: "Experience at a similar company stage" },
    { category: "nice-to-have", signal: "Has scaled paid and organic channels simultaneously" },
    { category: "disqualifier", signal: "Only brand or comms — no demand gen or acquisition ownership" },
    { category: "disqualifier", signal: "No evidence of measurable pipeline or conversion impact" },
  ],
  customer_success: [
    { category: "must-have", signal: "Owns or has owned retention, NRR, or expansion targets" },
    { category: "must-have", signal: "Has built post-sale systems (onboarding, health scoring, renewal)" },
    { category: "strong-signal", signal: "Experience with the same buyer complexity or deal size" },
    { category: "strong-signal", signal: "Has expanded CS into upsell/cross-sell, not just support" },
    { category: "nice-to-have", signal: "Experience in the same market or vertical" },
    { category: "nice-to-have", signal: "Has built CS team and processes from scratch" },
    { category: "disqualifier", signal: "Only tier-1 support or ticket resolution — no strategic CS" },
    { category: "disqualifier", signal: "No evidence of retention or expansion ownership" },
  ],
  engineering: [
    { category: "must-have", signal: "Has shipped production systems end-to-end" },
    { category: "must-have", signal: "Demonstrates strong system design and architecture judgment" },
    { category: "strong-signal", signal: "Has built under ambiguity at an early-stage or high-growth company" },
    { category: "strong-signal", signal: "Active in technical communities, open source, or conference speaking" },
    { category: "nice-to-have", signal: "Domain experience in the same market" },
    { category: "nice-to-have", signal: "Has led a small engineering team while staying hands-on" },
    { category: "disqualifier", signal: "Only large-company work with narrow scope — no evidence of ownership" },
    { category: "disqualifier", signal: "No recent shipping or building signal in profile" },
  ],
  operations: [
    { category: "must-have", signal: "Has built or redesigned operational processes, not just run them" },
    { category: "must-have", signal: "Cross-functional coordination experience" },
    { category: "strong-signal", signal: "Experience at a similar company stage" },
    { category: "strong-signal", signal: "Has measured and improved operational throughput or efficiency" },
    { category: "nice-to-have", signal: "Experience in the same market or vertical" },
    { category: "nice-to-have", signal: "Consulting or strategy background" },
    { category: "disqualifier", signal: "Only process-following, no process-building" },
    { category: "disqualifier", signal: "No evidence of cross-functional or systems thinking" },
  ],
  general: [
    { category: "must-have", signal: "Demonstrated ownership of outcomes in their function" },
    { category: "must-have", signal: "Has built or scaled their function, not just managed it" },
    { category: "strong-signal", signal: "Experience at a similar company stage or type" },
    { category: "nice-to-have", signal: "Domain experience in the same market" },
    { category: "disqualifier", signal: "No evidence of building, ownership, or measurable impact" },
  ],
};

// Archetype-specific filter overlays that REPLACE base filters where they share a category
const ARCHETYPE_FILTER_OVERLAYS: Partial<Record<CompanyArchetype, CandidateFilter[]>> = {
  "info-product": [
    { category: "must-have", signal: "Has owned funnel conversion, program enrollment, or high-ticket revenue" },
    { category: "must-have", signal: "Experience at an info-product, coaching, education, or event-driven business" },
    { category: "strong-signal", signal: "Has built or scaled webinar, VSL, or live-event sales funnels" },
    { category: "strong-signal", signal: "Understands audience monetization and content-to-revenue pipelines" },
    { category: "nice-to-have", signal: "Experience with creator brands or personal-brand businesses" },
    { category: "nice-to-have", signal: "Familiarity with high-ticket coaching or transformation programs" },
    { category: "disqualifier", signal: "Only SaaS or enterprise experience — no direct-response or funnel background" },
    { category: "disqualifier", signal: "Only brand/content work — no revenue ownership or conversion accountability" },
  ],
  "b2b-saas": [
    { category: "must-have", signal: "Experience in a SaaS or subscription business model" },
    { category: "strong-signal", signal: "Fluent in SaaS metrics (ARR, churn, NRR, CAC payback)" },
    { category: "strong-signal", signal: "Has worked at a similar company stage and ARR range" },
    { category: "disqualifier", signal: "No experience with recurring-revenue or subscription business models" },
  ],
  "healthcare-vertical": [
    { category: "must-have", signal: "Domain exposure to healthcare, life sciences, or clinical workflows" },
    { category: "must-have", signal: "Familiarity with regulatory environment (HIPAA, FDA, or equivalent)" },
    { category: "strong-signal", signal: "Experience selling to or building for healthcare providers or payers" },
    { category: "strong-signal", signal: "Understands EHR integration, clinical data, or patient workflows" },
    { category: "disqualifier", signal: "No healthcare domain exposure — regulatory learning curve too steep" },
  ],
  "marketplace": [
    { category: "must-have", signal: "Experience at a marketplace or two-sided platform" },
    { category: "strong-signal", signal: "Understands supply/demand dynamics, network effects, and GMV growth" },
    { category: "disqualifier", signal: "Only single-sided product experience — no marketplace understanding" },
  ],
  "dev-tools": [
    { category: "must-have", signal: "Experience building for or selling to developers" },
    { category: "strong-signal", signal: "Understands developer experience, community-led growth, or open source" },
    { category: "disqualifier", signal: "No developer ecosystem exposure — can't speak the buyer's language" },
  ],
  "professional-services": [
    { category: "must-have", signal: "Experience in professional services, consulting, or client-facing delivery" },
    { category: "strong-signal", signal: "Understands utilization, engagement models, and practice economics" },
    { category: "disqualifier", signal: "Only product-company experience — no services-business understanding" },
  ],
  "consumer-prosumer": [
    { category: "strong-signal", signal: "Experience with consumer growth loops, retention mechanics, or viral dynamics" },
    { category: "disqualifier", signal: "Only enterprise B2B experience — no consumer product instinct" },
  ],
};

function generateFilters(family: RoleFamily, ctx: CompanyContext): CandidateFilter[] {
  const base = [...(ROLE_FILTERS[family] || ROLE_FILTERS.general)];
  const overlay = ARCHETYPE_FILTER_OVERLAYS[ctx.archetype];

  if (!overlay) {
    return addStageFilters(base, ctx);
  }

  // Merge: overlay filters take precedence, then fill remaining from base
  // Keep total count reasonable (8–10)
  const merged: CandidateFilter[] = [...overlay];
  const overlayCategories = new Set(overlay.map((f) => `${f.category}:${f.signal.slice(0, 20)}`));

  for (const filter of base) {
    // Add base filters that don't overlap with overlay by category count
    const categoryCount = merged.filter((f) => f.category === filter.category).length;
    const maxPerCategory = filter.category === "disqualifier" ? 3 : 2;
    if (categoryCount < maxPerCategory) {
      merged.push(filter);
    }
  }

  return addStageFilters(merged.slice(0, 10), ctx);
}

function addStageFilters(filters: CandidateFilter[], ctx: CompanyContext): CandidateFilter[] {
  const result = [...filters];

  if (ctx.stage === "seed" || ctx.stage === "pre-seed" || ctx.stage === "series-a") {
    result.push({
      category: "strong-signal",
      signal: "Has worked at an early-stage company or as a founding team member",
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Boolean cleanup
// ---------------------------------------------------------------------------

function cleanBoolean(raw: string): string {
  return raw
    // Remove empty quoted strings
    .replace(/""\s*(OR\s*)?/g, "")
    // Remove redundant OR at start/end of groups
    .replace(/\(\s*OR\s*/g, "(")
    .replace(/\s*OR\s*\)/g, ")")
    // Remove double spaces
    .replace(/\s{2,}/g, " ")
    // Remove empty parens
    .replace(/\(\s*\)/g, "")
    .trim();
}
