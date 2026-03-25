# SellerOS for x402 Design Spec

**Date:** 2026-03-22

## Product Summary

SellerOS for x402 is a seller operating system for API providers. It turns an existing API or Web2 service into an x402-payable service on X Layer so that AI agents and developers can discover, pay for, call, and evaluate it without the provider rebuilding their backend.

The product is not a traditional API billing dashboard and not a marketplace that owns supply. It is a transaction and operations layer between service providers and buyers. Providers keep their original API, data control, pricing power, brand, and distribution channels. SellerOS provides the x402 payment wrapper, service registry, discovery surface, call logging, receipts, and objective reputation metrics.

## Problem

The main problem is not that agents cannot buy services. The main problem is that API providers are not set up to sell to agents.

Most providers already have:

- an existing REST API
- authentication and business logic
- existing docs or at least a working endpoint

Most providers do not have:

- x402-compatible pricing and payment flows
- X Layer payment verification and transaction receipts
- agent-readable service descriptions
- per-call billing rather than subscription-only pricing
- unified call logs, income reporting, and service reputation

SellerOS closes this gap with the minimum product needed to let providers commercialize existing services for the agent economy.

## Product Definition

SellerOS is a hosted seller-side gateway. A provider configures an upstream API, pricing, payout wallet, and service metadata. SellerOS then creates a payable proxy endpoint that supports x402 and X Layer settlement.

That generated endpoint can be:

- listed in the SellerOS directory for discovery
- kept unlisted and distributed directly by the provider
- embedded into the provider's own docs or site for agent access

SellerOS does not take pricing control or distribution control away from the provider.

## Target Users

### Primary User: API Provider

Best-fit provider categories for initial go-to-market:

- token and market data APIs
- scraping and summarization APIs
- onchain analysis and risk APIs
- content processing and retrieval APIs

Primary motivations:

- monetize per call instead of only by subscription
- sell to agents without rebuilding backend systems
- keep brand, pricing, wallets, and customer channels
- gain reporting and proof of paid delivery

### Secondary User: Agent Builder or Developer

Primary motivations:

- discover services that are agent-readable
- pay per use without managing many vendor accounts
- compare services by price and objective performance
- get receipts and call history for purchased services

## Why Providers Choose SellerOS

Providers choose SellerOS because they want to sell an existing service to agents without building a new payment and operations stack.

SellerOS removes the need to build:

- x402 pricing and quote handling
- X Layer payment verification
- settlement receipts and transaction tracking
- directory-compatible service metadata
- service logs, payout reporting, and performance metrics

At the same time, SellerOS preserves provider control:

- provider sets the price
- provider keeps the upstream API
- provider keeps the payout wallet
- provider keeps the brand
- provider can distribute the generated endpoint inside or outside SellerOS

The core provider promise is:

> You own the service. SellerOS makes it purchasable by agents.

## Product Principles

- Keep provider sovereignty. SellerOS should not require providers to give up pricing, brand, distribution, or API ownership.
- Keep the first version operationally simple. Real paid delivery matters more than a broad feature list.
- Optimize for agent consumption. Services must be discoverable and machine-readable, not only human-readable.
- Make paid usage visible. Objective delivery history should become the foundation of reputation.
- Support low-friction onboarding first. Advanced control can exist as an optional path.

## Core Experience

### Provider Flow

1. Create an account or connect wallet.
2. Add a service by importing OpenAPI or filling a manual form.
3. Set a fixed per-call price.
4. Configure payout wallet and optional platform fee split.
5. Choose an upstream access mode:
   - hosted credential mode
   - self-hosted relay mode
6. Publish the service as listed or unlisted.
7. Receive a payable proxy endpoint and a standard service card.
8. View usage, income, latency, success rate, and paid call history in the dashboard.

### Buyer / Agent Flow

1. Discover a service from the SellerOS directory or receive a direct endpoint from the provider.
2. Read the service card and inspect price and objective metrics.
3. Send a request to the payable endpoint.
4. Receive an HTTP 402 quote.
5. Pay on X Layer and submit proof.
6. SellerOS verifies payment.
7. SellerOS forwards the request to the upstream API or provider relay.
8. Buyer receives the result plus a receipt trail and transaction reference.

## Major Product Modules

### 1. Service Onboarding

Responsibilities:

- accept provider input via OpenAPI import or manual form
- capture service name, description, category, tags, input schema, output schema, pricing, payout wallet, and listing choice
- store mode-specific upstream configuration
- validate that the service definition is complete enough to publish

Boundaries:

- does not own the upstream API implementation
- does not enforce complex pricing models in V1

### 2. Payable Gateway

Responsibilities:

- expose a SellerOS-managed endpoint per service
- issue x402-compatible payment quotes
- validate payment before fulfillment
- route requests to the upstream API or self-hosted relay
- return upstream results to the buyer
- generate receipts, call records, and transaction references

Boundaries:

- no escrow, arbitration, or automatic refund engine in V1
- no multi-chain settlement in V1

### 3. Discovery Layer

Responsibilities:

- generate a standard service card for each service
- support listed and unlisted services
- expose an agent-readable directory API
- support search and sort by objective attributes

Required service card fields in V1:

- service name
- provider name
- description
- category and tags
- supported chain and payment method
- fixed per-call price
- input schema
- output schema
- success rate
- average latency
- recent paid call count
- endpoint reference

### 4. Seller Dashboard

Responsibilities:

- show current-day and trailing-period call counts
- show current-day and trailing-period income
- show success rate and average latency
- show recent payments, failures, and transaction hashes
- show service publication state and listing state

### 5. Reputation Layer

Responsibilities:

- surface objective trust signals derived from real paid usage

V1 metrics:

- paid-call success rate
- average latency
- recent paid call count
- recent availability based on gateway-level outcomes

Boundaries:

- no reviews, comments, or subjective ratings in V1
- no tokenized reputation protocol in V1

### 6. Access Modes

#### Hosted Credential Mode

Provider stores upstream credentials with SellerOS. SellerOS securely injects those credentials when forwarding paid requests.

Best for:

- fastest onboarding
- non-technical providers
- hackathon and early growth

Tradeoff:

- SellerOS must securely store provider credentials

#### Self-Hosted Relay Mode

Provider keeps upstream credentials outside SellerOS and runs a lightweight relay. SellerOS verifies payment, then forwards the paid request to the relay.

Best for:

- providers with stronger security requirements
- providers wanting tighter infrastructure control

Tradeoff:

- provider setup is more involved

V1 should support both modes. Hosted mode is the default low-friction path. Relay mode is the higher-control path.

## Pricing and Revenue Model

V1 pricing model is intentionally simple:

- fixed price per call
- optional free calls if the provider sets price to zero for a test service

V1 platform fee:

- default to zero to reduce onboarding friction
- keep a fee-split model in the design so platform fees can be enabled later

Planned post-V1 monetization:

- very low protocol/platform fee such as 1% or lower

Settlement model:

- payment should split directly between provider wallet and platform wallet
- SellerOS should avoid a custody-first model in V1

## Discovery Model

SellerOS must support both internal and external distribution.

Internal distribution:

- listed services appear in the SellerOS directory
- agents can query a directory API and choose services automatically

External distribution:

- providers can distribute the generated payable endpoint themselves
- unlisted services still benefit from SellerOS payment, receipts, and logs

This is important to keep SellerOS from becoming a closed marketplace.

## Security and Credential Handling

Hosted credential mode requires:

- encrypted-at-rest secret storage
- no plaintext credential reveal after save
- service-level secret isolation
- audit logs for configuration changes
- provider ability to rotate or delete credentials

Relay mode requires:

- provider-specified relay URL
- shared verification mechanism between SellerOS and relay
- replay-safe request verification for paid calls

V1 does not need a full policy engine, but it should leave room for later controls.

## Error Handling and Edge Cases

The first version must explicitly handle these states:

- invalid service configuration: service cannot publish until required fields pass validation
- upstream authentication failure: paid request is marked failed_delivery and visible in dashboard
- upstream timeout: request is marked failed_delivery with latency and timeout reason
- payment missing or invalid: request is rejected before upstream call
- duplicate payment proof or replay attempt: request is rejected and logged
- listed service hidden or disabled: directory no longer serves it, direct calls return inactive service error

Out-of-scope behavior that must still be stated:

- automatic refunds are not part of V1
- escrow or dispute resolution is not part of V1
- manual remediation for paid-but-failed calls is operational, not protocolized, in V1

## Product Boundaries

SellerOS does:

- wrap existing APIs into payable x402 services
- provide X Layer payment verification and transaction records
- provide service cards, a discovery directory, logs, and objective metrics
- let providers choose listed or unlisted distribution

SellerOS does not:

- replace the provider's API business logic
- set provider prices
- own provider customer relationships
- run a closed marketplace
- provide complex package pricing in V1
- provide multi-chain support in V1
- provide heavy risk policy execution in V1
- provide autonomous multi-service orchestration in V1

## MVP Scope

V1 must deliver the following end-to-end loop:

1. provider self-serves onboarding for one existing API
2. service definition creates a payable proxy endpoint
3. endpoint issues a 402 quote
4. buyer pays on X Layer
5. SellerOS verifies payment
6. SellerOS fulfills by calling upstream API or relay
7. SellerOS returns the result
8. dashboard and service card reflect the paid call and transaction hash

Required V1 deliverables:

- provider onboarding UI
- manual form flow
- OpenAPI import flow
- payable gateway for one-off fixed-price calls
- X Layer payment verification and transaction reference capture
- listed/unlisted service support
- agent-readable directory API
- seller dashboard with income, calls, latency, success rate, and recent transactions

## Explicitly Out of Scope for V1

- multi-chain settlement
- subscription plans and tiered pricing
- escrow and arbitration
- subjective ratings and review systems
- automated refunds
- policy execution beyond templates
- advanced recommendation algorithms
- AI auto-routing across many services
- heavy multi-tenant access control

## Demo Narrative

The best demo is a real provider onboarding a real service.

Recommended flow:

1. a token or data API provider connects to SellerOS
2. the provider configures a service and publishes it
3. SellerOS creates a service card and payable endpoint
4. an agent discovers the service from the directory
5. the agent requests the service and receives a 402 quote
6. the buyer pays on X Layer and gets a real transaction hash
7. SellerOS verifies payment, calls the upstream API, and returns the result
8. the seller dashboard shows updated income, latency, success rate, and transaction history

The demo should emphasize paid delivery, not abstract platform slides.

## Architecture Direction for Implementation Planning

Recommended V1 system shape:

- one Next.js application for provider UI, directory UI, and API routes
- one Postgres database for service definitions, credentials metadata, call logs, and payment records
- one gateway module inside the server runtime for quote generation, payment verification, fulfillment, and receipt generation

Internal logical units should remain separate even if deployed together:

- provider console
- service registry
- payment and fulfillment gateway
- directory API
- analytics and reputation aggregator

This keeps deployment simple without collapsing product boundaries.

## External Assumptions

The current design assumes:

- x402-compatible payment flows are available for use with X Layer through the chosen payment integration
- Onchain OS can be used as an optional future-facing integration surface, but V1 should not depend on Wallet or Payment MCP/Skills because the public docs position those as upcoming rather than generally available today

V1 should therefore anchor on the payment API and directory/gateway implementation, not on future MCP availability.
