# Agent Service Layer Deployment Runbook

## Goal

Bring up a single-instance Agent Service Layer deployment that can:

- persist providers and services to Postgres
- verify x402 payment proofs
- optionally settle onchain through OKX Payments
- fulfill provider requests through hosted or relay mode
- report runtime readiness through `/api/health`

## 1. Required Environment

Start from [.env.example](../../.env.example) and fill these first:

### Core runtime

- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `APP_ENCRYPTION_KEY`
- `OPS_API_TOKEN`

### OKX / x402 verification

- `PAYMENT_API_BASE_URL`
- `PAYMENT_API_KEY`
- `PAYMENT_API_SECRET`
- `PAYMENT_API_PASSPHRASE`
- `PAYMENT_API_PROJECT_ID` if your OKX project uses it
- `PAYMENT_ASSET_ADDRESS_USDT`
- `PAYMENT_ASSET_DECIMALS_USDT`
- `PAYMENT_ASSET_ADDRESS_USDG`
- `PAYMENT_ASSET_DECIMALS_USDG`
- `XLAYER_CHAIN_INDEX`
- `XLAYER_RPC_URL`

### Optional settlement

- `PAYMENT_SETTLE_ONCHAIN=true`

If you only want local development or demo mode:

- set `PAYMENT_VERIFY_BYPASS=true`
- keep `PAYMENT_SETTLE_ONCHAIN=false`

Do not use bypass mode in a real paid deployment.

## 2. Database Initialization

Install dependencies and generate Prisma client:

```bash
npm install
npm run prisma:generate
```

Push the current schema:

```bash
npm run prisma:push
```

This only succeeds when PostgreSQL is already running and reachable at `DATABASE_URL`.

This must run at least once before the runtime can persist:

- services
- payment attempts
- payment events
- payment proof claims

## 3. First Boot

For local startup:

```bash
npm run dev
```

For production build:

```bash
npm run build
npm run start
```

## 4. Runtime Readiness Check

Call:

```bash
GET /api/health
```

Expected response when ready:

- HTTP `200`
- `status: "ready"`
- `checks.database.status = "pass"`
- `checks.encryption.status = "pass"`

Expected response when degraded:

- HTTP `503`
- one or more checks marked `fail`

Warnings are allowed for:

- `PAYMENT_VERIFY_BYPASS=true`
- `PAYMENT_SETTLE_ONCHAIN=false`

These are acceptable for local development, not for real paid traffic.

## 5. Minimum Launch Acceptance

Before connecting a real provider, verify all of these:

1. Create one provider service through `/providers/new` or `POST /api/providers/services`
2. Confirm it appears in `GET /api/providers/services`
3. Call `POST /api/services/[slug]` without proof and confirm a `402` quote returns
4. Call the same endpoint with a valid payment proof and confirm fulfillment succeeds
5. Replay the exact same proof and confirm the route returns `409`
6. Check `/dashboard` and the provider detail page to confirm the payment event is recorded
7. Trigger `POST /api/ops/reconcile` with the ops token and confirm the summary returns without authorization failure

## 6. Hosted vs Relay Expectations

### Hosted mode

Use when Agent Service Layer stores the upstream bearer token.

Requirements:

- upstream credential saved through onboarding
- `APP_ENCRYPTION_KEY` configured

### Relay mode

Use when the provider keeps upstream secrets outside Agent Service Layer.

Requirements:

- provider relay URL is reachable from Agent Service Layer
- relay signing secret matches on both sides
- relay validates:
  - `x-selleros-signature`
  - `x-selleros-timestamp`
  - `x-selleros-service-slug`

## 7. Known MVP Limits

This deployment is suitable for:

- single-instance runtime
- small number of real providers
- live demos and early paid pilots

Not yet implemented:

- settlement retry jobs
- payment/settlement reconciliation jobs
- credential rotation flow
- multi-instance locking beyond payment proof claim persistence

## 8. If `/api/health` Is Degraded

### Database fail

- confirm `DATABASE_URL`
- confirm Postgres is reachable from the runtime
- rerun `npm run prisma:push`

### Encryption fail

- set `APP_ENCRYPTION_KEY`
- restart the runtime

### Verification fail

- confirm `PAYMENT_API_BASE_URL`
- confirm `PAYMENT_API_KEY`
- confirm `PAYMENT_API_SECRET`
- confirm `PAYMENT_API_PASSPHRASE`
- confirm `PAYMENT_API_PROJECT_ID` if required by your OKX setup
- confirm `PAYMENT_ASSET_ADDRESS_USDT` and/or `PAYMENT_ASSET_ADDRESS_USDG`
- confirm `XLAYER_RPC_URL`

### Settlement fail

- either disable onchain settlement with `PAYMENT_SETTLE_ONCHAIN=false`
- or finish the OKX payment configuration so verification credentials are complete

## 9. Manual Reconciliation

When a paid request is recorded as `failed_delivery` because the upstream provider timed out, rate-limited, or returned a temporary `5xx`, run:

```bash
curl -X POST \
  -H "Authorization: Bearer $OPS_API_TOKEN" \
  http://localhost:3000/api/ops/reconcile
```

The response includes:

- `scanned`
- `retryableCandidates`
- `retried`
- `recovered`
- `failedAgain`
- `nonRetryable`

The reconciliation pass will only retry failures that already have:

- a recorded request body
- a successful or skipped settlement state
- a retryable upstream status such as `429`, `500`, `502`, `503`, or `504`
