"use client";

import { useState } from "react";
import { SourcingStrategy, ProfileTier, ChannelPriority, FilterCategory } from "@/lib/types";

const TIER_LABELS: Record<ProfileTier, string> = {
  tier1: "Tier 1 — Start here",
  tier2: "Tier 2 — Strong alternates",
  tier3: "Tier 3 — Edge / long shot",
};

const TIER_COLORS: Record<ProfileTier, string> = {
  tier1: "border-l-emerald-500",
  tier2: "border-l-amber-500",
  tier3: "border-l-zinc-400",
};

const CHANNEL_LABELS: Record<ChannelPriority, string> = {
  primary: "Primary",
  secondary: "Secondary",
  edge: "Edge",
};

const CHANNEL_BADGES: Record<ChannelPriority, string> = {
  primary: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  secondary: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  edge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const FILTER_LABELS: Record<FilterCategory, string> = {
  "must-have": "Must-Have",
  "strong-signal": "Strong Signal",
  "nice-to-have": "Nice-to-Have",
  "disqualifier": "Disqualifier",
};

const FILTER_COLORS: Record<FilterCategory, string> = {
  "must-have": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  "strong-signal": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "nice-to-have": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  "disqualifier": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function Home() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [strategy, setStrategy] = useState<SourcingStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStrategy(null);

    try {
      const res = await fetch("/api/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const data: SourcingStrategy = await res.json();
      setStrategy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const tiers: ProfileTier[] = ["tier1", "tier2", "tier3"];
  const priorities: ChannelPriority[] = ["primary", "secondary", "edge"];
  const filterOrder: FilterCategory[] = ["must-have", "strong-signal", "nice-to-have", "disqualifier"];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
          Talent Sourcing Agent
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Hiring Brief
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, team, and what you're looking for..."
              rows={4}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Strategy"}
          </button>
        </form>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {strategy && (
          <div className="space-y-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">

            {/* Tiered Target Profiles */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                Target Profiles
              </h2>
              <div className="space-y-4">
                {tiers.map((tier) => {
                  const profiles = (strategy.targetProfiles ?? []).filter(
                    (p) => p.tier === tier
                  );
                  if (profiles.length === 0) return null;
                  return (
                    <div key={tier}>
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        {TIER_LABELS[tier]}
                      </p>
                      <ul className="space-y-1">
                        {profiles.map((p, i) => (
                          <li
                            key={i}
                            className={`border-l-2 ${TIER_COLORS[tier]} pl-3 text-sm text-zinc-800 dark:text-zinc-200`}
                          >
                            {p.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Prioritized Search Channels */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                Search Channels
              </h2>
              <div className="space-y-3">
                {priorities.map((priority) => {
                  const channels = (strategy.searchChannels ?? []).filter(
                    (c) => c.priority === priority
                  );
                  if (channels.length === 0) return null;
                  return (
                    <div key={priority}>
                      <ul className="space-y-1">
                        {channels.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                            <span className={`shrink-0 mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${CHANNEL_BADGES[priority]}`}>
                              {CHANNEL_LABELS[priority]}
                            </span>
                            <span>{c.channel}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Candidate Filters */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                Candidate Filters
              </h2>
              <div className="space-y-2">
                {filterOrder.map((category) => {
                  const filters = (strategy.filters ?? []).filter(
                    (f) => f.category === category
                  );
                  if (filters.length === 0) return null;
                  return filters.map((f, i) => (
                    <div key={`${category}-${i}`} className="flex items-start gap-2 text-sm">
                      <span className={`shrink-0 mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${FILTER_COLORS[category]}`}>
                        {FILTER_LABELS[category]}
                      </span>
                      <span className="text-zinc-800 dark:text-zinc-200">{f.signal}</span>
                    </div>
                  ));
                })}
              </div>
            </section>

            {/* Keywords */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                Keywords
              </h2>
              <div className="flex flex-wrap gap-2">
                {(strategy.keywords ?? []).map((k, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </section>

            {/* Boolean Search */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                Boolean Search
              </h2>
              <pre className="text-sm text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                {strategy.sampleBooleanSearch}
              </pre>
            </section>

            {/* Outreach Angle */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                Outreach Angle
              </h2>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                {strategy.outreachAngle}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
