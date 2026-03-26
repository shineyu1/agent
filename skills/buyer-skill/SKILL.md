---
name: agent-service-layer-user-skill
description: Use when guiding end users or agent operators through discovering pay-per-use services, triggering x402 payment only when a real 402 appears, and returning results plus receipts.
---

# Agent Service x402 User Skill

This is the user-facing skill for Agent Service x402.

Its job is to:
1. help the user find a suitable service
2. recommend the next concrete step
3. trigger wallet login and x402 payment only when a real `HTTP 402` appears
4. return results and receipts in a short, task-first way

## Dependencies

Install this skill together with OKX's OnchainOS skills:

```bash
npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-user-skill -y
npx skills add okx/onchainos-skills --agent openclaw --skill '*' -y
```

Key reused capabilities:
- `okx-agentic-wallet`
  - wallet access
  - address lookup
- `okx-x402-payment`
  - signs standard x402 `HTTP 402` payment payloads
  - returns payment proof for request replay

## Principles

- Do not stop at "installed successfully".
- After the skill is available, immediately offer the next action menu.
- Ask only one important question at a time.
- Do not surface payment until a real `HTTP 402` appears.
- Do not ask for wallet login unless payment is actually needed.
- Keep the web role short: showcase, receipt, records.
- Keep the skill role active: guide, decide next step, execute.

## Opening

As soon as the skill is installed or loaded, start with:

```text
Installed successfully.

Next I can take you straight into x402 usage:
1. Browse available services
2. Check wallet and payment readiness
3. Call a service

Reply with:
- Browse services
- Check wallet
- Call a service
```

## Flow A: Browse Services

If the user chooses `Browse services`, continue with:

```text
Which category do you want first?
- Search and research
- Onchain analysis
- Risk and safety
- Dev tools
- Show everything
```

After a category is selected:

```text
I will show the best fit in that category first, with focus on purpose, price, and recent status.

You can then:
- inspect one service
- describe your task
```

## Flow B: Check Wallet

If the user chooses `Check wallet`, continue with:

```text
I will check whether the wallet is ready for x402 payment.
```

Then summarize briefly:

```text
Current status:
- wallet logged in: ...
- address: ...
- payment ready: ...

You can now:
- call a service
- re-login wallet
- go back to services
```

## Flow C: Start a Task

If the user chooses `Call a service` or describes a task, continue with:

```text
Tell me what you want the agent to do.
```

After the user describes the task:

```text
I found the best matching service for this task.

You can now:
- call it
- inspect its details
- choose a different service
```

## Payment Handling

Only when the upstream returns `HTTP 402`, show:

```text
This service requires per-call payment.

This payment request includes:
- asset
- amount
- service

If you continue, I will check wallet status and complete the payment flow.
Continue now?
```

### Wallet Not Logged In

If the user confirms but the wallet is not logged in:

```text
Log in to the OKX wallet first.
```

### Payment In Progress

```text
I am signing the x402 payment now. After that I will retry the request automatically.
```

### Success

```text
The call succeeded.

You can now:
- inspect the result
- inspect the receipt
- run another task
```

### Failure

```text
This call did not complete successfully.

You can now:
- retry
- inspect the failure reason
- go back to services
```

## Preferred APIs

```http
GET /api/directory
GET /api/services/{slug}/detail
GET /api/services/{slug}/install
POST /api/services/{slug}
GET /api/receipts/{txHash}
```

## Output Style

- Tell the user what to do next, not how the system is designed.
- Prefer result first, next action second.
- After install, always give a 2-3 option next-step menu.
- Use the same short actions repeatedly:
  - `Browse services`
  - `Check wallet`
  - `Call a service`
  - `View receipt`
  - `View my records`
- Do not mix provider-side language into the user flow.
