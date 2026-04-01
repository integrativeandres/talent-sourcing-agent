import { HiringBrief, CompanyContext, CompanyStage, SeatType } from "./types";
import { classifyCompany } from "./classify-company";

export function interpretCompanyContext(brief: HiringBrief): CompanyContext {
  const text = `${brief.role} ${brief.company} ${brief.description}`.toLowerCase();
  const archetypeResult = classifyCompany(brief);

  // Merge archetype talent pools with brief-inferred pools, deduped
  const briefPools = inferAdjacentPools(text);
  const allPools = [...archetypeResult.talentPools];
  for (const pool of briefPools) {
    if (!allPools.some((p) => p.toLowerCase() === pool.toLowerCase())) {
      allPools.push(pool);
    }
  }

  return {
    archetype: archetypeResult.archetype,
    companyType: archetypeResult.label,
    stage: inferStage(text),
    market: inferMarket(text, brief),
    buyerType: inferBuyerType(text),
    talentBrandStrength: inferTalentBrand(text, brief),
    adjacentTalentPools: allPools,
    candidateMotivators: inferMotivators(text),
    candidateObjections: inferObjections(text, brief),
    seatType: inferSeatType(text),
  };
}

function inferStage(text: string): CompanyStage {
  if (has(text, "pre-seed", "pre seed", "idea stage")) return "pre-seed";
  if (has(text, "seed", "pre-revenue", "early stage", "early-stage")) return "seed";
  if (has(text, "series a", "series-a")) return "series-a";
  if (has(text, "series b", "series-b")) return "series-b";
  if (has(text, "series c", "series d", "series e", "growth stage", "growth-stage", "scaling"))
    return "growth";
  if (has(text, "ipo", "public company", "publicly traded", "post-ipo"))
    return "public";
  if (has(text, "pe-backed", "private equity", "pe backed", "portfolio company"))
    return "pe-backed";
  if (has(text, "bootstrapped", "profitable", "self-funded"))
    return "bootstrapped";
  if (has(text, "late stage", "late-stage", "pre-ipo"))
    return "late-stage";
  // Heuristic: if they mention building from scratch, likely earlier stage
  if (has(text, "building from scratch", "first hire", "founding", "0 to 1"))
    return "seed";
  return "unknown";
}

function inferMarket(text: string, brief: HiringBrief): string {
  if (has(text, "leadership development", "executive coaching", "coaching", "talent development"))
    return "Leadership development and executive coaching";
  if (has(text, "hr tech", "people tech", "talent management"))
    return "HR technology and talent management";
  if (has(text, "fintech", "payments", "banking", "lending"))
    return "Financial technology";
  if (has(text, "health", "healthcare", "clinical", "patient"))
    return "Healthcare and life sciences";
  if (has(text, "security", "cybersecurity", "infosec"))
    return "Cybersecurity";
  if (has(text, "developer tools", "devtools", "infrastructure", "cloud"))
    return "Developer tools and cloud infrastructure";
  if (has(text, "education", "edtech", "learning"))
    return "Education technology";
  if (has(text, "e-commerce", "ecommerce", "retail", "commerce"))
    return "E-commerce and retail technology";
  if (has(text, "ai", "machine learning", "llm", "artificial intelligence"))
    return "AI and machine learning";
  return `${brief.company}'s market`;
}

function inferBuyerType(text: string): string {
  if (has(text, "ceo", "founder", "c-suite", "executive buyer"))
    return "CEOs, founders, and C-suite executives";
  if (has(text, "chro", "vp people", "head of people", "hr leader"))
    return "CHROs, VP People, and HR leaders";
  if (has(text, "cto", "vp engineering", "head of engineering"))
    return "CTOs and engineering leaders";
  if (has(text, "cmo", "vp marketing", "head of marketing"))
    return "CMOs and marketing leaders";
  if (has(text, "cfo", "vp finance", "head of finance"))
    return "CFOs and finance leaders";
  if (has(text, "enterprise", "large company", "fortune 500"))
    return "Enterprise buyers and department heads";
  if (has(text, "smb", "small business", "mid-market"))
    return "SMB and mid-market buyers";
  if (has(text, "developer", "engineer"))
    return "Developers and technical practitioners";
  return "Business leaders and decision-makers";
}

function inferTalentBrand(text: string, brief: HiringBrief): CompanyContext["talentBrandStrength"] {
  // Well-known companies have strong talent brands
  const knownBrands = [
    "google", "meta", "stripe", "amazon", "microsoft", "apple",
    "salesforce", "hubspot", "shopify", "datadog", "figma", "notion",
    "korn ferry", "mckinsey", "bain", "bcg", "deloitte",
  ];
  if (knownBrands.some((b) => brief.company.toLowerCase().includes(b)))
    return "strong";
  if (has(text, "well-known", "market leader", "category leader", "brand name"))
    return "strong";
  if (has(text, "growing", "emerging", "building brand", "lesser-known"))
    return "weak";
  if (has(text, "startup", "early stage", "early-stage", "seed", "series a"))
    return "weak";
  return "moderate";
}

function inferAdjacentPools(text: string): string[] {
  const pools: string[] = [];
  if (has(text, "consulting", "advisory", "professional services"))
    pools.push("Management consulting firms (McKinsey, Bain, BCG, boutiques)");
  if (has(text, "coaching", "leadership development", "transformation"))
    pools.push("Leadership development and coaching firms (Korn Ferry, FranklinCovey, CCL, BTS)");
  if (has(text, "saas", "software", "tech"))
    pools.push("Adjacent SaaS companies in the same vertical");
  if (has(text, "startup", "early stage", "series"))
    pools.push("Former founders and early-stage operators");
  if (has(text, "enterprise", "b2b"))
    pools.push("Enterprise software companies with similar buyer personas");
  if (has(text, "agency"))
    pools.push("Agency operators going in-house");
  if (pools.length === 0)
    pools.push("Adjacent companies in the same market and stage");
  return pools;
}

function inferMotivators(text: string): string[] {
  const motivators: string[] = [];
  if (has(text, "equity", "options", "upside"))
    motivators.push("Equity upside and financial ownership");
  if (has(text, "ownership", "autonomy", "own"))
    motivators.push("High ownership and autonomy over outcomes");
  if (has(text, "building", "build from scratch", "0 to 1", "first hire"))
    motivators.push("Chance to build something from scratch");
  if (has(text, "scaling", "growth", "growing"))
    motivators.push("Opportunity to scale something that is already working");
  if (has(text, "mission", "impact", "purpose"))
    motivators.push("Mission-driven work with visible impact");
  if (has(text, "leadership", "team", "lead"))
    motivators.push("Ability to build and lead a team");
  if (has(text, "founder", "ceo", "executive"))
    motivators.push("Proximity to founders and executive team");
  if (motivators.length === 0) {
    motivators.push("Ownership and scope beyond their current role");
    motivators.push("Working on a meaningful problem with a strong team");
  }
  return motivators;
}

function inferObjections(text: string, brief: HiringBrief): string[] {
  const objections: string[] = [];
  const stage = inferStage(text);
  const brand = inferTalentBrand(text, brief);

  if (stage === "seed" || stage === "pre-seed")
    objections.push("Risk — company is very early, may not survive");
  if (stage === "seed" || stage === "series-a")
    objections.push("Lack of structure — no established processes or team to inherit");
  if (brand === "weak" || brand === "unknown")
    objections.push("Unknown brand — hard to evaluate from the outside");
  if (has(text, "startup", "early"))
    objections.push("Compensation may be below market (offset by equity)");
  if (has(text, "turnaround", "fix", "struggling"))
    objections.push("Turnaround risk — unclear whether problems are solvable");
  if (has(text, "remote", "distributed"))
    objections.push("Collaboration concerns in a distributed team");
  if (objections.length === 0)
    objections.push("Standard career-move risk — is this the right time and the right seat?");
  return objections;
}

function inferSeatType(text: string): SeatType {
  if (has(text, "turnaround", "fix", "struggling", "declining", "rebuild"))
    return "turnaround";
  if (has(text, "optimize", "improve", "efficiency", "mature", "refine"))
    return "optimizer";
  if (has(text, "scale", "scaling", "growth stage", "grow the", "expand"))
    return "scaler";
  // Default: building something
  return "builder";
}

function has(text: string, ...terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}
