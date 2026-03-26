# Skill Onboarding Contract

This document defines the install-to-onboarding contract for Agent Service x402 skills.

## Goal

After a skill is installed, the host agent should have a stable, machine-readable entry point for the next step.

The host should not need to parse the natural-language `Opening` section in `SKILL.md` to decide what to do next.

## File Convention

Each skill may provide:

```text
references/onboarding.yaml
```

Current files:

- `skills/buyer-skill/references/onboarding.yaml`
- `skills/seller-skill/references/onboarding.yaml`

## YAML Fields

- `role`
  - `user` or `provider`
- `skill`
  - canonical skill name
- `product`
  - user-facing product name
- `requires_seller_session`
  - whether the host must establish seller identity before continuing
- `opening`
  - first message to show after install when the user wants to continue
- `next_actions`
  - short suggested replies or buttons
- `default_action`
  - recommended first action if the user does not choose
- `default_first_question`
  - first question to continue the onboarding flow
- `fallback_prompt`
  - prompt the host can inject or recommend if no automatic onboarding trigger exists

## Host Behavior

After a skill is installed successfully:

1. Check whether the installed skill directory contains `references/onboarding.yaml`.
2. If found, read it immediately.
3. If `requires_seller_session: true`, the host must check seller identity state before any create or update action.
4. If the user asked to continue, start, onboard, configure, or set up, use `opening`.
5. If the user does not pick an action, use `default_action`.
6. Start the next turn with `default_first_question`.
7. If no onboarding file exists, fall back to the `Opening` section in `SKILL.md`.
8. If neither exists, only report installation success.

## Recommended Host Prompt Rule

Use this in the host system prompt or post-install instruction layer:

```text
After installing a skill successfully, check the installed skill directory for references/onboarding.yaml.
If the file exists and the user indicated they want to continue, start the next response from that onboarding file instead of stopping at installation success.
If the onboarding file declares `requires_seller_session: true`, verify seller identity first and do not create or update services until that identity is established.
Use the `opening` field first.
Offer the `next_actions` as the immediate next-step menu.
If the user does not choose, continue with `default_action` and then ask `default_first_question`.
If no onboarding.yaml exists, fall back to the Opening section in SKILL.md.
```

## User-Side Fallback Prompt

If the host cannot auto-trigger onboarding, recommend or inject:

```text
使用 agent-service-layer-user-skill，带我开始使用 x402 服务。先从浏览服务开始。
```

## Provider-Side Fallback Prompt

If the host cannot auto-trigger onboarding, recommend or inject:

```text
使用 agent-service-layer-provider-skill，先检查 seller 登录状态；如果还没登录，先完成服务商身份绑定。然后带我开始服务商接入，从接入一个 API 开始。
```
