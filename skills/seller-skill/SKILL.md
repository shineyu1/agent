---
name: agent-service-layer-provider-skill
description: Use when guiding service providers through connecting an existing API or OpenAPI document, signing in with a wallet, setting per-call pricing, and publishing an x402-compatible service for agents.
---

# Agent Service x402 Provider Skill

This is the provider-facing skill for Agent Service x402.

Its job is to help a service provider:
1. connect an existing API or OpenAPI document
2. sign in as a seller with a wallet signature
3. create or update services through the Agent Service x402 backend
4. require a second signature for high-risk provider actions

## Dependencies

Install this skill together with OKX's OnchainOS skills:

```bash
npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-provider-skill -y
npx skills add okx/onchainos-skills --agent openclaw --skill '*' -y
```

Key reused capability:
- `okx-agentic-wallet`
  - wallet access
  - address lookup
  - message signing

## Principles

- Do not stop at "installed successfully".
- After the skill is available, immediately offer the next provider action.
- Ask one question at a time.
- Prefer real platform actions over draft summaries when enough inputs are available.
- Treat OpenClaw as the primary execution environment.
- Do not make the user open a claim page for the main provider flow.
- For Agent Service x402, seller auth should default to wallet-signature login plus bearer token.

## Platform Defaults

When running provider onboarding for Agent Service x402, assume the platform backend already exists.

Use these defaults unless the user explicitly gives a different base URL:

- platform base URL: `https://agentx402.online`
- create seller login challenge: `POST /api/auth/agent/challenge`
- verify seller login signature: `POST /api/auth/agent/verify`
- check auth state: `GET /api/auth/session`
- create provider service: `POST /api/providers/services`
- list provider services: `GET /api/providers/services`
- read provider service: `GET /api/providers/services/{slug}`
- update provider service: `PATCH /api/providers/services/{slug}`
- create high-risk action challenge: `POST /api/providers/actions/challenge`
- check service detail: `GET /api/services/{slug}/detail`
- check install info: `GET /api/services/{slug}/install`

Do not ask the user to provide the platform's provider API endpoint, auth scheme, or request format unless the known platform endpoints are unreachable or return a non-supported response.

## Auth Model

### Normal provider flow

1. Check whether a seller bearer token already exists.
2. If no token exists, request a seller login challenge from the platform.
3. Sign the challenge message with the OKX wallet.
4. Verify the signature and store the returned bearer token.
5. Use that bearer token for normal provider actions.

### High-risk provider actions

These actions require an additional signature:
- publish service
- update price
- update payout wallet
- change visibility

For those actions:
1. request a provider action challenge
2. sign the challenge with the wallet
3. verify the signature
4. send the returned `x-seller-action-proof` header with the update

## Execution Rules

- If the user is onboarding a service for Agent Service x402, prefer the canonical backend above.
- Before creating or updating a service, check whether a seller bearer token already exists.
- If no seller token exists, start the wallet-signature login flow first.
- If the user already provided enough business fields to create a service, proceed to real creation instead of stopping at a draft summary.
- Only ask for missing service fields such as upstream URL, service name, description, price, currency, payout wallet, or delivery mode.
- Do not ask the user to design the provider backend when the Agent Service x402 backend is already available.
- Do not behave as if service creation is public or anonymous.
- Fall back to draft-only mode only when:
  - the platform base URL is unavailable
  - seller login cannot be completed
  - the provider API returns an incompatible response

## Canonical Provider Flow

Use this real flow for Agent Service x402:

1. Check seller auth state with the current bearer token if available.
2. If not authenticated, call `POST /api/auth/agent/challenge`.
3. Sign the returned message with the OKX wallet.
4. Verify with `POST /api/auth/agent/verify` and store the bearer token.
5. Collect provider inputs:
   - upstream API URL or OpenAPI URL
   - service name
   - one-line description
   - price per call
   - currency
   - payout wallet
   - hosted or relay
   - listed or unlisted
6. Create the service at `POST /api/providers/services`
7. For high-risk changes, obtain `POST /api/providers/actions/challenge`, sign, verify, then send `x-seller-action-proof`
8. After creation or update, surface:
   - created slug
   - service detail path
   - install path
   - next useful action

## Lightweight Create Payload

For hosted/manual onboarding, prefer this payload shape:

```json
{
  "providerId": "provider-slug",
  "name": "Service Name",
  "summary": "One-line service description",
  "sourceMode": "manual",
  "source": {
    "type": "manual",
    "method": "POST",
    "baseUrl": "https://api.example.com",
    "path": "/v1/endpoint"
  },
  "accessMode": "hosted",
  "access": {
    "authType": "bearer",
    "secret": "upstream-secret"
  },
  "pricing": {
    "pricePerCall": 0.01,
    "currency": "USDT"
  },
  "payoutWallet": "0x...",
  "visibility": "listed"
}
```

If the provider chooses relay mode, replace `access` with:

```json
{
  "accessMode": "relay",
  "access": {
    "relayUrl": "https://relay.example.com/fulfill",
    "signingSecret": "relay-signing-secret"
  }
}
```

## Opening

As soon as the skill is installed or loaded, start with:

```text
Installed successfully.

Next I can take you straight into provider onboarding:
1. Connect one API
2. View my services
3. Run a minimal example

Reply with:
- Connect API
- View my services
- Run an example
```

## Flow A: Connect an API

If the provider chooses `Connect API`, continue with:

```text
What are you connecting first?
- Existing API URL
- OpenAPI document URL
```

Then ask one question at a time:

```text
Send me the URL first.
```

```text
What should this service be called?
```

```text
Give me a one-line description of what this service does.
```

```text
What price do you want per call?
```

```text
Which currency should I use?
- USDT
- USDG
```

```text
What payout wallet should this service use?
```

```text
Which delivery mode should I use?
- hosted
- relay
```

```text
Should I keep this unlisted for now, or publish it after creation?
- unlisted
- listed
```

## Confirmation Before Create

Before creating, summarize:

```text
I am about to create this service with:

- Name: ...
- Description: ...
- Price: ...
- Currency: ...
- Payout wallet: ...
- Delivery mode: ...
- Visibility: ...

Create it now?
```

## Success Message

After successful creation:

```text
The service is created.

You can now:
- View service details
- Check the directory entry
- Connect another API
```

## View Existing Services

If the provider chooses `View my services`, continue with:

```text
I am loading the services tied to your seller token.

You can then:
- inspect one service
- update metadata
- prepare a publish action
```

## Minimal Example

If the provider chooses `Run an example`, continue with:

```text
I can walk through a minimal provider example:
- connect a test API
- set price and payout wallet
- create the service
- inspect its detail and install endpoints

Start now?
```

## Missing Data Handling

If payout wallet is missing:

```text
I still need the payout wallet address before I can continue.
```

If API/OpenAPI URL is missing:

```text
I still need the API or OpenAPI URL before I can continue.
```

If relay information is missing:

```text
You chose relay mode. I still need the relay URL and signing secret.
```

## Preferred APIs

```http
POST /api/auth/agent/challenge
POST /api/auth/agent/verify
GET /api/auth/session
POST /api/providers/actions/challenge
POST /api/providers/services
GET /api/providers/services
GET /api/providers/services/{slug}
PATCH /api/providers/services/{slug}
GET /api/services/{slug}/detail
GET /api/services/{slug}/install
```

## Output Style

- Always speak in provider language.
- After install, always give a 2-3 option next-step menu.
- Prefer "provider", "provider onboarding", and "connect your API".
- Treat the provider as the owner of the service.
