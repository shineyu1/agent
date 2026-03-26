# Agent Service x402 Skill Architecture

## Goal

Define the current skill split for Agent Service x402:

- which capabilities should be reused from the official OKX OnchainOS skill set
- which product workflows should live in Agent Service x402's own skills

The current architecture is intentionally simple:

- reuse OKX skills for wallet, payment, and chain actions
- build Agent Service x402 skills for provider onboarding and user-side service orchestration

## Current Skill Set

The project currently centers on two product skills:

1. `agent-service-layer-provider-skill`
2. `agent-service-layer-user-skill`

These are the canonical skill entry points for the product.

Older conceptual names such as `selleros-provider-onboarding` or `selleros-service-publish` should be treated as historical planning language, not the current implementation shape.

## What OKX Skills Already Cover Well

The official `okx/onchainos-skills` repository already covers the chain-side primitives that Agent Service x402 should reuse.

Most relevant skills:

- `okx-x402-payment`
  - signs x402 payment authorization after a real `402 Payment Required` response
  - used on the user side when a payable call actually requires payment
- `okx-agentic-wallet`
  - wallet auth, wallet access, and address lookup
- `okx-onchain-gateway`
  - gas estimation, simulation, broadcast, and transaction tracking when needed
- `okx-wallet-portfolio`
  - address-level balance and holdings lookup
- `okx-security`
  - token and transaction safety checks

These are building blocks, not the product workflow itself.

## What Agent Service x402 Must Build Itself

Agent Service x402 needs its own skill layer for the two product-facing workflows that OKX skills do not solve:

- provider onboarding and service management
- user-side task routing, service matching, and payment orchestration

That is why the project owns exactly two product skills today.

---

## 1. `agent-service-layer-provider-skill`

### Role

The provider-side orchestration skill.

### What it is for

This skill helps a provider:

- sign in as a seller with wallet-signature auth
- obtain and reuse a bearer token
- create a new provider service
- update an existing service
- complete high-risk provider actions with an additional signature

### What it should handle

- seller auth via:
  - `POST /api/auth/agent/challenge`
  - `POST /api/auth/agent/verify`
  - `GET /api/auth/session`
- provider service management via:
  - `POST /api/providers/services`
  - `GET /api/providers/services`
  - `GET /api/providers/services/{slug}`
  - `PATCH /api/providers/services/{slug}`
- provider action proof via:
  - `POST /api/providers/actions/challenge`

### Product behavior

The provider skill should:

- default to seller wallet-signature login plus bearer token
- reuse the bearer token for normal provider requests
- require a second signature for high-risk actions such as:
  - publish service
  - update price
  - update payout wallet
  - change listing state
- start onboarding immediately after install instead of stopping at “installed successfully”

### Product purpose

This skill turns:

> “I have an API”

into:

> “I have an x402-compatible service that can be managed and listed.”

---

## 2. `agent-service-layer-user-skill`

### Role

The user-side orchestration skill.

### What it is for

This skill is installed for the agent, but its behavior is directly visible to the user.

Its job is to turn a user request into the right x402 service flow.

It should accept:

- a natural-language task
- a URL
- a curl example
- a service name or slug
- a real `402` / payment error

### What it should handle

- understand the user's task first
- match the right service when possible
- fall back to browsing only when the task is still unclear
- call the payable service endpoint
- trigger wallet login and x402 payment only when a real `HTTP 402` appears
- replay the request after payment
- return the result plus receipt/records guidance

### Product behavior

The user skill should:

- behave like a capable assistant, not a menu-only bot
- avoid leading with internal system menus
- avoid asking for wallet login before payment is actually needed
- expose browsing, wallet check, and service calls as support actions, not the default opening move

### Product purpose

This skill turns:

> “I need something done”

into:

> “The agent selected the right service, handled payment when necessary, and gave me the result.”

---

## Boundary Between Product Skills and OKX Skills

The important split is:

### OKX skills handle

- wallet auth
- x402 payment signing
- chain operations
- transaction mechanics

### Agent Service x402 skills handle

- provider workflow
- service onboarding and management
- user-side task routing
- service selection
- payment orchestration at the product level
- result and receipt handoff

This is the cleanest current architecture.

## Recommended End-to-End Flow

### Provider side

1. install `agent-service-layer-provider-skill`
2. complete seller wallet-signature login
3. verify auth with bearer token
4. create or update provider service
5. publish/list with action proof when required

### User side

1. install `agent-service-layer-user-skill`
2. start from the user's task
3. match the right service
4. call the service
5. if a real `HTTP 402` appears, trigger wallet + x402 payment
6. replay the request
7. return result and receipt

## Recommendation

For the current product stage, do not re-expand the architecture into many product skills unless a real operational need appears.

The most stable shape right now is:

- one provider-side skill
- one user-side skill
- OKX skills reused underneath for wallet and payment primitives

That keeps the product understandable:

- OKX provides the rails
- Agent Service x402 provides the workflow