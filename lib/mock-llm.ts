import {
  HiringBrief,
  CompanyContext,
  RoleClassification,
  RoleFamily,
  SourcingStrategyV1,
} from "./types";
import { classifyCompany } from "./classify-company";

interface TemplateInputs {
  company: string;
  ctx: CompanyContext;
  brief: HiringBrief;
  channelHints: string[];
  outreachTone: string;
}

type StrategyTemplate = (inputs: TemplateInputs) => SourcingStrategyV1;

function seatLabel(ctx: CompanyContext): string {
  switch (ctx.seatType) {
    case "builder": return "building from scratch";
    case "scaler": return "scaling what's working";
    case "optimizer": return "optimizing and maturing";
    case "turnaround": return "fixing and rebuilding";
  }
}

function stageLabel(ctx: CompanyContext): string {
  switch (ctx.stage) {
    case "pre-seed":
    case "seed": return "early-stage";
    case "series-a": return "Series A";
    case "series-b": return "Series B";
    case "growth": return "growth-stage";
    case "late-stage": return "late-stage";
    case "public": return "public";
    case "pe-backed": return "PE-backed";
    case "bootstrapped": return "bootstrapped";
    default: return "growth-stage";
  }
}

function motivatorPhrase(ctx: CompanyContext): string {
  return ctx.candidateMotivators.slice(0, 3).join(", ");
}

function objectionPhrase(ctx: CompanyContext): string {
  return ctx.candidateObjections.slice(0, 2).join("; ");
}

function poolList(ctx: CompanyContext): string {
  return ctx.adjacentTalentPools.slice(0, 4).join(", ");
}

// Domain descriptor for boolean queries — never company name, always market/archetype signal
function domainTerms(ctx: CompanyContext): string {
  const ARCHETYPE_BOOLEAN_TERMS: Record<string, string> = {
    "b2b-saas": '"SaaS" OR "B2B" OR "enterprise software"',
    "info-product": '"coaching" OR "education" OR "info product" OR "high-ticket"',
    "professional-services": '"consulting" OR "advisory" OR "professional services"',
    "marketplace": '"marketplace" OR "platform" OR "two-sided"',
    "dev-tools": '"developer tools" OR "devtools" OR "infrastructure"',
    "healthcare-vertical": '"healthcare" OR "healthtech" OR "digital health"',
    "consumer-prosumer": '"consumer" OR "D2C" OR "B2C"',
  };
  return ARCHETYPE_BOOLEAN_TERMS[ctx.archetype] || `"B2B" OR "enterprise"`;
}

// Plain keyword terms for the keywords array — no boolean operators, no company names
function domainKeywords(ctx: CompanyContext): string[] {
  const ARCHETYPE_KW: Record<string, string[]> = {
    "b2b-saas": ["SaaS", "B2B", "enterprise software"],
    "info-product": ["coaching", "info product", "high-ticket", "education business"],
    "professional-services": ["consulting", "advisory", "professional services"],
    "marketplace": ["marketplace", "platform", "two-sided"],
    "dev-tools": ["developer tools", "devtools", "infrastructure"],
    "healthcare-vertical": ["healthcare", "healthtech", "digital health"],
    "consumer-prosumer": ["consumer", "D2C", "B2C"],
  };
  return ARCHETYPE_KW[ctx.archetype] || ["B2B", "enterprise"];
}

const TEMPLATES: Record<RoleFamily, StrategyTemplate> = {


  sales: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Deal closer at a ${stageLabel(ctx)} ${ctx.companyType} company who has sold complex, multi-stakeholder deals to ${ctx.buyerType} — owns the full cycle from prospecting through close, not just account management`,
      `Commercial leader from an adjacent market (${poolList(ctx)}) who has built a book of business selling high-ticket solutions to ${ctx.buyerType} and speaks in closed revenue, not activity`,
      `VP or Head of Sales at a smaller firm (20-100 people) in ${ctx.market}, operating above title — has structured proof-of-value engagements and is looking for a bigger platform`,
      `Former founder or practice leader who has sold directly to ${ctx.buyerType}, understands the buyer's world, and wants a ${seatLabel(ctx)} seat at ${company}`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — title filter (VP Sales, Head of Sales, Managing Director) at companies in ${ctx.market} and ${poolList(ctx)}. Look for "closed," "deal cycle," "executive buyers" in summary`,
      `Pavilion — members selling into ${ctx.market} or to ${ctx.buyerType.toLowerCase()}. Filter for complex deal cycles and proof-of-value language`,
      `${ctx.market} conference speakers and panelists — pre-qualified for domain expertise and executive network`,
      `Referral mining — "${company}'s network: who is the strongest closer you've seen sell to ${ctx.buyerType.toLowerCase()}?"`,
    ],
    keywords: [
      "enterprise deal",
      "multi-threaded sale",
      "executive sponsor",
      "book of business",
      "deal cycle",
      `"closed" AND "${ctx.buyerType.toLowerCase().split(",")[0]}"`,
      ...domainKeywords(ctx).slice(0, 1),
      "proof of value",
      "complex sale",
    ],
    outreachAngle:
      `Lead with a deal they closed or a buyer persona they understand. Frame ${company} as a ${seatLabel(ctx)} opportunity selling to ${ctx.buyerType.toLowerCase()} in ${ctx.market}. Motivators: ${motivatorPhrase(ctx)}. Preempt: ${objectionPhrase(ctx)}. Close with a direct 20-min ask.`,
    sampleBooleanSearch:
      `("vp sales" OR "head of sales" OR "enterprise sales" OR "managing director") AND ("closed" OR "deal cycle" OR "executive sponsor" OR "multi-threaded" OR "book of business") AND (${domainTerms(ctx)}) NOT ("demand generation" OR "customer success" OR "software engineer" OR "recruiter")`,
  }),

  marketing: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Demand engine builder at a ${stageLabel(ctx)} ${ctx.companyType} company who has owned acquisition and conversion for ${ctx.buyerType.toLowerCase()} — built funnels and experimentation loops, not just run campaigns`,
      `VP or Head of Marketing at a smaller firm (20-100 people) in ${ctx.market}, de facto CMO — owns demand gen, CAC, and revenue accountability with a lean team`,
      `Performance and lifecycle marketer from ${poolList(ctx)} who has scaled paid and organic channels simultaneously and can tie every program to measurable conversion`,
      `Growth operator who has connected messaging, channels, and conversion into one system targeting ${ctx.buyerType.toLowerCase()} — speaks in CAC, attribution, and experiment velocity`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — title filter (VP Marketing, Head of Growth, Director Demand Gen) at companies in ${ctx.market}. Look for "CAC," "conversion," "experimentation," "built" in summary`,
      `Growth communities (Reforge, Demand Curve, Superpath) — members working in ${ctx.market} posting tactical acquisition and conversion content`,
      `${ctx.market} conference speakers with measurable case studies — not just framework presenters`,
      `Referral mining — "Who is the best demand gen operator you've seen marketing to ${ctx.buyerType.toLowerCase()}?"`,
    ],
    keywords: [
      "demand engine",
      "CAC payback",
      "conversion rate",
      "experimentation velocity",
      "channel mix",
      ...domainKeywords(ctx).slice(0, 1),
      "attribution model",
      "paid + organic",
      "funnel optimization",
    ],
    outreachAngle:
      `Lead with a growth signal they own — a channel they scaled, an experiment they ran, a CAC number they hit. Frame ${company} as a ${seatLabel(ctx)} opportunity owning the demand engine for ${ctx.buyerType.toLowerCase()}. Motivators: ${motivatorPhrase(ctx)}. Preempt: ${objectionPhrase(ctx)}. Close with a low-friction ask.`,
    sampleBooleanSearch:
      `("head of marketing" OR "VP marketing" OR "demand generation" OR "growth marketing") AND ("CAC" OR "conversion" OR "experimentation" OR "attribution" OR "funnel") AND (${domainTerms(ctx)}) NOT ("vp sales" OR "account executive" OR "software engineer" OR "recruiter")`,
  }),

  customer_success: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `CS leader at a ${stageLabel(ctx)} ${ctx.companyType} company who has built post-sale systems (health scoring, renewal playbooks, expansion motion) for ${ctx.buyerType.toLowerCase()} — owns NRR, not just CSAT`,
      `Head of CS at a smaller firm (20-100 people) in ${ctx.market}, operating above title — owns the full post-sale lifecycle with measurable retention and expansion targets`,
      `CS operator from ${poolList(ctx)} who has expanded the function into upsell/cross-sell without collapsing into sales — proven land-and-expand in complex buying environments`,
      `Post-sale leader with domain depth in ${ctx.market} who understands the ${ctx.buyerType.toLowerCase()} journey from implementation through renewal and expansion`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — title filter (VP CS, Head of Customer Success, Director CS) at companies in ${ctx.market} serving ${ctx.buyerType.toLowerCase()}. Look for "NRR," "built," "expansion" in summary`,
      `Gainsight Pulse and Pavilion CS — active members posting about NRR, expansion, and retention in ${ctx.market}`,
      `${ctx.market} conference speakers with measurable post-sale outcomes — not just CS framework presenters`,
      `Referral mining — "Who has built the best post-sale experience for ${ctx.buyerType.toLowerCase()}?"`,
    ],
    keywords: [
      "net revenue retention",
      "expansion revenue",
      "health score",
      "renewal playbook",
      "land and expand",
      ...domainKeywords(ctx).slice(0, 1),
      "post-sale",
      "onboarding",
      "adoption",
    ],
    outreachAngle:
      `Lead with the post-sale challenge: NRR, onboarding complexity, or expansion opportunity for ${ctx.buyerType.toLowerCase()} in ${ctx.market}. Frame ${company} as a ${seatLabel(ctx)} seat owning the full customer lifecycle. Motivators: ${motivatorPhrase(ctx)}. Preempt: ${objectionPhrase(ctx)}. Close with a low-friction ask.`,
    sampleBooleanSearch:
      `("head of customer success" OR "vp customer success" OR "director CS") AND ("NRR" OR "retention" OR "expansion" OR "onboarding" OR "health score") AND (${domainTerms(ctx)}) NOT ("account executive" OR "support agent" OR "call center" OR "software engineer" OR "recruiter")`,
  }),

  engineering: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Founding-level engineer who has shipped core systems from scratch at a ${stageLabel(ctx)} ${ctx.companyType} company — owns architecture decisions, not just feature tickets`,
      `Senior engineer at a strong product company in ${ctx.market} (or ${poolList(ctx)}) who wants to move closer to founders and own technical direction in a ${seatLabel(ctx)} environment`,
      `VP or Head of Engineering at a smaller company (10-50 engineers) in ${ctx.market}, still hands-on — builds systems and leads a team simultaneously`,
      `OSS contributor or technical community leader relevant to ${ctx.market} who signals deep craft, system design instincts, and domain understanding beyond the stack`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — engineering titles at companies in ${ctx.market} and ${poolList(ctx)}. Company size 50-500, 2+ year tenure, look for "shipped," "architecture," "built" in summary`,
      `GitHub — contributors to repos relevant to ${ctx.market}. Commit recency and PR quality over star count`,
      `Engineering conference speakers (StrangeLoop, QCon, domain-specific) who present on systems challenges in ${ctx.companyType.toLowerCase()}`,
      `Referral mining — "Who is the strongest engineer you've worked with who has built for ${ctx.buyerType.toLowerCase()}?"`,
    ],
    keywords: [
      "founding engineer",
      "staff engineer",
      "system design",
      "shipped to production",
      "technical architecture",
      ...domainKeywords(ctx).slice(0, 1),
      "built from scratch",
      "owned the stack",
      "full-stack",
    ],
    outreachAngle:
      `Lead with a technical detail from their work — a system they built, a repo, an architecture decision. Connect it to what they'd own at ${company}: the systems challenge of building for ${ctx.buyerType.toLowerCase()} in a ${seatLabel(ctx)} seat. Motivators: ${motivatorPhrase(ctx)}. Preempt: ${objectionPhrase(ctx)}. Close with a low-friction ask.`,
    sampleBooleanSearch:
      `("founding engineer" OR "staff engineer" OR "tech lead" OR "head of engineering") AND ("shipped" OR "architecture" OR "system design" OR "built from scratch") AND (${domainTerms(ctx)}) NOT ("account executive" OR "marketing" OR "recruiter" OR "talent acquisition")`,
  }),

  operations: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Ops builder at a ${stageLabel(ctx)} ${ctx.companyType} company who has designed cross-functional workflows and execution infrastructure during a period of ${seatLabel(ctx)} — not just maintained processes`,
      `VP or Head of Ops at a smaller firm (20-100 people) in ${ctx.market}, operating above title — built the operational backbone and looking for scope at ${company}`,
      `Chief of staff or program leader from ${poolList(ctx)} who increases throughput without adding headcount — thrives in ambiguity and owns coordination across functions`,
      `Ex-consultant (McKinsey, Bain, boutique) now in an operating role in ${ctx.market} who can design processes and measure operational ROI`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — title filter (VP Ops, Head of Operations, COO, Chief of Staff) at companies in ${ctx.market}. Look for "built," "designed," "cross-functional" in summary`,
      `Chief of Staff Network and COO Alliance — curated operators, filter for ${ctx.companyType.toLowerCase()} and ${ctx.market} experience`,
      `Pavilion ops track and On Deck — members at ${stageLabel(ctx)} companies in ${ctx.market}`,
      `Referral mining — "Who has built the best operational infrastructure in ${ctx.market}?"`,
    ],
    keywords: [
      "operational infrastructure",
      "cross-functional coordination",
      "process design",
      "chief of staff",
      ...domainKeywords(ctx).slice(0, 1),
      "throughput",
      "org design",
      "built from scratch",
    ],
    outreachAngle:
      `Lead with the operational challenge: what needs to be built or fixed in a ${seatLabel(ctx)} seat at ${company}. Reference ${ctx.market} complexity and serving ${ctx.buyerType.toLowerCase()}. Motivators: ${motivatorPhrase(ctx)}. Preempt: ${objectionPhrase(ctx)}. Close with a direct ask.`,
    sampleBooleanSearch:
      `("head of ops" OR "VP operations" OR "chief of staff" OR "COO") AND ("process design" OR "cross-functional" OR "operational infrastructure" OR "throughput") AND (${domainTerms(ctx)}) NOT ("account executive" OR "software engineer" OR "recruiter")`,
  }),

  general: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Functional builder at a ${stageLabel(ctx)} ${ctx.companyType} company in ${ctx.market} with measurable impact — looking for a ${seatLabel(ctx)} seat at ${company}`,
      `Operator from ${poolList(ctx)} who has worked in high-ownership environments serving ${ctx.buyerType.toLowerCase()}`,
      `VP or Head-level leader at a smaller firm in ${ctx.market}, operating above title and looking for matching scope`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — relevant titles at companies in ${ctx.market} and ${poolList(ctx)}`,
      `${ctx.market} communities and practitioner networks`,
      `Referral mining — "Who is the strongest operator you've seen in ${ctx.market}?"`,
    ],
    keywords: [
      ...domainKeywords(ctx).slice(0, 1),
      "built from scratch",
      "owned the function",
      "measurable impact",
    ],
    outreachAngle:
      `Lead with a specific signal from their background in ${ctx.market}. Frame ${company} as a ${seatLabel(ctx)} opportunity. Motivators: ${motivatorPhrase(ctx)}. Preempt: ${objectionPhrase(ctx)}. Close with a direct ask.`,
    sampleBooleanSearch:
      `("head of" OR "VP" OR "director") AND ("built" OR "owned") AND (${domainTerms(ctx)}) NOT ("recruiter")`,
  }),
};

// ---------------------------------------------------------------------------
// Archetype-specific overrides — patch the role-family template output
// to make it native to the business model. Only override fields where
// the archetype produces meaningfully different output.
// ---------------------------------------------------------------------------

type ArchetypeOverride = (
  base: SourcingStrategyV1,
  company: string,
  ctx: CompanyContext
) => Partial<SourcingStrategyV1>;

const ARCHETYPE_OVERRIDES: Partial<Record<CompanyContext["archetype"], ArchetypeOverride>> = {

  "info-product": (base, company, ctx) => ({
    targetProfiles: [
      `Revenue operator at a high-ticket coaching, education, or info-product brand who has owned funnel conversion and program enrollment — understands webinar/VSL/live-event motions, not SaaS pipeline`,
      `Head of Growth at a creator-led or personal-brand business (${poolList(ctx)}) who has scaled audience monetization through events and high-ticket offers — speaks in enrollment rate, not MQLs`,
      `Direct-response commercial leader who has carried revenue targets tied to event fills, program launches, and offer conversion — operates at pace and owns the number`,
      `Former founder or GM of a coaching, course, or membership business who personally built the revenue engine and wants to bring that intensity to ${company}`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — operators at known info-product brands (Tony Robbins, Mindvalley, Strategic Coach, Hormozi, Dean Graziosi, Russell Brunson). Look for "funnel," "enrollment," "high-ticket," "launch" in summary`,
      `Direct-response communities — ClickFunnels community, Acquisition.com network, funnel hacker groups, coaching business masterminds`,
      `Coaching and creator-economy podcast guests — people who have discussed scaling info-product businesses or event-driven revenue`,
      `Referral mining — "Who is the best revenue operator you've seen at a coaching or education brand?"`,
    ],
    keywords: [
      "high-ticket offer",
      "funnel conversion",
      "program enrollment",
      "VSL",
      "webinar funnel",
      "live event revenue",
      "offer conversion rate",
      "direct response",
      `"coaching" AND "revenue"`,
    ],
    outreachAngle:
      `Lead with their info-product experience — a program they scaled, a funnel they built, an event they filled. Frame ${company} as a ${seatLabel(ctx)} opportunity owning the revenue engine for a brand with real audience scale. Speak their language: "enrollment," "funnel," "offer conversion," "launch" — not SaaS jargon. Motivators: ${motivatorPhrase(ctx)}. Preempt: ${objectionPhrase(ctx)}. Direct ask.`,
    sampleBooleanSearch:
      `("high-ticket" OR "coaching" OR "info product" OR "program launch" OR "VSL" OR "webinar") AND ("funnel" OR "conversion" OR "enrollment" OR "direct response") NOT ("software engineer" OR "SRE" OR "backend" OR "frontend" OR "recruiter")`,
  }),

  "healthcare-vertical": (base, company, ctx) => ({
    targetProfiles: [
      `${base.targetProfiles[0]} — with demonstrated familiarity with healthcare regulations (HIPAA, clinical workflows, or EHR integration)`,
      `Operator from a healthtech or digital health company (${poolList(ctx)}) who has navigated the unique sales cycles, regulatory requirements, and stakeholder complexity of healthcare — understands that this market moves differently than horizontal SaaS`,
      ...base.targetProfiles.slice(2).map((p) =>
        p.includes("healthcare") ? p : `${p} — ideally with exposure to healthcare, clinical, or life sciences environments`
      ),
    ],
    keywords: [
      ...base.keywords.filter((k) => !k.includes("undefined")),
      "healthcare",
      "healthtech",
      "digital health",
      "HIPAA",
      "clinical",
      "clinical workflows",
    ].slice(0, 12),
    sampleBooleanSearch:
      `${base.sampleBooleanSearch.replace(/ NOT /, ` AND ("healthcare" OR "healthtech" OR "digital health" OR "clinical" OR "HIPAA") NOT `)}`,
  }),

  "professional-services": (base, company, ctx) => ({
    outreachAngle:
      `${base.outreachAngle} Speak to the professional services context: utilization, client relationships, practice building, and engagement-based delivery. Candidates from this world value intellectual challenge, client impact, and path to partnership or equity.`,
    keywords: [
      ...base.keywords.filter((k) => !k.includes("undefined")),
      "consulting",
      "advisory",
      "professional services",
      "practice",
      "client engagement",
    ].slice(0, 12),
  }),

  "dev-tools": (base, company, ctx) => ({
    outreachAngle:
      `${base.outreachAngle} Dev-tools context: candidates in this space value developer experience, community, and craft. Frame around the technical problem, the developer audience, and any open-source or community angle.`,
    keywords: [
      ...base.keywords.filter((k) => !k.includes("undefined")),
      "developer tools",
      "devtools",
      "developer experience",
      "open source",
      "API",
    ].slice(0, 12),
  }),
};

export async function generateMockStrategy(
  _prompt: string,
  brief: HiringBrief,
  classification: RoleClassification,
  companyCtx: CompanyContext
): Promise<SourcingStrategyV1> {
  const archetypeResult = classifyCompany(brief);
  const template = TEMPLATES[classification.family];

  const raw = template({
    company: brief.company,
    ctx: companyCtx,
    brief,
    channelHints: archetypeResult.channelHints,
    outreachTone: archetypeResult.outreachTone,
  });

  // Apply archetype-specific overrides if available
  const override = ARCHETYPE_OVERRIDES[companyCtx.archetype];
  const patched = override
    ? { ...raw, ...override(raw, brief.company, companyCtx) }
    : raw;

  // Enrich with archetype-specific channel hints (append, don't replace)
  const enrichedChannels = [...patched.searchChannels];
  for (const hint of archetypeResult.channelHints) {
    if (!enrichedChannels.some((ch) => ch.includes(hint.slice(0, 40)))) {
      enrichedChannels.push(`[${companyCtx.companyType}] ${hint}`);
    }
  }

  return {
    ...patched,
    searchChannels: enrichedChannels.slice(0, 8),
  };
}
