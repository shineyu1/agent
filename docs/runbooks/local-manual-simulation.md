# Local Manual Simulation Runbook

This runbook is for the two real product flows you need to simulate locally:

1. provider onboarding
2. user installation plus one real paid call

## Current Local State

The local environment is already prepared to the point where you can rehearse the product:

- app running at `http://localhost:3000`
- PostgreSQL connected
- health check ready at `/api/health`
- payment mode switched to real mode
  - `PAYMENT_VERIFY_BYPASS=false`
  - `PAYMENT_SETTLE_ONCHAIN=true`
- supported stablecoins:
  - `USDT`
  - `USDG`

## 1. Provider Simulation

### Install Pair

```bash
npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill agent-service-layer-provider-skill
npx skills add okx/onchainos-skills
```

### What to Simulate

1. login with OKX smart wallet by email
2. let the wallet create an address automatically
3. enter the provider onboarding flow
4. provide API or OpenAPI
5. configure:
   - per-call price
   - stablecoin (`USDT` or `USDG`)
   - payout wallet
   - `hosted` or `relay`
6. create the service
7. verify in the web app that:
   - the service exists
   - the service detail page is reachable
   - the service appears in the directory if listed

### Web Entry Points

- provider onboarding:
  - `http://localhost:3000/providers/new`
- provider list:
  - `http://localhost:3000/providers`

## 2. User Simulation

### Install Pair

```bash
npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill agent-service-layer-user-skill
npx skills add okx/onchainos-skills
```

### What to Simulate

1. login with OKX smart wallet by email
2. let the wallet create an address automatically
3. install the unified user skill
4. let the agent query services
5. call one service
6. receive `HTTP 402`
7. sign the x402 payment with OKX payment capability
8. replay the request
9. receive result and receipt

### Web Entry Points

- homepage:
  - `http://localhost:3000`
- directory:
  - `http://localhost:3000/directory`
- install:
  - `http://localhost:3000/install`
- my records:
  - `http://localhost:3000/dashboard`

## 3. Web Session Bridge

Both sides should open the web with a session bridge instead of exporting wallets.

### Provider Side

After the provider flow completes, use the session bridge to open:
- `/providers/new`
- or `/providers`

### User Side

After payment or call completion, use the session bridge to open:
- `/dashboard`
- or a specific receipt page

## 4. What to Verify

### Provider Checks

- wallet login succeeded
- address created automatically
- service can be created
- service detail page opens
- directory shows the service when listed

### User Checks

- wallet login succeeded
- address created automatically
- agent can discover the service
- `402` is returned
- payment succeeds
- result is returned
- web shows records and receipts

## 5. About PAYMENT_API_PROJECT_ID

The code does not require it in every environment.

- if present, the backend sends `OK-ACCESS-PROJECT`
- if absent, you can still test first

If your OKX project explicitly requires the project header, fill it before production-like testing.
