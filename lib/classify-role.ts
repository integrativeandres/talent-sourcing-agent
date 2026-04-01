import { HiringBrief, RoleFamily, RoleClassification } from "./types";

type FamilyConfig = {
  signals: string[];
  titleSignals: string[];
  primitive: RoleClassification["primitive"];
  primaryMetric: string;
  lifecycleStage: string;
};

const FAMILY_CONFIG: Record<Exclude<RoleFamily, "general">, FamilyConfig> = {
  sales: {
    signals: [
      "sales", "revenue", "commercial", "business development", "enterprise",
      "account executive", "account manager", "partnerships", "deal", "quota",
      "closing", "gtm", "go-to-market", "p&l", "transformation",
      "consulting", "advisory", "hunter", "new business", "selling", "sold",
      "acv", "arr", "bookings", "book of business", "executive buyers",
      "enterprise seller",
    ],
    titleSignals: [
      "sales", "cro", "chief revenue", "vp sales", "head of sales",
      "account executive", "business development", "commercial",
    ],
    primitive: "close-revenue",
    primaryMetric: "revenue / pipeline / bookings",
    lifecycleStage: "sales",
  },
  customer_success: {
    signals: [
      "customer success", "csm", "onboarding", "retention", "renewals",
      "nrr", "expansion", "customer experience", "adoption",
      "customer lifecycle", "health score", "post-sale",
    ],
    titleSignals: [
      "customer success", "csm", "cs lead", "head of cs",
      "vp customer success",
    ],
    primitive: "retain-expand",
    primaryMetric: "NRR / retention / expansion",
    lifecycleStage: "post-sale",
  },
  marketing: {
    signals: [
      "marketing", "brand", "content", "demand gen", "demand generation",
      "growth marketing", "performance marketing", "communications", "pr",
      "seo", "paid media", "lifecycle marketing", "product marketing",
      "field marketing", "acquisition", "cac", "funnel", "conversion",
      "channel", "experimentation", "growth loops", "inbound",
    ],
    titleSignals: [
      "marketing", "cmo", "demand gen", "growth marketing", "seo",
      "paid media", "head of growth",
    ],
    primitive: "generate-demand",
    primaryMetric: "pipeline generated / CAC / conversion",
    lifecycleStage: "demand generation",
  },
  engineering: {
    signals: [
      "engineer", "engineering", "developer", "architect", "sre", "devops",
      "full-stack", "frontend", "backend", "infrastructure", "platform",
      "data engineer", "ml engineer", "security engineer", "qa", "software",
      "coding", "programming", "technical lead", "tech lead",
    ],
    titleSignals: [
      "engineer", "engineering", "developer", "sre", "cto", "architect",
      "tech lead",
    ],
    primitive: "build-product",
    primaryMetric: "product / system delivery",
    lifecycleStage: "product delivery",
  },
  operations: {
    signals: [
      "operations", "program management", "chief of staff", "workflow",
      "process", "delivery", "supply chain", "logistics", "business ops",
      "revops", "revenue operations",
    ],
    titleSignals: [
      "operations", "coo", "chief of staff", "program manager",
    ],
    primitive: "operate-deliver",
    primaryMetric: "execution / throughput / efficiency",
    lifecycleStage: "delivery",
  },
};

const GENERAL_CLASSIFICATION: RoleClassification = {
  family: "general",
  primitive: "operate-deliver",
  primaryMetric: "varies by role",
  lifecycleStage: "varies",
};

export function classifyRole(brief: HiringBrief): RoleClassification {
  const titleText = brief.role.toLowerCase();
  const fullText = `${brief.role} ${brief.description}`.toLowerCase();

  const scores: Partial<Record<Exclude<RoleFamily, "general">, number>> = {};

  for (const [family, config] of Object.entries(FAMILY_CONFIG)) {
    let score = 0;

    // Score from full text signals (title + description)
    for (const signal of config.signals) {
      if (fullText.includes(signal)) {
        score++;
      }
    }

    // Heavy boost for title matches — the role title is the strongest signal
    for (const signal of config.titleSignals) {
      if (titleText.includes(signal)) {
        score += 10;
      }
    }

    if (score > 0) {
      scores[family as Exclude<RoleFamily, "general">] = score;
    }
  }

  const entries = Object.entries(scores) as [Exclude<RoleFamily, "general">, number][];
  if (entries.length === 0) return GENERAL_CLASSIFICATION;

  entries.sort((a, b) => b[1] - a[1]);
  const winner = entries[0][0];
  const config = FAMILY_CONFIG[winner];

  return {
    family: winner,
    primitive: config.primitive,
    primaryMetric: config.primaryMetric,
    lifecycleStage: config.lifecycleStage,
  };
}
