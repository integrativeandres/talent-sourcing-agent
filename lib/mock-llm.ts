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

const TEMPLATES: Record<RoleFamily, StrategyTemplate> = {


  sales: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Revenue builder at a ${stageLabel(ctx)} ${ctx.companyType} company in ${ctx.market} who has closed complex deals selling to ${ctx.buyerType} — someone who owns a full deal cycle, not just account management, and is motivated by ${seatLabel(ctx)}`,
      `Enterprise seller or managing director at a firm adjacent to ${company}'s market (${poolList(ctx)}) who has personally built a book of business selling high-ticket services or solutions to ${ctx.buyerType} — speaks in outcomes, not activity metrics`,
      `VP or Head of Sales at a smaller company (20-100 employees) in ${ctx.market} who is operating above title — owns the full pipeline from prospecting through close, has structured pilot and proof-of-value engagements, and is looking for a bigger platform`,
      `Commercial operator at a ${ctx.companyType} company who carries a deal cycle from first conversation to close with senior buyers, with experience navigating long sales cycles and multi-stakeholder decisions in ${ctx.market}`,
      `Former founder or practice leader who has sold directly to ${ctx.buyerType}, understands the ${ctx.market} buyer's world from the inside, and wants to bring that intensity to a ${seatLabel(ctx)} seat at ${company}`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — filter by title (VP Sales, Head of Sales, Managing Director, Enterprise Sales) at companies in ${ctx.market} and adjacent pools: ${poolList(ctx)}. Filter by company size and look for language like "built pipeline," "closed," "deal cycle," "executive buyers" in their summary`,
      `LinkedIn Sales Navigator — search for sellers in ${ctx.market} posting about deal strategy, ${ctx.buyerType.toLowerCase()} relationships, commercial outcomes, and revenue building. Engagement signals commercial instinct`,
      `Pavilion (formerly Revenue Collective) — filter for members selling into ${ctx.market} or ${ctx.buyerType.toLowerCase()} segments, not just SaaS. Look for people discussing complex deal cycles and proof-of-value selling`,
      `Industry events and conference speaker lists specific to ${ctx.market} — people presenting on selling to ${ctx.buyerType.toLowerCase()}, commercial strategy, and revenue building are pre-qualified for domain expertise`,
      `Alumni networks from ${poolList(ctx)} — people who understand selling to ${ctx.buyerType.toLowerCase()} and have transitioned from advisory to operating roles`,
      `Referral mining — ask people in ${company}'s network: "Who is the best seller you've seen close deals with ${ctx.buyerType.toLowerCase()}?"`,
    ],
    keywords: [
      "enterprise sales",
      `"sales" AND "${ctx.market.toLowerCase()}"`,
      "pipeline",
      "quota",
      "executive buyers",
      "deal cycle",
      "revenue ownership",
      "book of business",
      `"closing" AND "${ctx.buyerType.toLowerCase().split(",")[0]}"`,
      "commercial strategy",
    ],
    outreachAngle:
      `Lead with something specific from their background — a deal they closed, a market they sold into, a buyer persona they understand. Frame ${company} as a ${seatLabel(ctx)} opportunity in ${ctx.market} where they'd own the full commercial motion selling to ${ctx.buyerType.toLowerCase()}. Be direct about what motivates candidates like this: ${motivatorPhrase(ctx)}. Preempt likely concerns: ${objectionPhrase(ctx)}. Speak their language — "book of business," "deal cycle," "revenue ownership." Close with a direct ask about a 20 min conversation.`,
    sampleBooleanSearch:
      `("enterprise sales" OR "vp sales" OR "head of sales" OR "business development" OR "managing director") AND ("pipeline" OR "quota" OR "revenue" OR "executive buyers" OR "deal cycle") AND ("${ctx.market.toLowerCase().split(" ")[0]}" OR "${ctx.companyType.toLowerCase().split(" ")[0]}") NOT ("growth marketing" OR "demand generation" OR "customer success" OR "software engineer" OR "recruiter" OR "talent acquisition")`,
  }),

  marketing: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Growth marketing leader at a ${stageLabel(ctx)} ${ctx.companyType} company in ${ctx.market} who has owned acquisition and conversion selling to ${ctx.buyerType} — someone who has built a demand engine, not just run campaigns, and is motivated by ${seatLabel(ctx)}`,
      `Demand gen operator at a company with a similar buyer persona (${ctx.buyerType.toLowerCase()}) who has built funnels, channel strategy, and experimentation loops with measurable impact on pipeline and conversion`,
      `VP or Head of Marketing at a smaller company (20-100 employees) in ${ctx.market} who is the de facto CMO — running demand gen, content, and growth with a lean team, measurable CAC targets, and direct accountability to revenue`,
      `Lifecycle and growth leader who has connected messaging, conversion, and paid/organic performance into one cohesive acquisition system targeting ${ctx.buyerType.toLowerCase()} — someone from ${poolList(ctx)}`,
      `Performance marketing leader with deep experience in ${ctx.market} who has scaled acquisition channels, run structured experimentation programs, and can speak fluently about what makes ${ctx.buyerType.toLowerCase()} convert`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — filter by title (VP Marketing, Head of Growth, Director of Demand Gen) at companies in ${ctx.market} and adjacent companies selling to ${ctx.buyerType.toLowerCase()}. Look for language like "built pipeline," "acquisition," "CAC," "conversion," "experimentation" in their summary`,
      `Growth communities (Reforge, Demand Curve, GrowthHackers, Superpath) — filter for members working in ${ctx.market} or targeting similar buyer personas. Look for tactical posts about acquisition and conversion, not just thought leadership`,
      `Marketing leaders on LinkedIn/Twitter posting about acquisition, conversion, and demand gen in ${ctx.market} — people who discuss targeting ${ctx.buyerType.toLowerCase()} signal domain fit`,
      `Conference speaker lists from marketing and growth events — prioritize presenters with case studies in ${ctx.market} or similar B2B buyer segments showing measurable outcomes`,
      `On Deck Marketing and Reforge alumni — curated operators at career inflection points, filter for experience in ${ctx.companyType.toLowerCase()} companies`,
      `Agency leadership at firms serving ${ctx.market} — VPs of strategy and growth directors considering going in-house for equity and ownership`,
    ],
    keywords: [
      "growth marketing",
      "demand generation",
      "acquisition",
      "funnel",
      "conversion",
      "experimentation",
      "CAC",
      `"marketing" AND "${ctx.market.toLowerCase().split(" ")[0]}"`,
      "lifecycle marketing",
      "channel strategy",
      "attribution",
    ],
    outreachAngle:
      `Lead with a growth signal they clearly own — acquisition, conversion, lifecycle, or experimentation — ideally in ${ctx.market} or selling to ${ctx.buyerType.toLowerCase()}. Frame ${company} as a ${seatLabel(ctx)} opportunity where they'd own the demand engine end-to-end. Address what motivates them: ${motivatorPhrase(ctx)}. Preempt concerns: ${objectionPhrase(ctx)}. If they're a VP/Head at a smaller firm, acknowledge they're already running the full function and frame this as a bigger canvas. Close with a low-friction ask.`,
    sampleBooleanSearch:
      `("growth marketing" OR "demand generation" OR "performance marketing" OR "head of marketing" OR "VP marketing") AND ("acquisition" OR "conversion" OR "funnel" OR "experimentation" OR "CAC") AND ("${ctx.market.toLowerCase().split(" ")[0]}" OR "${ctx.companyType.toLowerCase().split(" ")[0]}") NOT ("vp sales" OR "account executive" OR "enterprise seller" OR "software engineer" OR "recruiter")`,
  }),

  customer_success: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Customer success leader at a ${stageLabel(ctx)} ${ctx.companyType} company in ${ctx.market} who owns retention, expansion, and onboarding for ${ctx.buyerType.toLowerCase()} — someone who has built post-sale systems, not just managed accounts, and is motivated by ${seatLabel(ctx)}`,
      `VP or Head of CS at a company with a similar buyer persona (${ctx.buyerType.toLowerCase()}) who has built health scoring, renewal playbooks, and expansion motion from scratch — understands what drives adoption in this market`,
      `Head of CS at a smaller company (20-100 employees) in ${ctx.market} operating above title — owns the full post-sale lifecycle with a lean team, measurable NRR targets, and direct accountability to revenue`,
      `CS leader from ${poolList(ctx)} with strong commercial instinct who can drive adoption, retention, and NRR without collapsing into sales — understands the ${ctx.buyerType.toLowerCase()} journey from implementation through renewal`,
      `Customer success operator who has expanded the function beyond retention into upsell/cross-sell in a market where ${ctx.buyerType.toLowerCase()} make complex buying decisions — proven track record of land-and-expand`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — filter by title (VP CS, Head of Customer Success, Director of CS) at companies in ${ctx.market} serving ${ctx.buyerType.toLowerCase()}. Look for NRR, retention metrics, and language about building CS systems in their summary`,
      `Gainsight Pulse, SuccessHACKER, and Pavilion CS communities — filter for members in ${ctx.market} or serving similar buyer personas. Active participants posting about NRR and expansion are strongest signals`,
      `Conference speakers presenting about retention, onboarding, and expansion in ${ctx.market} — prioritize those with measurable outcomes, not just frameworks`,
      `LinkedIn posts about customer success in ${ctx.companyType.toLowerCase()} companies — people writing about post-sale challenges specific to ${ctx.buyerType.toLowerCase()} signal deep domain fit`,
      `CS communities (SuccessCoaching, The Success League) — look for passive candidates engaging with content about ${ctx.market.toLowerCase()} customer lifecycle challenges`,
      `Referral mining — ask operators in ${company}'s network: "Who has built the best post-sale experience for ${ctx.buyerType.toLowerCase()}?"`,
    ],
    keywords: [
      "customer success",
      "nrr",
      "retention",
      "expansion",
      "onboarding",
      "adoption",
      "customer lifecycle",
      `"customer success" AND "${ctx.market.toLowerCase().split(" ")[0]}"`,
      "post-sale",
      "renewal",
    ],
    outreachAngle:
      `Lead with the post-sale challenge — retention, NRR, onboarding complexity, or expansion opportunity — specific to serving ${ctx.buyerType.toLowerCase()} in ${ctx.market}. Frame ${company} as a ${seatLabel(ctx)} opportunity where they'd own the full customer lifecycle. Address motivators: ${motivatorPhrase(ctx)}. Preempt concerns: ${objectionPhrase(ctx)}. If they're running CS at a smaller firm, acknowledge they already own the function. Close with a low-friction ask.`,
    sampleBooleanSearch:
      `("customer success" OR "head of customer success" OR "vp customer success" OR "director of CS") AND ("nrr" OR "retention" OR "expansion" OR "onboarding" OR "adoption") AND ("${ctx.market.toLowerCase().split(" ")[0]}" OR "${ctx.companyType.toLowerCase().split(" ")[0]}") NOT ("account executive" OR "enterprise sales" OR "support agent" OR "call center" OR "software engineer" OR "recruiter")`,
  }),

  engineering: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Founding-level engineer at a ${stageLabel(ctx)} ${ctx.companyType} company in ${ctx.market} who has shipped core product systems from scratch and is looking for more technical ownership at ${company} — motivated by ${seatLabel(ctx)}`,
      `Senior backend or full-stack engineer at a strong product company in ${ctx.market} (or adjacent: ${poolList(ctx)}) who wants to move closer to founders and own architecture decisions in a ${seatLabel(ctx)} environment`,
      `VP or Head of Engineering at a smaller company (10-50 engineers) in ${ctx.market} who is still hands-on — building systems and leading a team simultaneously, and looking for a seat with more scope at ${company}`,
      `Former early engineering hire (employee #1-10) at a ${ctx.companyType.toLowerCase()} company who has built under ambiguity, understands the technical challenges of building for ${ctx.buyerType.toLowerCase()}, and can operate with a lean team`,
      `Engineer active in open source or technical communities relevant to ${ctx.market} who signals deep craft, independent thinking, and strong system design instincts — someone who understands the domain, not just the stack`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — filter by engineering titles at companies in ${ctx.market} and adjacent pools: ${poolList(ctx)}. Look for company size 50-500, 2+ year tenure, and language about shipping, architecture, and ownership in their summary`,
      `GitHub — contributors to repos relevant to ${ctx.market}. Look at commit recency, PR quality, and whether they've built tools that solve problems in this domain`,
      `Engineering communities and conference speakers relevant to ${ctx.market} — StrangeLoop, QCon, and domain-specific events. Speakers who present on systems challenges in ${ctx.companyType.toLowerCase()} are high-signal`,
      `Slack/Discord communities specific to the tech stack and ${ctx.market} — search #jobs-wanted and #introductions for passive signals`,
      `Angel.co / Wellfound — filter by domain experience in ${ctx.market} and previous ${stageLabel(ctx)} experience`,
      `Twitter/X — engineers posting about architecture, system design, or technical decisions related to building for ${ctx.buyerType.toLowerCase()}`,
    ],
    keywords: [
      "founding engineer",
      "staff engineer",
      "backend",
      "full-stack",
      "architecture",
      "system design",
      "technical lead",
      `"engineer" AND "${ctx.market.toLowerCase().split(" ")[0]}"`,
      "shipped",
      "infrastructure",
    ],
    outreachAngle:
      `Lead with a technical detail from their work — a repo, a talk, a system they built — ideally something relevant to ${ctx.market}. Connect it to what they would own at ${company}: the technical scope, the systems challenge of building for ${ctx.buyerType.toLowerCase()}, and the ${seatLabel(ctx)} nature of the seat. Address motivators: ${motivatorPhrase(ctx)}. Preempt concerns: ${objectionPhrase(ctx)}. Frame around technical scope and product impact. Close with a low-friction ask.`,
    sampleBooleanSearch:
      `("founding engineer" OR "staff engineer" OR "senior backend engineer" OR "tech lead" OR "head of engineering") AND ("startup" OR "shipped" OR "architecture" OR "${ctx.market.toLowerCase().split(" ")[0]}") NOT ("account executive" OR "sales" OR "marketing" OR "recruiter" OR "talent acquisition")`,
  }),

  operations: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Operations leader at a ${stageLabel(ctx)} ${ctx.companyType} company in ${ctx.market} who has built workflows, systems, and execution muscle during a period of ${seatLabel(ctx)} — not just maintained existing processes`,
      `Cross-functional operator at a company serving ${ctx.buyerType.toLowerCase()} who thrives in ambiguity and can own process, coordination, and execution quality across multiple functions`,
      `VP or Head of Ops at a smaller company (20-100 employees) in ${ctx.market} who has built the operational backbone — someone operating above title and looking for scope at ${company}`,
      `Chief of staff or program leader from ${poolList(ctx)} who can increase throughput in a ${seatLabel(ctx)} environment without needing a large support structure`,
      `Strategy & ops leader who has designed cross-functional processes in ${ctx.companyType.toLowerCase()} companies and can measure operational ROI — someone who understands the operational challenges of serving ${ctx.buyerType.toLowerCase()}`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — filter by title (VP Ops, Head of Operations, COO, Chief of Staff) at companies in ${ctx.market}. Look for profiles that mention building systems, ${seatLabel(ctx)}, and cross-functional coordination`,
      `Chief of Staff Network and COO Alliance — curated communities of operational leaders, filter for experience in ${ctx.companyType.toLowerCase()} and ${ctx.market}`,
      `Ex-consulting networks (McKinsey, Bain alumni) — filter for people now in operating roles in ${ctx.market} or ${ctx.companyType.toLowerCase()} companies`,
      `Operator communities (Pavilion ops track, On Deck) — filter for members with experience in ${stageLabel(ctx)} companies in ${ctx.market}`,
      `LinkedIn/Twitter — people posting about operational scaling, process design, and systems building in ${ctx.market} or for companies serving ${ctx.buyerType.toLowerCase()}`,
      `Referral mining — ask operators: "Who has built the best operational infrastructure in ${ctx.market}?"`,
    ],
    keywords: [
      "operations",
      "workflow",
      "process",
      "execution",
      "systems",
      "cross-functional",
      "chief of staff",
      `"operations" AND "${ctx.market.toLowerCase().split(" ")[0]}"`,
      "operational efficiency",
      "scaling",
    ],
    outreachAngle:
      `Lead with the operational challenge — what needs to be built, scaled, or fixed in a ${seatLabel(ctx)} seat at ${company}. Reference the complexity of operating in ${ctx.market} and serving ${ctx.buyerType.toLowerCase()}. Address motivators: ${motivatorPhrase(ctx)}. Preempt concerns: ${objectionPhrase(ctx)}. Frame around ownership and systems impact. Close with a direct ask.`,
    sampleBooleanSearch:
      `("operations" OR "business operations" OR "chief of staff" OR "head of ops" OR "VP operations") AND ("process" OR "workflow" OR "systems" OR "execution" OR "${ctx.market.toLowerCase().split(" ")[0]}") NOT ("account executive" OR "software engineer" OR "paid media" OR "recruiter")`,
  }),

  general: ({ company, ctx, channelHints, outreachTone }) => ({
    targetProfiles: [
      `Functional leader at a ${stageLabel(ctx)} ${ctx.companyType} company in ${ctx.market} who has built their function with measurable impact and is looking for a ${seatLabel(ctx)} seat at ${company}`,
      `Operator from ${poolList(ctx)} who has worked in similarly paced, high-ownership environments serving ${ctx.buyerType.toLowerCase()}`,
      `VP or Head-level leader at a smaller company (20-100 employees) in ${ctx.market} who is operating above title and looking for scope that matches their capability`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — filter by relevant titles at companies in ${ctx.market} and adjacent pools: ${poolList(ctx)}`,
      `Industry communities and Slack groups specific to ${ctx.market}`,
      `Thought leadership ecosystems in ${ctx.market} — conference speakers and practitioners with domain expertise`,
    ],
    keywords: [
      "leadership",
      "ownership",
      "execution",
      `"${ctx.market.toLowerCase().split(" ")[0]}"`,
      "builder",
      "outcomes",
      "scaling",
    ],
    outreachAngle:
      `Lead with a specific signal from their background relevant to ${ctx.market}. Frame ${company} as a ${seatLabel(ctx)} opportunity. Address motivators: ${motivatorPhrase(ctx)}. Preempt concerns: ${objectionPhrase(ctx)}. Close with a direct ask.`,
    sampleBooleanSearch:
      `("leadership" OR "operator" OR "builder") AND ("ownership" OR "execution" OR "${ctx.market.toLowerCase().split(" ")[0]}") NOT ("recruiter")`,
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
      `Revenue or growth operator at a high-ticket info-product, coaching, or education brand who has owned funnel conversion and program enrollment — understands webinar/VSL/live-event sales motions, not just SaaS pipeline`,
      `VP or Head of Growth at a creator-led or personal-brand business (${poolList(ctx)}) who has scaled audience monetization through content, events, and high-ticket offers — speaks in enrollment rate and revenue per lead, not MQLs`,
      `Commercial leader from a direct-response or funnel-driven business who has carried revenue targets tied to event fills, program launches, and high-ticket conversion — someone who operates at pace and owns the number`,
      `Operator from an adjacent coaching or transformation company who understands the ${ctx.market} buyer — has sold programs to ${ctx.buyerType.toLowerCase()} and knows how to frame outcomes, not features`,
      `Former founder or GM of a coaching, course, or membership business who has personally built the revenue engine — funnels, content, events, team — and wants to bring that intensity to ${company}`,
    ],
    searchChannels: [
      `LinkedIn Recruiter — search for operators at known info-product, coaching, and education brands (Tony Robbins, Mindvalley, Strategic Coach, Brendon Burchard, Alex Hormozi, Dean Graziosi, Russell Brunson). Filter by revenue, growth, or commercial titles. Look for language like "funnel," "enrollment," "high-ticket," "launch," "event" in their summary`,
      `Direct-response and funnel-builder communities — ClickFunnels community, Hormozi's Acquisition.com network, funnel hacker groups, coaching business masterminds. These are where operators in this archetype actually congregate`,
      `LinkedIn Sales Navigator — search for people at coaching, education, and personal-brand companies posting about audience growth, funnel optimization, program launches, and high-ticket conversion`,
      `Podcast guest lists from coaching, education, and creator-economy podcasts — people who have discussed scaling info-product businesses, event-driven sales, or audience monetization`,
      `Event and experience company alumni — people who have scaled live/virtual events, summits, or workshop businesses understand the operational and commercial model`,
      `Referral mining — ask operators in ${company}'s network: "Who is the best revenue operator you've seen at a coaching or education brand?"`,
    ],
    keywords: [
      "high-ticket sales",
      "funnel conversion",
      "coaching business",
      "program enrollment",
      "audience monetization",
      "webinar",
      "VSL",
      "live event",
      `"${ctx.market.toLowerCase().split(" ")[0]}" AND "revenue"`,
      "direct response",
      "info product",
      "creator economy",
    ],
    outreachAngle:
      `Lead with their specific experience in the info-product or coaching world — a program they scaled, a funnel they built, an event they filled. Frame ${company} as a ${seatLabel(ctx)} opportunity where they'd own the revenue engine for a brand with real audience scale. Speak their language: "enrollment," "funnel," "high-ticket conversion," "program launch" — not SaaS jargon. Address motivators: ${motivatorPhrase(ctx)}. Preempt concerns: ${objectionPhrase(ctx)}. Close with a direct ask.`,
    sampleBooleanSearch:
      `("high-ticket" OR "coaching" OR "info product" OR "education business" OR "program launch" OR "funnel") AND ("revenue" OR "conversion" OR "enrollment" OR "audience" OR "growth") NOT ("software engineer" OR "SRE" OR "backend" OR "frontend" OR "recruiter" OR "talent acquisition")`,
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
      `"${ctx.market.toLowerCase().split(" ")[0]}" AND "health"`,
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
