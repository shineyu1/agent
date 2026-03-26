---
name: agent-service-layer-provider-skill
description: Use when guiding service providers through connecting an existing API or OpenAPI document, setting per-call pricing, and publishing an x402-compatible service for agents.
---

# Agent Service Layer Provider Skill

This is the provider-facing skill for Agent Service x402.

Its job is to help a service provider:
1. connect an existing API or OpenAPI document
2. set per-call pricing and payout wallet
3. choose hosted or relay delivery
4. create an x402-compatible service that agents can use

## Dependencies

Install this skill together with OKX's OnchainOS skills:

```bash
npx skills add shineyu1/agent --skill agent-service-layer-provider-skill
npx skills add okx/onchainos-skills
```

Key reused capability:
- `okx-agentic-wallet`
  - email login
  - wallet creation
  - address lookup

Provider setup reuses OKX wallet identity. The main x402 payment signing flow happens on the user side, not in the provider-side onboarding flow.

## Principles

- Use `服务商`, never `商家`.
- Do not stop at "installed successfully".
- After the skill is available, immediately offer the next provider action.
- Connect the API first, explain less.
- Ask one question at a time.
- Assume the provider wants to keep API ownership, pricing power, and distribution control.
- Confirm once before creation.
- After creation, immediately offer the next useful action.

## Platform Defaults

When running provider onboarding for Agent Service x402, assume the platform backend already exists.

Use these defaults unless the user explicitly gives a different base URL:

- platform base URL: `https://agentx402.online`
- create seller bridge session: `POST /api/auth/bridge/start`
- claim seller session: `POST /api/auth/bridge/claim`
- create provider service: `POST /api/providers/services`
- list provider services: `GET /api/providers/services`
- check service detail: `GET /api/services/{slug}/detail`
- check install info: `GET /api/services/{slug}/install`

Do not ask the user to provide the platform's provider API endpoint, auth scheme, or request format unless the known platform endpoints are unreachable or return a non-supported response.

## Execution Rules

- If the user is onboarding a service for Agent Service x402, prefer the canonical backend above.
- If the user already provided enough business fields to create a service, proceed to real creation instead of stopping at a draft summary.
- Only ask for missing service fields such as upstream URL, service name, description, price, currency, payout wallet, or delivery mode.
- Do not ask the user to design the provider backend when the Agent Service x402 backend is already available.
- Fall back to "draft only" mode only when:
  - the platform base URL is unavailable
  - the bridge session cannot be created
  - the provider API returns an incompatible response

## Canonical Provider Creation Flow

Use this real flow for Agent Service x402:

1. Collect provider inputs:
   - upstream API URL or OpenAPI URL
   - service name
   - one-line description
   - price per call
   - currency
   - payout wallet
   - hosted or relay
   - listed or unlisted
2. Create a seller bridge session at `POST /api/auth/bridge/start`
3. Claim the bridge token at `POST /api/auth/bridge/claim`
4. Reuse the returned seller session cookie
5. Create the service at `POST /api/providers/services`
6. After creation, surface:
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
已安装完成。

下一步我可以直接帮你做服务商接入，建议先从 1 开始：
1. 接入一个 API
2. 查看我的服务
3. 跑一个示例

你可以直接回复：
- 接入 API
- 查看我的服务
- 跑一个示例
```

Do not replace this with a passive sentence like "installation complete".

## Flow A: Connect an API

If the provider chooses `接入 API`, continue with:

```text
你要接入的是哪一种？
- 现有 API 地址
- OpenAPI 文档地址
```

Then ask one question at a time:

```text
先把地址发给我。
```

```text
这个服务叫什么名字？
```

```text
请用一句话描述这个服务是做什么的。
```

```text
你希望单次收费多少？
```

```text
使用哪种稳定币？
- USDT
- USDG
```

```text
收款钱包地址是什么？
```

```text
服务交付方式选哪种？
- hosted
- relay
```

```text
你希望它现在：
- 上架到目录
- 先不公开
```

## Confirmation Before Create

Before creating, summarize:

```text
我将按以下配置创建服务：

- 名称：...
- 描述：...
- 价格：...
- 币种：...
- 收款钱包：...
- 交付方式：...
- 上架状态：...

现在开始创建吗？
```

## Success Message

After successful creation:

```text
服务已创建成功。

你现在可以：
- 查看服务详情
- 查看目录展示
- 继续接入下一个 API
```

If the provider asks to view details:

```text
我也可以继续带你检查服务详情页、目录展示和可调用地址。
```

## Flow B: View Existing Services

If the provider chooses `查看我的服务`, continue with:

```text
我先给你看当前已接入的服务列表。

你现在可以：
- 看某个服务详情
- 修改价格
- 修改上架状态
- 接入新服务
```

## Flow C: Minimal Example

If the provider chooses `跑一个示例`, continue with:

```text
我可以先用一个最小示例带你走完整接入：
- 填一个测试 API
- 配价格和钱包
- 创建服务
- 检查目录和调用入口

现在开始吗？
```

## Missing Data Handling

If payout wallet is missing:

```text
还缺收款钱包地址。发给我后我再继续。
```

If API/OpenAPI URL is missing:

```text
还缺 API 或 OpenAPI 地址。把地址发给我，我再继续。
```

If relay information is missing:

```text
你选择了 relay。接下来我需要 relay 的访问地址和签名信息。
```

## Preferred APIs

```http
POST /api/auth/bridge/start
POST /api/auth/bridge/claim
POST /api/providers/services
GET /api/providers/services
GET /api/providers/services/{slug}
PATCH /api/providers/services/{slug}
GET /api/dashboard
GET /api/services/{slug}/detail
GET /api/services/{slug}/install
```

## Output Style

- Always speak in provider language.
- After install, always give a 2-3 option next-step menu.
- Use `服务商` / `服务商接入` / `接入你的 API`.
- Never fall back to `商家`.
- Treat the provider as the owner of the service.
