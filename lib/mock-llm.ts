import {
  HiringBrief,
  RoleClassification,
  RoleFamily,
  SourcingStrategy,
} from "./types";

type StrategyTemplate = (company: string) => SourcingStrategy;

const TEMPLATES: Record<RoleFamily, StrategyTemplate> = {
  sales: (company) => ({
    targetProfiles: [
      `Revenue builder who has closed complex, high-ticket B2B deals and can own pipeline and executive buyer conversations for ${company}`,
      "Enterprise seller or business development leader who has built revenue in ambiguous environments, selling transformation or advisory services to C-suite — speaks in outcomes, not activity",
      "Commercial operator who can carry a deal cycle from first conversation to close with senior buyers, with experience structuring pilot and proof-of-value engagements",
      "VP or Head of Sales at a smaller firm (20-100 employees) who is operating above title — owns the full sales motion and has personally closed six- and seven-figure deals",
      "Former founder or practice leader at a consulting/advisory firm who has sold directly to CEOs and founders and wants to bring that intensity to a platform with more resources",
    ],
    searchChannels: [
      "LinkedIn Recruiter targeting VP Sales, Head of Sales, Managing Director, Enterprise Sales, and Business Development titles at professional services, consulting, and advisory firms",
      "Pavilion (formerly Revenue Collective) and other GTM communities — filter for members selling services, consulting, or advisory, not just SaaS",
      "Commercial communities and revenue operator groups focused on complex B2B deal cycles and executive-level selling",
      "Industry conference speaker lists and attendee networks — people presenting on enterprise selling, transformation sales, and commercial strategy",
      "Alumni networks of consulting and advisory firms — people who understand C-suite selling and long deal cycles",
      "LinkedIn Sales Navigator — search for people posting about deal strategy, executive buyers, pipeline quality, and commercial outcomes",
    ],
    keywords: [
      "enterprise sales",
      "business development",
      "pipeline",
      "quota",
      "closing",
      "executive buyers",
      "revenue ownership",
      "deal cycle",
      "book of business",
      "commercial strategy",
    ],
    outreachAngle:
      `Lead with a commercial signal — deals closed, buyers sold to, business line built. Frame ${company} as a platform for revenue builders: emphasize ownership, pipeline, the executive buyers they'd sell to, and the deal complexity. Speak their language — "book of business," "deal cycle," "revenue ownership" — not startup jargon. Close with a direct ask about a 20 min conversation.`,
    sampleBooleanSearch:
      `("enterprise sales" OR "vp sales" OR "head of sales" OR "business development" OR "managing director" OR "commercial") AND ("pipeline" OR "quota" OR "revenue" OR "executive buyers" OR "deal cycle" OR "book of business") NOT ("growth marketing" OR "demand generation" OR "customer success" OR "software engineer" OR "recruiter" OR "talent acquisition")`,
  }),

  marketing: (company) => ({
    targetProfiles: [
      `Growth marketing leader who has owned acquisition and conversion in a B2B business and can build the demand generation engine for ${company}`,
      "Demand gen operator who has built funnels, channel strategy, and experimentation loops with measurable impact on pipeline and conversion",
      "Lifecycle and growth leader who can connect messaging, conversion, and paid/organic performance into one cohesive acquisition system",
      "VP or Head of Marketing at a smaller company (20-100 employees) who is the de facto CMO — running demand gen, content, and growth with a lean team and measurable CAC targets",
      "Performance marketing leader with a strong analytical bent who has scaled acquisition channels and run structured experimentation programs",
    ],
    searchChannels: [
      "LinkedIn Recruiter targeting growth marketing, demand gen, performance marketing, and lifecycle leaders at B2B companies",
      "Growth communities like Reforge, Demand Curve, GrowthHackers, and operator Slack groups",
      "Marketing leaders posting about acquisition, conversion, attribution, lifecycle, and experimentation on LinkedIn and Twitter/X",
      "Conference speaker lists from growth and marketing events — people presenting case studies with measurable acquisition or conversion outcomes",
      "On Deck Marketing Fellowship and Superpath community — curated networks of high-caliber marketing operators",
      "Agency leadership teams at B2B-focused growth agencies who are considering going in-house",
    ],
    keywords: [
      "growth marketing",
      "demand generation",
      "acquisition",
      "funnel",
      "conversion",
      "lifecycle marketing",
      "experimentation",
      "CAC",
      "channel strategy",
      "attribution",
    ],
    outreachAngle:
      `Lead with a growth signal they clearly own — acquisition, conversion, lifecycle, or experimentation. Frame ${company} around building a demand engine, not just running campaigns. If they're a VP/Head at a smaller firm, acknowledge they're already running the full function. Close with a low-friction ask about sharing the brief.`,
    sampleBooleanSearch:
      `("growth marketing" OR "demand generation" OR "performance marketing" OR "lifecycle marketing" OR "head of marketing" OR "VP marketing") AND ("acquisition" OR "conversion" OR "funnel" OR "experimentation" OR "CAC") NOT ("vp sales" OR "account executive" OR "enterprise seller" OR "software engineer" OR "recruiter")`,
  }),

  customer_success: (company) => ({
    targetProfiles: [
      `Customer success leader who owns retention, expansion, and onboarding outcomes in a B2B environment similar to ${company}`,
      "VP or Head of CS at a growth-stage company who has built post-sale systems, health scoring, and renewal/expansion motion from scratch",
      "CS leader with strong commercial instinct who can drive adoption, retention, and NRR without collapsing into sales or support",
      "Head of CS at a smaller company (20-100 employees) operating above title — owns the full post-sale lifecycle with a lean team and measurable retention targets",
      "Customer success operator who has expanded the function beyond retention into upsell/cross-sell, proving they can own expansion revenue",
    ],
    searchChannels: [
      "LinkedIn Recruiter targeting VP CS, Head of Customer Success, and Director of CS at B2B companies with 50-500 employees",
      "Gainsight Pulse, SuccessHACKER, and Pavilion CS communities — active participants posting about NRR, onboarding, and expansion",
      "Conference speakers and operators writing about retention, NRR, onboarding, and expansion programs",
      "LinkedIn posts about customer success strategy — people writing about customer lifecycle, health scoring, and adoption",
      "CS job boards and communities (SuccessCoaching, The Success League) where passive candidates engage with post-sale content",
      "Customer Success Festival and SaaStr CS track speaker lists — prioritize those presenting measurable retention outcomes",
    ],
    keywords: [
      "customer success",
      "nrr",
      "retention",
      "expansion",
      "onboarding",
      "adoption",
      "customer lifecycle",
      "health score",
      "post-sale",
      "renewal",
    ],
    outreachAngle:
      `Lead with the post-sale challenge — retention, NRR, onboarding complexity, or expansion opportunity. Frame ${company} around building a stronger customer lifecycle engine. If they're running CS at a smaller firm, acknowledge they're already owning the full function. Close with a low-friction ask.`,
    sampleBooleanSearch:
      `("customer success" OR "head of customer success" OR "vp customer success" OR "director of CS") AND ("nrr" OR "retention" OR "expansion" OR "onboarding" OR "adoption" OR "customer lifecycle") NOT ("account executive" OR "enterprise sales" OR "support agent" OR "call center" OR "software engineer" OR "recruiter")`,
  }),

  engineering: (company) => ({
    targetProfiles: [
      `Founding-level engineer at an early-stage startup who has shipped core product systems from scratch and wants more ownership at ${company}`,
      "Senior backend or full-stack engineer at a strong product company who wants to move closer to founders and own architecture decisions",
      "Former early engineering hire (employee #1-10) who has built under ambiguity and can operate with a lean team",
      "VP or Head of Engineering at a smaller company (10-50 engineers) who is still hands-on — building systems and leading a team simultaneously",
      "Engineer active in open source or technical communities who signals deep craft, independent thinking, and strong system design instincts",
    ],
    searchChannels: [
      "LinkedIn Recruiter targeting engineering titles at strong product companies and early-stage startups (50-500 employees)",
      "GitHub contributors with recent activity in relevant repos and libraries — look at commit recency and PR quality",
      "Engineering communities, conference speakers (StrangeLoop, QCon), and startup engineering networks",
      "Slack/Discord communities specific to the tech stack — search #jobs-wanted and #introductions channels",
      "Angel.co / Wellfound — filter by 'open to opportunities' and previous startup experience",
      "Twitter/X — engineers posting about architecture, system design, or technical decisions",
    ],
    keywords: [
      "founding engineer",
      "staff engineer",
      "backend",
      "full-stack",
      "architecture",
      "built from scratch",
      "system design",
      "technical lead",
      "infrastructure",
      "shipped",
    ],
    outreachAngle:
      `Lead with a technical detail from their work — a repo, a talk, a system they built. Connect it to what they would own at ${company}. Frame the role around technical scope, product impact, and founder proximity. Close with a low-friction ask.`,
    sampleBooleanSearch:
      `("founding engineer" OR "staff engineer" OR "senior backend engineer" OR "tech lead" OR "head of engineering") AND ("startup" OR "series a" OR "series b" OR "shipped" OR "architecture") NOT ("account executive" OR "sales" OR "marketing" OR "recruiter" OR "talent acquisition")`,
  }),

  operations: (company) => ({
    targetProfiles: [
      `Operations leader who has built workflows, systems, and execution muscle in a scaling environment like ${company}`,
      "Cross-functional operator who thrives in ambiguity and can own process, coordination, and execution quality",
      "Chief of staff or program leader who can increase throughput without needing a large support structure",
      "VP or Head of Ops at a smaller company (20-100 employees) who has built the operational backbone across multiple functions",
      "Strategy & ops leader or RevOps builder who has designed cross-functional processes and measured operational ROI",
    ],
    searchChannels: [
      "LinkedIn Recruiter targeting operations, chief of staff, program management, and business operations titles",
      "Chief of Staff Network and COO Alliance — curated communities of operational leaders",
      "Operator communities and execution-focused leadership networks (Pavilion ops track, On Deck)",
      "Ex-consulting networks (McKinsey, Bain alumni) — filter for people now in operating roles",
      "People writing about process design, cross-functional execution, and systems building on LinkedIn/Twitter",
      "Conference speaker lists from ops and strategy events in the last 12 months",
    ],
    keywords: [
      "operations",
      "workflow",
      "process",
      "execution",
      "systems",
      "cross-functional",
      "chief of staff",
      "throughput",
      "operational efficiency",
      "scaling",
    ],
    outreachAngle:
      `Lead with execution and systems ownership — what they built, improved, or scaled. Frame ${company} around increasing organizational throughput and owning operational infrastructure. Close with a direct ask.`,
    sampleBooleanSearch:
      `("operations" OR "business operations" OR "chief of staff" OR "head of ops" OR "VP operations") AND ("process" OR "workflow" OR "systems" OR "execution" OR "scaling") NOT ("account executive" OR "software engineer" OR "paid media" OR "recruiter")`,
  }),

  general: (company) => ({
    targetProfiles: [
      `Functional leader with relevant ownership experience and a track record of building in environments similar to ${company}`,
      "Operator with outcomes aligned to the hiring brief who has worked in similarly paced, high-ownership environments",
      "Leader whose experience maps to the role's core function and business stage, with evidence of measurable impact",
    ],
    searchChannels: [
      "LinkedIn Recruiter with role-specific titles and adjacent-function filters",
      "Relevant operator communities and domain-specific groups",
      "Thought leadership and practitioner ecosystems tied to the role",
    ],
    keywords: [
      "leadership",
      "ownership",
      "execution",
      "builder",
      "outcomes",
      "scaling",
    ],
    outreachAngle:
      `Lead with a specific signal from their background and frame the opportunity at ${company} around ownership, scope, and business outcomes.`,
    sampleBooleanSearch:
      `("leadership" OR "operator" OR "builder") AND ("ownership" OR "execution" OR "outcomes") NOT ("recruiter")`,
  }),
};

export async function generateMockStrategy(
  _prompt: string,
  brief: HiringBrief,
  classification: RoleClassification
): Promise<SourcingStrategy> {
  const template = TEMPLATES[classification.family];
  return template(brief.company);
}
