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

- `skills/agent-service-layer-user-skill/references/onboarding.yaml`
- `skills/agent-service-layer-provider-skill/references/onboarding.yaml`

## YAML Fields

- `role`
  - `user` or `provider`
- `skill`
  - canonical skill name
- `product`
  - user-facing product name
- `requires_seller_session`
  - whether provider onboarding needs seller auth before create/update
- `auth_mode`
  - auth strategy for the host, for example `wallet_signature_bearer`
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
- Additional extension fields are allowed when a skill needs more machine-readable execution hints, for example:
  - `platform_base_url`
  - `platform_api_defaults`
  - `post_install_first_step`
  - `install_continuation_mode`
  - `execution_rules`

## Host Behavior

After a skill is installed successfully:

1. Check whether the installed skill directory contains `references/onboarding.yaml`.
2. If found, read it immediately.
3. If `requires_seller_session: true`, the host must establish provider auth before any create or update action.
4. If `auth_mode: wallet_signature_bearer`, prefer wallet-signature login plus bearer token for the host flow.
5. If the user asked to continue, start, onboard, configure, or set up, use `opening`.
6. If the user does not pick an action, use `default_action`.
7. Start the next turn with `default_first_question`.
8. If no onboarding file exists, fall back to the `Opening` section in `SKILL.md`.
9. If neither exists, only report installation success.

## Recommended Host Prompt Rule

Use this in the host system prompt or post-install instruction layer:

```text
After installing a skill successfully, check the installed skill directory for references/onboarding.yaml.
If the file exists and the user indicated they want to continue, start the next response from that onboarding file instead of stopping at installation success.
If the onboarding file declares requires_seller_session: true, establish provider auth before any create or update action.
If auth_mode is wallet_signature_bearer, use wallet-signature login plus bearer token instead of sending the user through a browser claim page for the main OpenClaw flow.
Use the opening field first.
Offer the next_actions as the immediate next-step menu.
If the user does not choose, continue with default_action and then ask default_first_question.
If no onboarding.yaml exists, fall back to the Opening section in SKILL.md.
```

## User-Side Fallback Prompt

If the host cannot auto-trigger onboarding, recommend or inject:

```text
Use agent-service-layer-user-skill, ask what the user wants to get done first, and only fall back to browsing available x402 services if the task is still unclear.
```

## Provider-Side Fallback Prompt

If the host cannot auto-trigger onboarding, recommend or inject:

```text
Use agent-service-layer-provider-skill, default to https://agentx402.online, sign in as a seller with a wallet signature, then start provider onboarding by connecting one API.
```
