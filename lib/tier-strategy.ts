import {
  SourcingStrategyV1,
  SourcingStrategy,
  TieredProfile,
  PrioritizedChannel,
  CandidateFilter,
  ProfileTier,
  ChannelPriority,
  FilterCategory,
  DepthLevel,
  RoleFamily,
  RoleRubric,
  CompanyArchetype,
  CompanyContext,
} from "./types";
import {
  generateSignalDrivenProfiles,
  generateSignalDrivenFilters,
  generateSignalDrivenKeywords,
  generateSignalDrivenBoolean,
} from "./decision-engine";

// Adaptive caps per depth level
const DEPTH_CONFIG: Record<DepthLevel, {
  maxProfiles: number;
  maxChannels: number;
  maxKeywords: number;
  filterCaps: Record<FilterCategory, number>;
  keepLaneDedup: boolean; // L3 can keep second-best per lane if distinct enough
}> = {
  L1: {
    maxProfiles: 4,
    maxChannels: 5,
    maxKeywords: 8,
    filterCaps: { "must-have": 2, "strong-signal": 2, "nice-to-have": 0, "disqualifier": 2 },
    keepLaneDedup: true,
  },
  L2: {
    maxProfiles: 5,
    maxChannels: 6,
    maxKeywords: 10,
    filterCaps: { "must-have": 2, "strong-signal": 3, "nice-to-have": 0, "disqualifier": 2 },
    keepLaneDedup: true,
  },
  L3: {
    maxProfiles: 5,
    maxChannels: 6,
    maxKeywords: 12,
    filterCaps: { "must-have": 2, "strong-signal": 3, "nice-to-have": 1, "disqualifier": 2 },
    keepLaneDedup: false, // allow non-obvious adjacencies from same lane
  },
};

const DEFAULT_RUBRIC: RoleRubric = {
  roleType: "general",
  mustSignals: [],
  strongSignals: [],
  antiSignals: [],
  languageConstraints: [],
};

export function tierStrategy(
  v1: SourcingStrategyV1,
  family: RoleFamily,
  ctx: CompanyContext,
  depth: DepthLevel = "L1",
  companyName: string = "",
  rubric: RoleRubric = DEFAULT_RUBRIC
): SourcingStrategy {
  const config = DEPTH_CONFIG[depth];
  const hasRubric = rubric.roleType !== "general";

  // DECISION-DRIVEN PATH: when a rubric is active, generate from signals
  if (hasRubric) {
    const domainGroup = buildDomainGroup(ctx);
    const signalProfiles = generateSignalDrivenProfiles(rubric, ctx);
    const signalFilters = generateSignalDrivenFilters(rubric, config.filterCaps);
    const signalKeywords = generateSignalDrivenKeywords(rubric, config.maxKeywords);
    const signalBoolean = generateSignalDrivenBoolean(rubric, domainGroup);

    // Use template channels + outreach (these are already archetype-aware)
    const strategy: SourcingStrategy = {
      targetProfiles: signalProfiles.length > 0
        ? signalProfiles
        : tierProfiles(v1.targetProfiles, family, ctx, config.maxProfiles, config.keepLaneDedup),
      searchChannels: compressAndPrioritizeChannels(v1.searchChannels, ctx, config.maxChannels),
      filters: signalFilters,
      keywords: signalKeywords,
      outreachAngle: enrichOutreach(v1.outreachAngle, ctx, depth),
      sampleBooleanSearch: signalBoolean,
    };

    // Final safety: strip any anti-signal leakage
    return stripAntiSignals(strategy, rubric.antiSignals);
  }

  // TEMPLATE PATH: no rubric — use existing post-processing
  return {
    targetProfiles: tierProfiles(v1.targetProfiles, family, ctx, config.maxProfiles, config.keepLaneDedup),
    searchChannels: compressAndPrioritizeChannels(v1.searchChannels, ctx, config.maxChannels),
    filters: generateFilters(family, ctx, config.filterCaps),
    keywords: buildKeywords(v1.keywords, ctx, config.maxKeywords, depth, companyName, rubric),
    outreachAngle: enrichOutreach(v1.outreachAngle, ctx, depth),
    sampleBooleanSearch: buildBoolean(v1.sampleBooleanSearch, depth, companyName, rubric),
  };
}

function buildDomainGroup(ctx: CompanyContext): string {
  const ARCHETYPE_DOMAIN: Record<string, string> = {
    "b2b-saas": '"SaaS" OR "B2B" OR "enterprise software"',
    "info-product": '"coaching" OR "education" OR "info product" OR "high-ticket"',
    "professional-services": '"consulting" OR "advisory" OR "professional services"',
    "marketplace": '"marketplace" OR "platform" OR "two-sided"',
    "dev-tools": '"developer tools" OR "devtools" OR "infrastructure"',
    "healthcare-vertical": '"healthcare" OR "healthtech" OR "digital health"',
    "consumer-prosumer": '"consumer" OR "D2C" OR "B2C"',
  };
  return ARCHETYPE_DOMAIN[ctx.archetype] || '"B2B" OR "enterprise"';
}

// ===========================================================================
// 1. Profile tiering
// ===========================================================================

const ROLE_KEYWORDS: Record<RoleFamily, string[]> = {
  sales: ["pipeline", "quota", "closing", "deal", "revenue", "seller", "commercial", "book of business"],
  marketing: ["acquisition", "funnel", "conversion", "demand", "channel", "cac", "experimentation"],
  customer_success: ["retention", "nrr", "onboarding", "adoption", "expansion", "renewal", "post-sale", "health score"],
  engineering: ["shipped", "architecture", "system", "infrastructure", "code", "technical", "stack", "platform"],
  operations: ["process", "workflow", "execution", "cross-functional", "throughput", "systems", "operational"],
  general: ["ownership", "built", "outcomes"],
};

const STAGE_KEYWORDS: Record<string, string[]> = {
  "pre-seed": ["founding", "scratch", "first hire", "0 to 1", "early-stage"],
  "seed": ["founding", "scratch", "first hire", "0 to 1", "early-stage"],
  "series-a": ["early-stage", "series a", "building from scratch", "lean team"],
  "series-b": ["series b", "scaling"],
  "growth": ["scaling", "growth-stage", "growth stage"],
  "late-stage": ["late-stage", "mature", "optimize"],
  "public": ["public", "enterprise", "large"],
  "pe-backed": ["pe-backed", "private equity", "portfolio"],
  "bootstrapped": ["bootstrapped", "profitable", "self-funded"],
  "unknown": [],
};

const ARCHETYPE_KEYWORDS: Record<CompanyArchetype, string[]> = {
  "b2b-saas": ["saas", "arr", "subscription", "churn", "plg", "product-led"],
  "info-product": ["funnel", "high-ticket", "coaching", "education", "audience", "event", "webinar", "creator", "program", "enrollment", "vsl", "info-product"],
  "professional-services": ["consulting", "advisory", "practice", "engagement", "partner", "delivery", "utilization"],
  "marketplace": ["marketplace", "gmv", "network effect", "supply", "demand", "two-sided", "liquidity"],
  "dev-tools": ["developer", "api", "sdk", "open source", "devtools", "dx"],
  "healthcare-vertical": ["healthcare", "clinical", "hipaa", "ehr", "patient", "provider", "digital health", "regulatory"],
  "consumer-prosumer": ["consumer", "d2c", "app", "mobile", "viral", "referral"],
  "general": [],
};

const LANE_FINGERPRINTS: [string, string[]][] = [
  ["direct-competitor", ["same market", "similar company", "competitor"]],
  ["adjacent-pool", ["adjacent", "consulting", "coaching", "agency", "founder", "practice leader"]],
  ["above-title", ["vp", "head of", "operating above title", "smaller company", "de facto", "smaller firm"]],
  ["domain-expert", ["domain", "market", "vertical", "buyer", "industry"]],
  ["builder-operator", ["built from scratch", "founding", "0 to 1", "lean team", "ambiguity"]],
];

function detectLane(profile: string): string {
  const text = profile.toLowerCase();
  for (const [lane, signals] of LANE_FINGERPRINTS) {
    if (signals.some((s) => text.includes(s))) return lane;
  }
  return "other";
}

function scoreProfile(description: string, family: RoleFamily, ctx: CompanyContext): number {
  const text = description.toLowerCase();
  let score = 0;

  const roleHits = (ROLE_KEYWORDS[family] || []).filter((kw) => text.includes(kw)).length;
  score += Math.min(roleHits, 2);

  const stageHits = (STAGE_KEYWORDS[ctx.stage] || []).filter((kw) => text.includes(kw)).length;
  score += Math.min(stageHits, 2);

  const archHits = (ARCHETYPE_KEYWORDS[ctx.archetype] || []).filter((kw) => text.includes(kw)).length;
  score += Math.min(archHits, 2);

  return score;
}

function tierProfiles(
  profiles: string[],
  family: RoleFamily,
  ctx: CompanyContext,
  maxProfiles: number,
  strictLaneDedup: boolean
): TieredProfile[] {
  const scored = profiles.map((description) => ({
    description,
    score: scoreProfile(description, family, ctx),
    lane: detectLane(description),
  }));

  let deduped: typeof scored;

  if (strictLaneDedup) {
    // L1/L2: keep only best per lane
    const bestByLane = new Map<string, typeof scored[0]>();
    for (const item of scored) {
      const existing = bestByLane.get(item.lane);
      if (!existing || item.score > existing.score) {
        bestByLane.set(item.lane, item);
      }
    }
    deduped = Array.from(bestByLane.values());
  } else {
    // L3: keep all profiles (allow non-obvious adjacencies from same lane)
    deduped = scored;
  }

  deduped.sort((a, b) => b.score - a.score);
  deduped = deduped.slice(0, maxProfiles);

  const total = deduped.length;
  const tier1Count = Math.min(Math.max(2, Math.ceil(total * 0.5)), 3);
  const tier3Count = total >= 4 ? 1 : 0;

  return deduped.map((s, i): TieredProfile => {
    let tier: ProfileTier;
    if (i < tier1Count) tier = "tier1";
    else if (i >= total - tier3Count) tier = "tier3";
    else tier = "tier2";
    return { tier, description: s.description };
  });
}

// ===========================================================================
// 2 + 3. Channel compression
// ===========================================================================

const CHANNEL_FINGERPRINTS: [string, string[]][] = [
  ["linkedin-recruiter", ["linkedin recruiter"]],
  ["linkedin-navigator", ["sales navigator"]],
  ["linkedin-content", ["linkedin", "posting about", "posted about", "linkedin posts"]],
  ["referral", ["referral mining", "referral", "ask people", "ask operators"]],
  ["conference", ["conference", "speaker list", "event speaker"]],
  ["podcast", ["podcast"]],
  ["community", ["community", "slack", "discord", "pavilion", "reforge", "on deck", "gainsight", "successhacker", "demand curve", "growthhackers", "superpath", "clickfunnels", "chief of staff network", "coo alliance"]],
  ["alumni", ["alumni"]],
  ["github", ["github"]],
  ["twitter", ["twitter", "twitter/x"]],
  ["angellist", ["angel.co", "wellfound"]],
];

function channelFingerprint(channel: string): string {
  const text = channel.toLowerCase();
  for (const [fp, signals] of CHANNEL_FINGERPRINTS) {
    if (signals.some((s) => text.includes(s))) return fp;
  }
  return channel.slice(0, 30).toLowerCase();
}

function scoreChannel(channel: string, ctx: CompanyContext): number {
  const text = channel.toLowerCase();
  let score = 0;

  if (text.includes("linkedin recruiter")) score += 6;
  if (text.includes("sales navigator")) score += 4;

  const archHits = (ARCHETYPE_KEYWORDS[ctx.archetype] || [])
    .filter((kw) => text.includes(kw)).length;
  score += Math.min(archHits * 2, 4);

  if (text.includes("referral")) score += 3;
  if (text.includes("podcast")) score += 2;

  if ((text.includes("community") || text.includes("pavilion") || text.includes("reforge")) && archHits > 0) score += 3;

  if (text.includes("conference") || text.includes("speaker")) score += 1;

  if (text.includes("posting about") && !text.includes("linkedin recruiter")) score -= 1;

  return score;
}

function compressAndPrioritizeChannels(
  channels: string[],
  ctx: CompanyContext,
  maxChannels: number
): PrioritizedChannel[] {
  const bestByFp = new Map<string, { channel: string; score: number }>();

  for (const channel of channels) {
    const fp = channelFingerprint(channel);
    const score = scoreChannel(channel, ctx);
    const existing = bestByFp.get(fp);
    if (!existing || score > existing.score) {
      bestByFp.set(fp, { channel, score });
    }
  }

  const sorted = Array.from(bestByFp.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChannels);

  const total = sorted.length;

  return sorted.map((s, i): PrioritizedChannel => {
    let priority: ChannelPriority;
    if (i < 2 && s.score >= 4) {
      priority = "primary";
    } else if (i >= total - 1 && total >= 4) {
      priority = "edge";
    } else {
      priority = "secondary";
    }
    return { priority, channel: s.channel };
  });
}

// ===========================================================================
// 4. Filter generation — depth-adaptive caps
// ===========================================================================

const ROLE_FILTERS: Record<RoleFamily, CandidateFilter[]> = {
  sales: [
    { category: "must-have", signal: "Has personally closed complex, multi-stakeholder deals — not just managed existing accounts" },
    { category: "must-have", signal: "Owns or has owned a quota or revenue number" },
    { category: "strong-signal", signal: "Experience selling to the same buyer persona or market" },
    { category: "strong-signal", signal: "Has built pipeline from scratch in an ambiguous environment" },
    { category: "nice-to-have", signal: "Has structured proof-of-value or pilot engagements" },
    { category: "disqualifier", signal: "Only account management or renewals — no new business closing" },
    { category: "disqualifier", signal: "Cannot articulate deals closed, revenue owned, or buyers sold to" },
  ],
  marketing: [
    { category: "must-have", signal: "Has owned acquisition, conversion, or demand gen outcomes with measurable revenue impact" },
    { category: "must-have", signal: "Can tie marketing programs directly to pipeline or revenue — not just brand metrics" },
    { category: "strong-signal", signal: "Has built and run experimentation programs across paid and organic channels" },
    { category: "strong-signal", signal: "Experience marketing to the same buyer persona or in the same market" },
    { category: "nice-to-have", signal: "Has scaled paid and organic channels simultaneously at a similar stage" },
    { category: "disqualifier", signal: "Only brand, PR, or comms — no demand gen or acquisition ownership" },
    { category: "disqualifier", signal: "No evidence of measurable pipeline, conversion, or revenue impact" },
  ],
  customer_success: [
    { category: "must-have", signal: "Owns or has owned retention, NRR, or expansion revenue targets" },
    { category: "must-have", signal: "Has built post-sale systems (onboarding, health scoring, renewal playbooks) — not just run them" },
    { category: "strong-signal", signal: "Has expanded CS into upsell/cross-sell and owns expansion revenue" },
    { category: "strong-signal", signal: "Experience with the same buyer complexity or implementation depth" },
    { category: "nice-to-have", signal: "Has built CS team and processes from scratch at a similar stage" },
    { category: "disqualifier", signal: "Only tier-1 support or ticket resolution — no strategic CS ownership" },
    { category: "disqualifier", signal: "Cannot articulate retention, NRR, or expansion outcomes" },
  ],
  engineering: [
    { category: "must-have", signal: "Has shipped production systems end-to-end — architecture through deployment" },
    { category: "must-have", signal: "Demonstrates strong system design judgment, not just feature output" },
    { category: "strong-signal", signal: "Has built under ambiguity at an early-stage or high-growth company" },
    { category: "strong-signal", signal: "Active in technical communities — open source, conference speaking, or technical writing" },
    { category: "nice-to-have", signal: "Has led a small engineering team while staying hands-on" },
    { category: "disqualifier", signal: "Only narrow-scope work at a large company — no evidence of end-to-end ownership" },
    { category: "disqualifier", signal: "No recent shipping or building signal in profile or public work" },
  ],
  operations: [
    { category: "must-have", signal: "Has built or redesigned operational processes — not just followed existing playbooks" },
    { category: "must-have", signal: "Cross-functional coordination across multiple teams or functions" },
    { category: "strong-signal", signal: "Has measured and improved operational throughput or efficiency with clear metrics" },
    { category: "strong-signal", signal: "Experience at a similar company stage navigating ambiguity" },
    { category: "nice-to-have", signal: "Consulting or strategy background applied in an operating role" },
    { category: "disqualifier", signal: "Only process-following in a structured environment — no process-building" },
    { category: "disqualifier", signal: "No evidence of cross-functional or systems-level thinking" },
  ],
  general: [
    { category: "must-have", signal: "Demonstrated ownership of measurable outcomes in their function" },
    { category: "must-have", signal: "Has built or scaled their function — not just managed steady state" },
    { category: "strong-signal", signal: "Experience at a similar company stage and type" },
    { category: "disqualifier", signal: "No evidence of building, ownership, or measurable impact" },
  ],
};

const ARCHETYPE_FILTER_OVERLAYS: Partial<Record<CompanyArchetype, CandidateFilter[]>> = {
  "info-product": [
    { category: "must-have", signal: "Has owned funnel conversion, program enrollment, or high-ticket revenue at a coaching, education, or info-product company" },
    { category: "must-have", signal: "Understands direct-response and content-to-revenue pipelines — not just brand awareness" },
    { category: "strong-signal", signal: "Has built or scaled webinar, VSL, or live-event sales funnels" },
    { category: "strong-signal", signal: "Experience with creator brands, personal-brand businesses, or audience monetization" },
    { category: "nice-to-have", signal: "Familiarity with high-ticket coaching or transformation programs" },
    { category: "disqualifier", signal: "Only SaaS or enterprise experience — no direct-response or funnel background" },
    { category: "disqualifier", signal: "Only brand/content work with no revenue ownership or conversion accountability" },
  ],
  "b2b-saas": [
    { category: "must-have", signal: "Experience in a SaaS or recurring-revenue business model" },
    { category: "strong-signal", signal: "Fluent in SaaS metrics relevant to the role (ARR, churn, NRR, CAC payback)" },
    { category: "disqualifier", signal: "No experience with subscription or recurring-revenue business models" },
  ],
  "healthcare-vertical": [
    { category: "must-have", signal: "Domain exposure to healthcare, life sciences, or clinical workflows" },
    { category: "must-have", signal: "Familiarity with regulatory environment (HIPAA, FDA, or equivalent)" },
    { category: "strong-signal", signal: "Experience selling to or building for healthcare providers, payers, or health systems" },
    { category: "nice-to-have", signal: "Understands EHR integration, clinical data workflows, or payer dynamics" },
    { category: "disqualifier", signal: "No healthcare domain exposure — regulatory and clinical learning curve too steep" },
  ],
  "marketplace": [
    { category: "must-have", signal: "Experience at a marketplace or two-sided platform business" },
    { category: "strong-signal", signal: "Understands supply/demand dynamics, liquidity, and network effects" },
    { category: "disqualifier", signal: "Only single-sided product or SaaS experience — no marketplace instinct" },
  ],
  "dev-tools": [
    { category: "must-have", signal: "Experience building for or selling to developers — understands the buyer" },
    { category: "strong-signal", signal: "Familiarity with developer experience, community-led growth, or open source" },
    { category: "disqualifier", signal: "No developer ecosystem exposure — cannot speak the buyer's language" },
  ],
  "professional-services": [
    { category: "must-have", signal: "Experience in professional services, consulting, or client-facing delivery" },
    { category: "strong-signal", signal: "Understands utilization, engagement economics, and practice-building" },
    { category: "disqualifier", signal: "Only product-company experience — no understanding of services economics" },
  ],
  "consumer-prosumer": [
    { category: "strong-signal", signal: "Experience with consumer growth loops, retention mechanics, or viral dynamics" },
    { category: "disqualifier", signal: "Only enterprise B2B experience — no consumer product instinct" },
  ],
};

function generateFilters(
  family: RoleFamily,
  ctx: CompanyContext,
  caps: Record<FilterCategory, number>
): CandidateFilter[] {
  const base = ROLE_FILTERS[family] || ROLE_FILTERS.general;
  const overlay = ARCHETYPE_FILTER_OVERLAYS[ctx.archetype];

  const source = [...(overlay || []), ...base];

  if (ctx.stage === "seed" || ctx.stage === "pre-seed" || ctx.stage === "series-a") {
    source.push({
      category: "strong-signal",
      signal: "Has worked at an early-stage company or as a founding team member",
    });
  }

  const counts: Record<string, number> = {};
  const seen = new Set<string>();
  const result: CandidateFilter[] = [];

  for (const filter of source) {
    const cap = caps[filter.category];
    const count = counts[filter.category] || 0;
    const key = `${filter.category}:${filter.signal.slice(0, 40).toLowerCase()}`;

    if (count < cap && !seen.has(key)) {
      result.push(filter);
      counts[filter.category] = count + 1;
      seen.add(key);
    }
  }

  return result;
}

// ===========================================================================
// Keyword sharpening — depth-adaptive
// ===========================================================================

const GENERIC_KEYWORDS = new Set([
  "pipeline", "quota", "strategy", "growth", "leadership", "ownership",
  "execution", "outcomes", "builder", "operator", "scaling", "revenue",
  "systems", "process", "workflow",
]);

function buildKeywords(
  keywords: string[],
  _ctx: CompanyContext,
  maxKeywords: number,
  depth: DepthLevel,
  companyName: string = "",
  rubric: RoleRubric
): string[] {
  const companyParts = companyName.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
  const antiLower = rubric.antiSignals.map((s) => s.toLowerCase());
  const hasRubric = rubric.roleType !== "general";

  // Filter out company name, generics, and anti-signals
  const cleaned = keywords.filter((kw) => {
    const kwLower = kw.toLowerCase();

    for (const part of companyParts) {
      if (kwLower.includes(part)) return false;
    }
    if (companyParts.length > 0 && kwLower.includes("market")) return false;

    // Strip keywords that match anti-signals
    if (hasRubric && antiLower.some((anti) => kwLower.includes(anti))) return false;

    if (kw.includes("AND") || kw.startsWith('"')) return true;
    if (GENERIC_KEYWORDS.has(kwLower)) return false;
    return true;
  });

  // Inject rubric must + strong signals as keywords (dedupe against existing)
  if (hasRubric) {
    const existing = new Set(cleaned.map((k) => k.toLowerCase()));
    for (const signal of [...rubric.mustSignals, ...rubric.strongSignals]) {
      if (!existing.has(signal.toLowerCase()) && cleaned.length < maxKeywords) {
        cleaned.push(signal);
        existing.add(signal.toLowerCase());
      }
    }
  }

  // For L2/L3, keep more keywords from the original set if they're multi-word
  if (depth !== "L1" && cleaned.length < maxKeywords) {
    for (const kw of keywords) {
      if (!cleaned.includes(kw) && cleaned.length < maxKeywords) {
        const kwLower = kw.toLowerCase();
        if (hasRubric && antiLower.some((anti) => kwLower.includes(anti))) continue;
        if (kw.includes(" ") || !GENERIC_KEYWORDS.has(kwLower)) {
          cleaned.push(kw);
        }
      }
    }
  }

  // Backfill for L1 if too few
  if (cleaned.length < 6) {
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (hasRubric && antiLower.some((anti) => kwLower.includes(anti))) continue;
      if (!cleaned.includes(kw) && cleaned.length < 8) {
        cleaned.push(kw);
      }
    }
  }

  return cleaned.slice(0, maxKeywords);
}

// ===========================================================================
// Outreach enrichment — L2/L3 add motivator and objection nuance
// ===========================================================================

function enrichOutreach(
  outreach: string,
  ctx: CompanyContext,
  depth: DepthLevel
): string {
  if (depth === "L1") return outreach;

  const additions: string[] = [];

  // L2+: add specific objection handling if available
  if (ctx.candidateObjections.length > 0 && depth >= "L2") {
    const topObjection = ctx.candidateObjections[0];
    if (!outreach.toLowerCase().includes(topObjection.slice(0, 20).toLowerCase())) {
      additions.push(`Key objection to preempt: ${topObjection}.`);
    }
  }

  // L3: add motivator nuance
  if (depth === "L3" && ctx.candidateMotivators.length > 2) {
    const deepMotivator = ctx.candidateMotivators[ctx.candidateMotivators.length - 1];
    if (!outreach.toLowerCase().includes(deepMotivator.slice(0, 20).toLowerCase())) {
      additions.push(`Secondary motivator worth surfacing: ${deepMotivator.toLowerCase()}.`);
    }
  }

  if (additions.length === 0) return outreach;
  return `${outreach} ${additions.join(" ")}`;
}

// ===========================================================================
// Boolean cleanup — depth-adaptive strictness
// ===========================================================================

const LOW_SIGNAL_BOOLEAN_TERMS = [
  '"growth"', '"audience"', '"ownership"', '"execution"',
  '"outcomes"', '"leadership"', '"builder"', '"operator"',
  '"strategy"', '"revenue"',
];

function buildBoolean(
  raw: string,
  depth: DepthLevel,
  companyName: string = "",
  rubric: RoleRubric
): string {
  let cleaned = raw;

  // Strip company name and possessive forms
  if (companyName) {
    const nameParts = companyName.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length < 3) continue;
      const patterns = [
        `"${part}"`, `"${part}'s"`, `"${part}'s market"`,
        `"${part}'s"`, part,
      ];
      for (const p of patterns) {
        cleaned = cleaned.replace(new RegExp(`${escapeRegex(p)}\\s*(OR\\s*)?`, "gi"), "");
        cleaned = cleaned.replace(new RegExp(`\\s*OR\\s*${escapeRegex(p)}`, "gi"), "");
      }
    }
  }

  // Strip anti-signals from boolean
  if (rubric.antiSignals.length > 0) {
    for (const anti of rubric.antiSignals) {
      const quoted = `"${anti}"`;
      cleaned = cleaned.replace(new RegExp(`${escapeRegex(quoted)}\\s*(OR\\s*)?`, "gi"), "");
      cleaned = cleaned.replace(new RegExp(`\\s*OR\\s*${escapeRegex(quoted)}`, "gi"), "");
      // Also strip unquoted in NOT clause — these are fine, but strip from positive clauses
      cleaned = cleaned.replace(new RegExp(`${escapeRegex(quoted)}`, "gi"), "");
    }
  }

  cleaned = cleaned.replace(/""\s*(OR\s*)?/g, "");

  const termsToStrip = depth === "L1"
    ? LOW_SIGNAL_BOOLEAN_TERMS
    : LOW_SIGNAL_BOOLEAN_TERMS.slice(0, 6);

  for (const term of termsToStrip) {
    cleaned = cleaned.replace(new RegExp(`${escapeRegex(term)}\\s*OR\\s*`, "gi"), "");
    cleaned = cleaned.replace(new RegExp(`\\s*OR\\s*${escapeRegex(term)}`, "gi"), "");
    cleaned = cleaned.replace(new RegExp(escapeRegex(term), "gi"), "");
  }

  cleaned = cleaned
    .replace(/\(\s*OR\s*/g, "(")
    .replace(/\s*OR\s*\)/g, ")")
    .replace(/OR\s+OR/g, "OR")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*(AND|OR)\s*/i, "")
    .replace(/\s*(AND|OR)\s*$/i, "")
    .trim();

  return cleaned;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ===========================================================================
// Final safety pass — strip anti-signals from all text fields
// ===========================================================================

function stripAntiSignals(strategy: SourcingStrategy, antiSignals: string[]): SourcingStrategy {
  const antiLower = antiSignals.map((s) => s.toLowerCase());

  function containsAnti(text: string): boolean {
    const lower = text.toLowerCase();
    return antiLower.some((anti) => lower.includes(anti));
  }

  function cleanText(text: string): string {
    let cleaned = text;
    for (const anti of antiSignals) {
      cleaned = cleaned.replace(new RegExp(escapeRegex(anti), "gi"), "").replace(/\s{2,}/g, " ").trim();
    }
    return cleaned;
  }

  return {
    targetProfiles: strategy.targetProfiles
      .map((p) => ({
        ...p,
        description: containsAnti(p.description) ? cleanText(p.description) : p.description,
      }))
      .filter((p) => p.description.length > 20), // drop profiles that became empty
    searchChannels: strategy.searchChannels,
    filters: strategy.filters,
    keywords: strategy.keywords.filter((kw) => !containsAnti(kw)),
    outreachAngle: cleanText(strategy.outreachAngle),
    sampleBooleanSearch: strategy.sampleBooleanSearch, // already handled by buildBoolean
  };
}
