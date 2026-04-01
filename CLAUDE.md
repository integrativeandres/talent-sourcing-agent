# Talent Sourcing Agent

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind
- pnpm

## Objective
Build a modular sourcing agent that:
1. Generates sourcing strategies
2. Pulls candidates from multiple sources
3. Normalizes candidate data
4. Scores candidates against role criteria
5. Stores results for recruiter review

## Architecture Principles
- Keep it modular (services, adapters, pipelines)
- Start with mock data before real integrations
- Prefer simple working loops over complex systems
- Use structured JSON for all model outputs

## Initial Scope (MVP)
- Input: role / company / hiring brief
- Output: structured sourcing strategy

## Future Phases
- Source adapters (LinkedIn, Apollo, etc.)
- Candidate enrichment
- Scoring engine
- Airtable / DB persistence
- Outreach generation

## Rules
- Do not overengineer
- Always build smallest working version first
- Keep functions testable and isolated