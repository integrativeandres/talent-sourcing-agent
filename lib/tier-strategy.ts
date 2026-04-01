import {
  SourcingStrategyV1,
  SourcingStrategy,
  TieredProfile,
  PrioritizedChannel,
  CandidateFilter,
  RoleFamily,
  CompanyContext,
} from "./types";

/**
 * Upgrades a flat V1 strategy into a tiered V2 strategy.
 * Profile tiering: first 2 = tier1, next 2 = tier2, rest = tier3.
 * Channel priority: first 2 = primary, next 2 = secondary, rest = edge.
 * Filters: generated from role family + company context.
 */
export function tierStrategy(
  v1: SourcingStrategyV1,
  family: RoleFamily,
  ctx: CompanyContext
): SourcingStrategy {
  return {
    targetProfiles: tierProfiles(v1.targetProfiles),
    searchChannels: prioritizeChannels(v1.searchChannels),
    filters: generateFilters(family, ctx),
    keywords: v1.keywords,
    outreachAngle: v1.outreachAngle,
    sampleBooleanSearch: v1.sampleBooleanSearch,
  };
}

function tierProfiles(profiles: string[]): TieredProfile[] {
  return profiles.map((description, i) => ({
    tier: i < 2 ? "tier1" : i < 4 ? "tier2" : "tier3",
    description,
  }));
}

function prioritizeChannels(channels: string[]): PrioritizedChannel[] {
  return channels.map((channel, i) => ({
    priority: i < 2 ? "primary" : i < 4 ? "secondary" : "edge",
    channel,
  }));
}

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

function generateFilters(family: RoleFamily, ctx: CompanyContext): CandidateFilter[] {
  const base = ROLE_FILTERS[family] || ROLE_FILTERS.general;

  // Add context-specific filters
  const contextFilters: CandidateFilter[] = [];

  if (ctx.stage === "seed" || ctx.stage === "pre-seed" || ctx.stage === "series-a") {
    contextFilters.push({
      category: "strong-signal",
      signal: "Has worked at an early-stage company or as a founding team member",
    });
    contextFilters.push({
      category: "disqualifier",
      signal: "Only large-company experience with heavy support infrastructure",
    });
  }

  if (ctx.archetype === "info-product") {
    contextFilters.push({
      category: "strong-signal",
      signal: "Experience at an info-product, coaching, or education brand",
    });
  }

  if (ctx.archetype === "healthcare-vertical") {
    contextFilters.push({
      category: "strong-signal",
      signal: "Familiarity with healthcare regulations (HIPAA, clinical workflows)",
    });
  }

  if (ctx.archetype === "dev-tools") {
    contextFilters.push({
      category: "strong-signal",
      signal: "Experience selling to or building for developers",
    });
  }

  return [...base, ...contextFilters];
}
