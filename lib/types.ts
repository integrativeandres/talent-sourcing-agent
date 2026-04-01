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

export interface SourcingStrategy {
  targetProfiles: string[];
  searchChannels: string[];
  keywords: string[];
  outreachAngle: string;
  sampleBooleanSearch: string;
}

export interface StrategyValidationResult {
  strategy: SourcingStrategy;
  roleFamily: RoleFamily;
  warnings: string[];
}
