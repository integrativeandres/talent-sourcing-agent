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
