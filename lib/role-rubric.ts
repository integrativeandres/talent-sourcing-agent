import { RoleRubric } from "./types";

interface RubricConfig {
  signals: string[];
  rubric: RoleRubric;
}

const RUBRICS: RubricConfig[] = [
  {
    signals: ["revops", "revenue operations", "rev ops", "gtm systems", "go-to-market operations"],
    rubric: {
      roleType: "revops",
      mustSignals: ["forecasting", "pipeline analytics", "CRM", "revenue operations", "go-to-market systems"],
      strongSignals: ["salesforce", "hubspot", "data hygiene", "funnel analysis", "conversion analytics", "territory planning"],
      antiSignals: ["closed deals", "quota", "book of business", "carried quota", "selling", "cold outbound", "prospecting"],
      languageConstraints: ["systems", "infrastructure", "analytics", "process design", "forecasting", "data"],
    },
  },
  {
    signals: ["product marketing", "pmm", "product marketer"],
    rubric: {
      roleType: "product_marketing",
      mustSignals: ["positioning", "messaging", "go-to-market", "product launch"],
      strongSignals: ["ICP", "personas", "narrative", "enablement", "competitive intel", "sales enablement"],
      antiSignals: ["brand only", "content only", "social media", "paid media", "demand gen", "CAC"],
      languageConstraints: ["translation", "differentiation", "story", "positioning", "launch"],
    },
  },
  {
    signals: ["chief of staff", "cos"],
    rubric: {
      roleType: "chief_of_staff",
      mustSignals: ["cross-functional", "execution", "founder support", "strategic initiatives"],
      strongSignals: ["operations", "strategic planning", "internal systems", "board prep", "org design"],
      antiSignals: ["administrative support", "calendar management", "executive assistant", "scheduling"],
      languageConstraints: ["ambiguity", "leverage", "prioritization", "cross-functional", "initiatives"],
    },
  },
  {
    signals: ["sales", "account executive", "enterprise sales", "business development", "closer"],
    rubric: {
      roleType: "sales",
      mustSignals: ["closed", "pipeline", "quota", "deal cycle", "executive buyers"],
      strongSignals: ["multi-threaded", "enterprise deal", "book of business", "proof of value", "complex sale"],
      antiSignals: ["CRM admin", "reporting only", "forecasting only", "revenue operations", "data hygiene"],
      languageConstraints: ["revenue ownership", "closing", "deal execution", "buyer relationships"],
    },
  },
  {
    signals: ["demand gen", "growth marketing", "performance marketing"],
    rubric: {
      roleType: "demand_gen",
      mustSignals: ["demand generation", "pipeline", "acquisition", "conversion", "CAC"],
      strongSignals: ["experimentation", "attribution", "funnel optimization", "channel mix", "paid + organic"],
      antiSignals: ["positioning only", "brand only", "social media only", "content calendar"],
      languageConstraints: ["acquisition", "conversion", "experimentation", "pipeline generation"],
    },
  },
  {
    signals: ["customer success", "cs lead", "head of cs", "csm"],
    rubric: {
      roleType: "customer_success",
      mustSignals: ["retention", "NRR", "onboarding", "expansion", "customer lifecycle"],
      strongSignals: ["health score", "renewal playbook", "land and expand", "adoption"],
      antiSignals: ["ticket resolution", "call center", "support queue", "first response time", "cold outbound"],
      languageConstraints: ["post-sale", "retention", "expansion", "adoption", "lifecycle"],
    },
  },
  {
    signals: ["engineer", "developer", "backend", "frontend", "full-stack"],
    rubric: {
      roleType: "engineering",
      mustSignals: ["shipped", "architecture", "system design", "production", "technical ownership"],
      strongSignals: ["founding engineer", "built from scratch", "open source", "staff engineer"],
      antiSignals: ["quota", "book of business", "closing deals", "demand gen", "brand strategy"],
      languageConstraints: ["system", "architecture", "shipped", "technical", "built"],
    },
  },
  {
    signals: ["operations", "head of ops", "vp ops", "business operations"],
    rubric: {
      roleType: "operations",
      mustSignals: ["process design", "cross-functional", "operational infrastructure", "throughput"],
      strongSignals: ["org design", "chief of staff", "systems thinking", "workflow"],
      antiSignals: ["quota", "closing deals", "paid media", "social media"],
      languageConstraints: ["process", "cross-functional", "infrastructure", "throughput", "design"],
    },
  },
];

const DEFAULT_RUBRIC: RoleRubric = {
  roleType: "general",
  mustSignals: [],
  strongSignals: [],
  antiSignals: [],
  languageConstraints: [],
};

export function getRoleRubric(role: string, description: string = ""): RoleRubric {
  const text = `${role} ${description}`.toLowerCase();

  // Score each rubric by signal matches — highest wins
  let bestMatch: RubricConfig | null = null;
  let bestScore = 0;

  for (const config of RUBRICS) {
    let score = 0;
    for (const signal of config.signals) {
      if (text.includes(signal.toLowerCase())) {
        // Title match gets heavy weight
        if (role.toLowerCase().includes(signal.toLowerCase())) {
          score += 5;
        } else {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = config;
    }
  }

  return bestMatch ? bestMatch.rubric : DEFAULT_RUBRIC;
}
