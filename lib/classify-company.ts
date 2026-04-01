import { HiringBrief, CompanyArchetype } from "./types";

interface ArchetypeConfig {
  signals: string[];
  knownCompanies: string[];
  label: string;
  talentPools: string[];
  channelHints: string[];
  outreachTone: string;
}

const ARCHETYPE_CONFIG: Record<Exclude<CompanyArchetype, "general">, ArchetypeConfig> = {
  "info-product": {
    signals: [
      "coaching", "course", "program", "seminar", "event", "workshop",
      "info product", "digital product", "personal brand", "speaking",
      "masterclass", "community", "membership", "education business",
      "thought leader", "motivational", "self-help", "training company",
      "live event", "virtual event", "high-ticket offer", "funnel",
      "audience", "content creator", "influencer", "online education",
    ],
    knownCompanies: [
      "tony robbins", "robbins research", "brendon burchard",
      "dean graziosi", "marie forleo", "ramit sethi", "russell brunson",
      "clickfunnels", "mindvalley", "strategic coach", "foundr",
      "masterclass", "sam ovens", "tai lopez", "grant cardone",
      "cardone enterprises", "alex hormozi", "acquisition.com",
    ],
    label: "Info-Product / Education / Coaching Brand",
    talentPools: [
      "High-ticket coaching and education companies (Tony Robbins, Brendon Burchard, Mindvalley, Strategic Coach)",
      "Direct-response and performance marketing operators from info-product brands",
      "Event and experience companies — people who have scaled live/virtual event businesses",
      "High-growth D2C brands with similar funnel-driven sales motions",
    ],
    channelHints: [
      "Search for operators at known info-product and coaching brands — these people understand high-ticket funnels, event-driven sales, and audience monetization",
      "Look in direct-response marketing communities (ClickFunnels community, Hormozi's Acquisition.com network, funnel builder groups)",
      "Target people who have worked at event companies or personal-brand businesses — they understand the operating model",
    ],
    outreachTone: "Frame around the scale of the brand's audience and the unique operating model — info-product businesses are not SaaS, and candidates who understand that distinction are rare and valuable. Emphasize the energy, pace, and direct impact on revenue.",
  },

  "professional-services": {
    signals: [
      "consulting", "advisory", "professional services", "firm",
      "engagement", "client services", "partner", "practice",
      "utilization", "billable", "delivery", "managed services",
      "implementation", "transformation", "strategy consulting",
    ],
    knownCompanies: [
      "mckinsey", "bain", "bcg", "deloitte", "accenture", "kpmg",
      "ey", "pwc", "korn ferry", "heidrick", "spencer stuart",
      "booz allen", "oliver wyman", "roland berger", "lef",
      "franklincovey", "bts", "gallup", "gartner",
    ],
    label: "Professional Services / Consulting",
    talentPools: [
      "Management consulting firms (McKinsey, Bain, BCG, boutiques)",
      "Big 4 advisory practices (Deloitte, EY, PwC, KPMG)",
      "Boutique and mid-market consulting firms in the same domain",
      "Executive search and leadership advisory firms",
    ],
    channelHints: [
      "Target alumni networks of major consulting firms — these candidates understand client-facing work, structured delivery, and partner-track dynamics",
      "Look at boutique consulting firms in the same vertical — operators there often want a bigger platform",
    ],
    outreachTone: "Speak to the professional services operating model — utilization, client relationships, practice building. Candidates from this world value intellectual challenge, client impact, and path to partnership or equity.",
  },

  "b2b-saas": {
    signals: [
      "saas", "software", "platform", "product-led", "plg",
      "subscription", "arr", "mrr", "churn", "seat-based",
      "cloud", "self-serve", "enterprise software",
    ],
    knownCompanies: [
      "salesforce", "hubspot", "stripe", "datadog", "snowflake",
      "figma", "notion", "linear", "vercel", "retool",
      "amplitude", "segment", "twilio", "gong", "clari",
      "monday.com", "airtable", "asana", "clickup",
    ],
    label: "B2B SaaS",
    talentPools: [
      "Adjacent SaaS companies in the same vertical or buyer persona",
      "SaaS companies at a similar stage (series, headcount, ARR range)",
      "PLG companies if the motion is product-led",
      "Enterprise software companies if the motion is sales-led",
    ],
    channelHints: [
      "Filter by SaaS-specific titles and metrics language (ARR, churn, NRR, PLG) in profiles",
      "SaaS communities (SaaStr, Pavilion, OpenView network) are high-signal",
    ],
    outreachTone: "SaaS candidates speak in metrics — ARR, NRR, churn, CAC payback. Frame the opportunity around the product, the motion (PLG vs sales-led), and the growth trajectory.",
  },

  "marketplace": {
    signals: [
      "marketplace", "two-sided", "supply and demand", "liquidity",
      "gmv", "take rate", "matching", "network effects",
      "gig", "freelance platform",
    ],
    knownCompanies: [
      "uber", "airbnb", "doordash", "instacart", "upwork",
      "fiverr", "thumbtack", "rover", "faire", "etsy",
    ],
    label: "Marketplace / Platform",
    talentPools: [
      "Other marketplace companies (two-sided platforms with similar dynamics)",
      "Gig economy and platform companies",
      "E-commerce companies with supply-side operations",
    ],
    channelHints: [
      "Look for candidates who understand network effects, supply/demand balancing, and GMV growth",
      "Marketplace-specific communities and operators who have scaled liquidity",
    ],
    outreachTone: "Marketplace candidates care about the chicken-and-egg problem, network effects, and unit economics. Frame the opportunity around the supply/demand dynamic and growth trajectory.",
  },

  "dev-tools": {
    signals: [
      "developer tools", "devtools", "infrastructure", "api",
      "sdk", "open source", "developer experience", "dx",
      "cli", "platform engineering", "observability", "cicd",
    ],
    knownCompanies: [
      "vercel", "supabase", "planetscale", "railway", "render",
      "datadog", "grafana", "hashicorp", "gitlab", "github",
      "postman", "snyk", "sentry", "launchdarkly",
    ],
    label: "Developer Tools / Infrastructure",
    talentPools: [
      "Other devtools and infrastructure companies",
      "Open source project maintainers and contributors",
      "Cloud platform teams at larger companies (AWS, GCP, Azure alumni)",
      "Developer relations and developer experience operators",
    ],
    channelHints: [
      "GitHub and open source communities are primary sourcing channels — not just for engineers, but for DevRel, product, and GTM roles",
      "Developer-focused conferences (KubeCon, QCon, Strange Loop) and communities (Hacker News, dev Twitter)",
    ],
    outreachTone: "Devtools candidates value developer experience, craft, and community. Frame around the technical problem, the developer audience, and the open source / community angle if relevant.",
  },

  "healthcare-vertical": {
    signals: [
      "healthcare", "health tech", "healthtech", "clinical",
      "patient", "provider", "payer", "ehr", "emr", "hipaa",
      "pharma", "biotech", "medtech", "digital health",
      "telehealth", "telemedicine", "life sciences",
    ],
    knownCompanies: [
      "epic", "cerner", "veeva", "athenahealth", "flatiron",
      "tempus", "devoted health", "cityblock", "ro", "hims",
      "oscar health", "clover health", "doximity",
    ],
    label: "Healthcare / Vertical SaaS",
    talentPools: [
      "Other healthtech and digital health companies",
      "EHR/EMR companies and health system vendors",
      "Pharma and life sciences technology companies",
      "Healthcare consulting firms (Advisory Board, Chartis, Huron)",
    ],
    channelHints: [
      "Healthcare-specific communities (HIMSS, HLTH, Rock Health network) are high-signal for both technical and commercial roles",
      "Regulatory and compliance experience (HIPAA, FDA) is a differentiator — look for it in profiles",
    ],
    outreachTone: "Healthcare candidates value mission and impact but also care about regulatory complexity and whether the company truly understands the space. Frame around the clinical or patient impact and the team's domain credibility.",
  },

  "consumer-prosumer": {
    signals: [
      "consumer", "d2c", "dtc", "direct to consumer", "prosumer",
      "b2c", "app", "mobile", "social", "creator",
      "subscription box", "e-commerce", "brand",
    ],
    knownCompanies: [
      "spotify", "netflix", "duolingo", "canva", "calendly",
      "notion", "figma", "robinhood", "cash app", "venmo",
      "peloton", "headspace", "calm",
    ],
    label: "Consumer / Prosumer Brand",
    talentPools: [
      "Other consumer and prosumer product companies",
      "D2C and subscription brands with similar user bases",
      "Consumer fintech and consumer health companies",
      "Creator economy and social platforms",
    ],
    channelHints: [
      "Look for candidates with consumer product sense — growth loops, retention mechanics, viral/referral dynamics",
      "Consumer-focused communities (Lenny's Newsletter, consumer product Twitter)",
    ],
    outreachTone: "Consumer candidates care about product craft, user love, and growth mechanics. Frame around the user base, the product experience, and the growth trajectory.",
  },
};

export interface CompanyArchetypeResult {
  archetype: CompanyArchetype;
  label: string;
  talentPools: string[];
  channelHints: string[];
  outreachTone: string;
}

export function classifyCompany(brief: HiringBrief): CompanyArchetypeResult {
  const text = `${brief.company} ${brief.role} ${brief.description}`.toLowerCase();
  const companyName = brief.company.toLowerCase();

  // First pass: check known company names (strongest signal)
  for (const [archetype, config] of Object.entries(ARCHETYPE_CONFIG)) {
    for (const name of config.knownCompanies) {
      if (companyName.includes(name)) {
        return {
          archetype: archetype as CompanyArchetype,
          label: config.label,
          talentPools: config.talentPools,
          channelHints: config.channelHints,
          outreachTone: config.outreachTone,
        };
      }
    }
  }

  // Second pass: score by signal density
  const scores: Partial<Record<CompanyArchetype, number>> = {};
  for (const [archetype, config] of Object.entries(ARCHETYPE_CONFIG)) {
    let score = 0;
    for (const signal of config.signals) {
      if (text.includes(signal)) score++;
    }
    if (score > 0) {
      scores[archetype as CompanyArchetype] = score;
    }
  }

  const entries = Object.entries(scores) as [Exclude<CompanyArchetype, "general">, number][];
  if (entries.length === 0) {
    return {
      archetype: "general",
      label: "General / Unknown",
      talentPools: ["Adjacent companies in the same market and stage"],
      channelHints: ["Use standard sourcing channels appropriate to the role family"],
      outreachTone: "Frame around the role's scope, ownership, and the specific business challenge.",
    };
  }

  entries.sort((a, b) => b[1] - a[1]);
  const winner = entries[0][0];
  const config = ARCHETYPE_CONFIG[winner];

  return {
    archetype: winner,
    label: config.label,
    talentPools: config.talentPools,
    channelHints: config.channelHints,
    outreachTone: config.outreachTone,
  };
}
