import {
  SourcingStrategyV1,
  SourcingStrategy,
  TieredProfile,
  PrioritizedChannel,
  CandidateFilter,
  ProfileTier,
  ChannelPriority,
  FilterCategory,
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
    searchChannels: compressAndPrioritizeChannels(v1.searchChannels, ctx),
    filters: generateFilters(family, ctx),
    keywords: sharpenKeywords(v1.keywords, ctx),
    outreachAngle: v1.outreachAngle,
    sampleBooleanSearch: cleanBoolean(v1.sampleBooleanSearch),
  };
}

// ===========================================================================
// 1. Profile tiering — score, deduplicate lanes, distribute 2–3 T1 / 1–2 T2 / 0–1 T3
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

// Sourcing "lane" fingerprints — each profile should map to a distinct lane
const LANE_FINGERPRINTS: [string, string[]][] = [
  ["direct-competitor", ["same market", "similar company", "competitor"]],
  ["adjacent-pool", ["adjacent", "consulting", "coaching", "agency", "founder", "practice leader"]],
  ["above-title", ["vp", "head of", "operating above title", "smaller company", "de facto"]],
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
  ctx: CompanyContext
): TieredProfile[] {
  // Score all profiles
  const scored = profiles.map((description) => ({
    description,
    score: scoreProfile(description, family, ctx),
    lane: detectLane(description),
  }));

  // Deduplicate lanes: keep the highest-scoring profile per lane
  const bestByLane = new Map<string, typeof scored[0]>();
  for (const item of scored) {
    const existing = bestByLane.get(item.lane);
    if (!existing || item.score > existing.score) {
      bestByLane.set(item.lane, item);
    }
  }

  // Also keep any profiles from lanes that weren't deduped (unique lanes)
  // Sort remaining by score
  const deduped = Array.from(bestByLane.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Max 5 profiles

  // Distribute: top 2–3 = T1, next 1–2 = T2, last 0–1 = T3
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
// 2 + 3. Channel compression — merge overlaps, cap at 5–6, strict priority
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

  // Niche communities with archetype signal are strong
  if ((text.includes("community") || text.includes("pavilion") || text.includes("reforge")) && archHits > 0) score += 3;

  if (text.includes("conference") || text.includes("speaker")) score += 1;

  // Merge linkedin-content into linkedin-recruiter if both exist — penalize standalone
  if (text.includes("posting about") && !text.includes("linkedin recruiter")) score -= 1;

  return score;
}

function compressAndPrioritizeChannels(
  channels: string[],
  ctx: CompanyContext
): PrioritizedChannel[] {
  // Deduplicate by fingerprint, keep highest-scoring
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
    .slice(0, 6); // Hard cap: 6 channels

  // Strict priority: max 2 primary, rest secondary, bottom 1 = edge
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
// 4. Filter generation — unchanged from V2.3 (already tight)
// ===========================================================================

const FILTER_CAPS: Record<FilterCategory, number> = {
  "must-have": 2,
  "strong-signal": 3,
  "nice-to-have": 0,
  "disqualifier": 2,
};

const ROLE_FILTERS: Record<RoleFamily, CandidateFilter[]> = {
  sales: [
    { category: "must-have", signal: "Has personally closed complex, multi-stakeholder deals — not just managed existing accounts" },
    { category: "must-have", signal: "Owns or has owned a quota or revenue number" },
    { category: "strong-signal", signal: "Experience selling to the same buyer persona or market" },
    { category: "strong-signal", signal: "Has built pipeline from scratch in an ambiguous environment" },
    { category: "disqualifier", signal: "Only account management or renewals — no new business closing" },
    { category: "disqualifier", signal: "Cannot articulate deals closed, revenue owned, or buyers sold to" },
  ],
  marketing: [
    { category: "must-have", signal: "Has owned acquisition, conversion, or demand gen outcomes with measurable revenue impact" },
    { category: "must-have", signal: "Can tie marketing programs directly to pipeline or revenue — not just brand metrics" },
    { category: "strong-signal", signal: "Has built and run experimentation programs across paid and organic channels" },
    { category: "strong-signal", signal: "Experience marketing to the same buyer persona or in the same market" },
    { category: "disqualifier", signal: "Only brand, PR, or comms — no demand gen or acquisition ownership" },
    { category: "disqualifier", signal: "No evidence of measurable pipeline, conversion, or revenue impact" },
  ],
  customer_success: [
    { category: "must-have", signal: "Owns or has owned retention, NRR, or expansion revenue targets" },
    { category: "must-have", signal: "Has built post-sale systems (onboarding, health scoring, renewal playbooks) — not just run them" },
    { category: "strong-signal", signal: "Has expanded CS into upsell/cross-sell and owns expansion revenue" },
    { category: "strong-signal", signal: "Experience with the same buyer complexity or implementation depth" },
    { category: "disqualifier", signal: "Only tier-1 support or ticket resolution — no strategic CS ownership" },
    { category: "disqualifier", signal: "Cannot articulate retention, NRR, or expansion outcomes" },
  ],
  engineering: [
    { category: "must-have", signal: "Has shipped production systems end-to-end — architecture through deployment" },
    { category: "must-have", signal: "Demonstrates strong system design judgment, not just feature output" },
    { category: "strong-signal", signal: "Has built under ambiguity at an early-stage or high-growth company" },
    { category: "strong-signal", signal: "Active in technical communities — open source, conference speaking, or technical writing" },
    { category: "disqualifier", signal: "Only narrow-scope work at a large company — no evidence of end-to-end ownership" },
    { category: "disqualifier", signal: "No recent shipping or building signal in profile or public work" },
  ],
  operations: [
    { category: "must-have", signal: "Has built or redesigned operational processes — not just followed existing playbooks" },
    { category: "must-have", signal: "Cross-functional coordination across multiple teams or functions" },
    { category: "strong-signal", signal: "Has measured and improved operational throughput or efficiency with clear metrics" },
    { category: "strong-signal", signal: "Experience at a similar company stage navigating ambiguity" },
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

function generateFilters(family: RoleFamily, ctx: CompanyContext): CandidateFilter[] {
  const base = ROLE_FILTERS[family] || ROLE_FILTERS.general;
  const overlay = ARCHETYPE_FILTER_OVERLAYS[ctx.archetype];

  const source = overlay ? [...overlay, ...base] : [...base];

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
    const cap = FILTER_CAPS[filter.category];
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
// 4. Keyword sharpening — remove generic, keep high-signal
// ===========================================================================

const GENERIC_KEYWORDS = new Set([
  "pipeline", "quota", "strategy", "growth", "leadership", "ownership",
  "execution", "outcomes", "builder", "operator", "scaling", "revenue",
  "systems", "process", "workflow",
]);

function sharpenKeywords(keywords: string[], ctx: CompanyContext): string[] {
  // Remove generics that don't appear in a Boolean phrase (quoted or AND)
  const sharpened = keywords.filter((kw) => {
    // Keep Boolean phrases (contain AND or quotes)
    if (kw.includes("AND") || kw.startsWith('"')) return true;
    // Drop single-word generics
    if (GENERIC_KEYWORDS.has(kw.toLowerCase())) return false;
    return true;
  });

  // Ensure at least 6 keywords
  if (sharpened.length < 6) {
    for (const kw of keywords) {
      if (!sharpened.includes(kw) && sharpened.length < 8) {
        sharpened.push(kw);
      }
    }
  }

  return sharpened.slice(0, 10);
}

// ===========================================================================
// 5. Boolean cleanup — tight, specific, usable
// ===========================================================================

const LOW_SIGNAL_BOOLEAN_TERMS = [
  '"growth"', '"audience"', '"ownership"', '"execution"',
  '"outcomes"', '"leadership"', '"builder"', '"operator"',
  '"strategy"', '"revenue"',
];

function cleanBoolean(raw: string): string {
  let cleaned = raw;

  // Remove empty quoted strings
  cleaned = cleaned.replace(/""\s*(OR\s*)?/g, "");

  // Remove low-signal terms
  for (const term of LOW_SIGNAL_BOOLEAN_TERMS) {
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
