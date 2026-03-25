# Agent Service Layer

Agent Service Layer is an x402 pay-per-use API service layer for agents.

It gives users a single skill to discover and use payable services, and gives providers a way to wrap existing APIs as agent-ready x402 services on X Layer.

## What It Does

- wraps existing APIs with an x402-compatible payable gateway
- supports provider-controlled pricing and payout wallets
- exposes a discovery directory and service detail surfaces for users
- records paid calls, receipts, transaction hashes, latency, and success rate
- supports both hosted credential mode and self-hosted relay mode

## Who It Serves

- users who want agents to discover and use pay-per-use services
- providers who want to wrap existing APIs as x402 services

Providers keep:

- their original API
- their pricing power
- their payout wallet
- their brand and distribution channels

## First Version Scope

The MVP proves one full loop:

1. a provider onboards an existing API
2. Agent Service Layer generates a payable endpoint
3. a user or agent receives a 402 quote
4. the user pays on X Layer
5. Agent Service Layer verifies payment and fulfills the request
6. the result and receipt appear in user and provider views

## Distribution Model

Each generated service can be:

- listed in the Agent Service Layer directory for discovery
- kept unlisted and distributed directly by the provider

This keeps the product positioned as infrastructure rather than a closed marketplace.

## Access Modes

### Hosted Credential Mode

The provider stores upstream API credentials with Agent Service Layer. The platform uses them to fulfill paid requests.

### Self-Hosted Relay Mode

The provider keeps upstream credentials outside Agent Service Layer and runs a relay endpoint. Agent Service Layer verifies payment and forwards the request to that relay.

## Repo Docs

- Design spec: [docs/superpowers/specs/2026-03-22-selleros-x402-design.md](docs/superpowers/specs/2026-03-22-selleros-x402-design.md)
- Backend/payment deployment: [docs/runbooks/deployment-runbook.md](docs/runbooks/deployment-runbook.md)
- Manual local simulation: [docs/runbooks/local-manual-simulation.md](docs/runbooks/local-manual-simulation.md)
- Skill architecture: [docs/product/skill-architecture.md](docs/product/skill-architecture.md)

## Backend Quickstart

1. Copy `.env.example` to `.env.local`.
2. Fill in at least:
   - `DATABASE_URL`
   - `APP_ENCRYPTION_KEY`
   - `NEXTAUTH_SECRET`
   - `OPS_API_TOKEN`
3. For real x402 traffic also fill:
   - `PAYMENT_API_BASE_URL`
   - `PAYMENT_API_KEY`
   - `PAYMENT_API_SECRET`
   - `PAYMENT_API_PASSPHRASE`
   - `PAYMENT_API_PROJECT_ID` if required by your OKX setup
   - `PAYMENT_ASSET_ADDRESS_USDT`
   - `PAYMENT_ASSET_ADDRESS_USDG`
   - `XLAYER_RPC_URL`
4. Generate Prisma client:
   - `npm run prisma:generate`
5. Ensure PostgreSQL is running and reachable at `DATABASE_URL`.
6. Push the schema:
   - `npm run prisma:push`
7. Start the app:
   - local: `npm run dev`
   - production: `npm run build && npm run start`

## Runtime Readiness

Call:

- `GET /api/health`

Expected when ready:

- HTTP `200`
- `status: "ready"`
- database, encryption, verification, and settlement checks all pass

Expected when not ready:

- HTTP `503`
- at least one runtime prerequisite is missing

## Current Deployment Notes

- supported settlement assets are `USDT` and `USDG`
- local/demo mode can still run with bypass or fallback storage, but real paid traffic should not
- real x402 verification requires working OKX payment credentials and a reachable PostgreSQL instance
