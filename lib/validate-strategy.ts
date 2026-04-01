import { ROLE_GUARDS } from "./role-guards";
import {
  RoleFamily,
  SourcingStrategyV1,
  StrategyValidationResult,
} from "./types";

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripBannedTermsFromString(value: string, bannedTerms: string[]): string {
  let updated = value;

  for (const term of bannedTerms) {
    const pattern = new RegExp(escapeRegExp(term), "gi");
    updated = updated.replace(pattern, "");
  }

  return updated.replace(/\s{2,}/g, " ").trim();
}

function cleanStringArray(values: string[], bannedTerms: string[]): string[] {
  return values
    .map((value) => stripBannedTermsFromString(value, bannedTerms))
    .map((value) => value.replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim())
    .filter(Boolean);
}

function gatherStrategyText(strategy: SourcingStrategyV1): string {
  return [
    ...strategy.targetProfiles,
    ...strategy.searchChannels,
    ...strategy.keywords,
    strategy.outreachAngle,
    strategy.sampleBooleanSearch,
  ].join(" ");
}

function containsSignal(text: string, signal: string): boolean {
  return normalize(text).includes(normalize(signal));
}

export function validateStrategyForRoleFamily(
  roleFamily: RoleFamily,
  strategy: SourcingStrategyV1
): StrategyValidationResult {
  const config = ROLE_GUARDS[roleFamily];
  const warnings: string[] = [];

  const cleanedStrategy: SourcingStrategyV1 = {
    targetProfiles: cleanStringArray(strategy.targetProfiles, config.bannedTerms),
    searchChannels: cleanStringArray(strategy.searchChannels, config.bannedTerms),
    keywords: cleanStringArray(strategy.keywords, config.bannedTerms),
    outreachAngle: stripBannedTermsFromString(strategy.outreachAngle, config.bannedTerms),
    sampleBooleanSearch: stripBannedTermsFromString(
      strategy.sampleBooleanSearch,
      config.bannedTerms
    ),
  };

  const combinedText = gatherStrategyText(cleanedStrategy);

  for (const signal of config.requiredSignals) {
    if (!containsSignal(combinedText, signal)) {
      warnings.push(`Missing expected ${roleFamily} signal: "${signal}"`);
    }
  }

  return {
    strategy: cleanedStrategy,
    roleFamily,
    warnings,
  };
}
