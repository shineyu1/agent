---
name: agent-service-layer-user-skill
description: Use when an agent needs to turn a user task, URL, curl example, or real 402/payment error into the right x402 service call, trigger payment only when a real 402 appears, and return results plus receipts.
---

# Agent Service x402 User Skill

This is the user-side orchestration skill for Agent Service x402.

It is installed for the agent, but its behavior is directly visible to the user.
So it must do two things at once:
1. give the agent a clear workflow for task routing, service matching, payment handling, and result return
2. make the user experience feel like a capable assistant instead of a menu-only bot

Its job is to:
1. accept a user task, URL, curl example, service name, or real 402/payment error
2. match the right service or next step without making the user learn the system structure first
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
- The skill is for the agent, but the user feels its behavior. Optimize for both execution clarity and user experience.
- Start from the user's task first. Do not lead with internal system menus unless the task is still unclear.
- Ask only one important question at a time.
- Extract what the user already told you before asking follow-up questions.
- Ask only for the smallest missing piece of information.
- Match the service for the user when possible; do not make the user reverse-engineer the directory.
- Do not surface payment until a real `HTTP 402` appears.
- Do not ask for wallet login unless payment is actually needed.
- Keep the web role short: showcase, receipt, records.
- Keep the skill role active: guide, decide next step, execute.
- Use short defaults and recommendations when they reduce effort.
- Speak like you are helping the user get to a result, not like a menu-only bot.

## Host Preference

If `references/onboarding.yaml` exists, the host should use it as the primary machine-readable install-to-onboarding entry point.
Use the `Opening` section only as a fallback when the onboarding file is unavailable.

## Opening

As soon as the skill is installed or loaded:

1. Run `exec` with `curl -s https://agentx402.online/api/directory` immediately to fetch the live service list.
2. Then greet the user with a short summary of what is available, followed by:

```text
Installed successfully. I loaded the live service directory.

Available services: [show name, price, one-line description for each]

Tell me what you want to get done — paste a task, URL, curl example, or 402 error.
```

Do not wait for the user to ask. Do not use web_search or browser. Fetch the directory with exec+curl on startup.

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

If the user already described the task instead of choosing a category, skip the category step and move directly to task matching.

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

If the wallet is already logged in, avoid extra login prompts and move the user forward.

## Flow C: Start a Task

If the user chooses `Call a service` or describes a task, continue with:

```text
Tell me what you want the agent to do.
```

Before asking more questions:
- extract any service name, slug, category, URL, or concrete task details the user already provided
- if the user already clearly named a service, go straight to that service instead of asking them to browse again
- if the user clearly described a task, match the best service first and only ask follow-up questions if the task is still ambiguous

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

Before asking the user to confirm payment:
- summarize the payment briefly in plain language
- avoid repeating technical fields unless they matter
- if the wallet is already logged in, say so and move straight to confirmation

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

Base URL: `https://agentx402.online`

**Always use `exec` with `curl` to call these APIs. Never use `browser` or `web_search` for API calls.**

List all services:
```bash
curl -s https://agentx402.online/api/directory
```

Get service details:
```bash
curl -s https://agentx402.online/api/services/{slug}/detail
```

Call a service:
```bash
curl -s -X POST https://agentx402.online/api/services/{slug} -H "Content-Type: application/json" -d '{...}'
```

Get receipt:
```bash
curl -s https://agentx402.online/api/receipts/{txHash}
```

When the user asks what services are available, run `curl -s https://agentx402.online/api/directory` immediately and show the results. Do not open a browser. Do not search the web. The API is public and returns JSON directly.

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
- Sound like you are helping the user get to a result quickly.
- Prefer short summaries like "I found...", "I already have...", and "You can do this next...".
- Avoid making the user repeat task details you already know.
