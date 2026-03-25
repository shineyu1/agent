# SellerOS Skill Architecture

## Goal

Define which skills SellerOS should build itself and which skills should be reused from the official OKX OnchainOS skill set.

The guiding rule is simple:

- reuse OKX skills for chain operations, wallet actions, x402 signing, and transaction handling
- build SellerOS skills for provider onboarding, service packaging, distribution, and seller operations

## What OKX Already Covers Well

The official `okx/onchainos-skills` repository already covers the buyer-side and chain-side primitives that SellerOS can reuse.

Most relevant skills:

- `okx-x402-payment`
  - signs x402 payment authorization after a `402 Payment Required` response
  - suitable for buyer or agent-side payment execution
- `okx-onchain-gateway`
  - gas estimation, simulation, broadcast, and order tracking
  - suitable for transaction confirmation and hash tracking
- `okx-agentic-wallet`
  - wallet auth and wallet-side actions
- `okx-wallet-portfolio`
  - address-level balance and holdings lookup
- `okx-security`
  - token and transaction safety checks

These skills are useful building blocks, but they do not solve the provider-side workflow that makes SellerOS different.

## What SellerOS Must Build Itself

SellerOS needs a dedicated skill layer for the seller journey.

The missing half is:

- turning an upstream API into a SellerOS service
- configuring price, wallet, schemas, and listing state
- choosing hosted credential mode or self-hosted relay mode
- generating and distributing a payable endpoint
- operating the service after launch

## Recommended Skill Set

SellerOS should start with 5 skills.

### 1. `selleros-provider-onboarding`

Purpose:

- guide a provider through creating a new service in SellerOS

Should trigger when:

- a provider wants to onboard an existing API
- a provider wants help choosing manual mode vs OpenAPI import
- a provider needs help configuring price, schema, wallet, or visibility

Responsibilities:

- choose onboarding mode
- collect required service metadata
- validate required fields before publish
- explain listed vs unlisted distribution
- prepare the service definition for SellerOS

Why this matters:

- this is the skill that turns “I have an API” into “I have a service listing”

### 2. `selleros-service-publish`

Purpose:

- take a drafted service and turn it into a published payable service

Should trigger when:

- a provider wants to publish a new service
- a provider wants to update price, listing state, or endpoint status
- a provider wants to generate or regenerate the payable endpoint

Responsibilities:

- publish listed or unlisted services
- generate the payable endpoint
- generate the service card
- verify the endpoint is reachable
- surface the distribution options

Why this matters:

- separates onboarding from go-live operations

### 3. `selleros-relay-setup`

Purpose:

- help a provider set up self-hosted relay mode with the lowest possible friction

Should trigger when:

- a provider does not want to store upstream secrets in SellerOS
- a provider wants higher security or infrastructure control
- a provider needs help configuring a relay using OpenClaw or a simple guided flow

Responsibilities:

- explain hosted mode vs relay mode tradeoffs
- scaffold relay configuration
- collect relay URL and signing secret
- verify request signing and replay protection
- provide a fallback path to hosted credentials when setup is too complex

Why this matters:

- this is your biggest control and security differentiator

### 4. `selleros-service-debugging`

Purpose:

- troubleshoot paid request failures across the full SellerOS flow

Should trigger when:

- a service returns 402 repeatedly
- payment succeeds but the API result is missing
- upstream auth fails
- relay forwarding fails
- paid calls are not appearing in the dashboard

Responsibilities:

- check service configuration
- inspect payment verification state
- inspect upstream fulfillment state
- inspect relay verification state
- map failure to a clear remediation step

Why this matters:

- once real providers use the product, operational debugging becomes a core workflow

### 5. `selleros-growth-distribution`

Purpose:

- help providers use both platform-native and external distribution paths

Should trigger when:

- a provider wants to get discovered in the SellerOS directory
- a provider wants to share the payable endpoint externally
- a provider wants to position the service for agent consumption

Responsibilities:

- explain listed vs unlisted strategy
- improve service card title, description, category, and tags
- prepare external sharing copy
- optimize for machine readability and agent selection

Why this matters:

- SellerOS is not only a gateway; it is also a discovery layer

## Phase-Based Rollout

Do not build all 5 at once.

### Phase 1: Required for MVP

- `selleros-provider-onboarding`
- `selleros-relay-setup`

These two are enough to support the provider integration story.

### Phase 2: Required for Product Readiness

- `selleros-service-publish`
- `selleros-service-debugging`

These make the system operational instead of demo-only.

### Phase 3: Required for Growth

- `selleros-growth-distribution`

This matters once providers start caring about demand and discoverability.

## How SellerOS Skills Should Work with OKX Skills

SellerOS skills should orchestrate product-level workflows and hand off chain-specific steps to the official OKX skills.

Recommended pairing:

- `selleros-service-debugging` + `okx-x402-payment`
  - for debugging payment-gated access
- `selleros-service-debugging` + `okx-onchain-gateway`
  - for transaction broadcast and tracking issues
- `selleros-growth-distribution` + `okx-dex-market`
  - if a provider wants to enrich token-data service copy with market context
- `selleros-relay-setup` + `okx-agentic-wallet`
  - if relay setup includes wallet-driven auth or account checks

The important boundary is:

- OKX skills handle wallet, payment, and chain mechanics
- SellerOS skills handle provider workflow and product operations

## Suggested Trigger Order

For a new provider:

1. `selleros-provider-onboarding`
2. `selleros-relay-setup` if the provider chooses self-hosted mode
3. `selleros-service-publish`

For an already-published provider:

1. `selleros-service-debugging` if something is broken
2. `selleros-growth-distribution` if the service works and needs more usage

## Recommendation

If the team has limited time, do not try to write every skill immediately.

The best first move is:

1. adopt the official OKX skill repo for payment and chain primitives
2. build `selleros-provider-onboarding`
3. build `selleros-relay-setup`

That gives SellerOS a clear identity:

- OKX handles the chain rails
- SellerOS handles the seller workflow

That is the right split for both the hackathon and the product after the hackathon.
