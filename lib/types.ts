export type RoleFamily =
  | "sales"
  | "marketing"
  | "customer_success"
  | "engineering"
  | "operations"
  | "general";

export type RolePrimitive =
  | "build-product"
  | "generate-demand"
  | "close-revenue"
  | "retain-expand"
  | "operate-deliver";

export interface RoleClassification {
  family: RoleFamily;
  primitive: RolePrimitive;
  primaryMetric: string;
  lifecycleStage: string;
}

export type CompanyArchetype =
  | "b2b-saas"
  | "info-product"
  | "professional-services"
  | "marketplace"
  | "dev-tools"
  | "healthcare-vertical"
  | "consumer-prosumer"
  | "general";

export type SeatType = "builder" | "scaler" | "optimizer" | "turnaround";

export type CompanyStage =
  | "pre-seed"
  | "seed"
  | "series-a"
  | "series-b"
  | "growth"
  | "late-stage"
  | "public"
  | "pe-backed"
  | "bootstrapped"
  | "unknown";

export interface CompanyContext {
  archetype: CompanyArchetype;
  companyType: string;
  stage: CompanyStage;
  market: string;
  buyerType: string;
  talentBrandStrength: "strong" | "moderate" | "weak" | "unknown";
  adjacentTalentPools: string[];
  candidateMotivators: string[];
  candidateObjections: string[];
  seatType: SeatType;
}

export interface HiringBrief {
  role: string;
  company: string;
  description: string;
}

// V1 flat shape — used internally by templates and validation
export interface SourcingStrategyV1 {
  targetProfiles: string[];
  searchChannels: string[];
  keywords: string[];
  outreachAngle: string;
  sampleBooleanSearch: string;
}

// V2 tiered shape — the public output
export type ProfileTier = "tier1" | "tier2" | "tier3";
export type ChannelPriority = "primary" | "secondary" | "edge";
export type FilterCategory = "must-have" | "strong-signal" | "nice-to-have" | "disqualifier";

export interface TieredProfile {
  tier: ProfileTier;
  description: string;
}

export interface PrioritizedChannel {
  priority: ChannelPriority;
  channel: string;
}

export interface CandidateFilter {
  category: FilterCategory;
  signal: string;
}

export interface SourcingStrategy {
  targetProfiles: TieredProfile[];
  searchChannels: PrioritizedChannel[];
  filters: CandidateFilter[];
  keywords: string[];
  outreachAngle: string;
  sampleBooleanSearch: string;
}

export interface StrategyValidationResult {
  strategy: SourcingStrategyV1;
  roleFamily: RoleFamily;
  warnings: string[];
}
