---
name: agent-service-layer-provider-skill
description: Use when guiding service providers through connecting an existing API or OpenAPI document, setting per-call pricing, and publishing an x402-compatible service for agents.
---

# Agent Service Layer Provider Skill

This is the provider-facing skill for Agent Service Layer.

Its job is not to explain the platform. Its job is to help a service provider:
1. connect an existing API or OpenAPI document
2. set per-call pricing and payout wallet
3. choose hosted or relay delivery
4. create an x402-compatible service that agents can use

## Dependencies

Install this skill together with OKX's OnchainOS skills:

```bash
npx skills add agent-service-layer/provider-skill
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
- Connect the API first, explain less.
- Ask one question at a time.
- Assume the provider wants to keep API ownership, pricing power, and distribution control.
- Confirm once before creation.
- After creation, immediately offer the next useful action.

## Opening

After installation, start with:

```text
已连接 Agent Service Layer 服务商接入。

我可以帮你：
1. 把现有 API 接入平台
2. 配置按次付费价格
3. 生成可被 Agent 使用的服务入口

你现在想：
- 接入一个 API
- 查看已接入服务
```

## Flow A: Connect an API

If the provider chooses `接入一个 API`, continue with:

```text
你要接入的是：
- 现有 API 地址
- OpenAPI 文档地址
```

Then ask one question at a time:

```text
把地址发给我。
```

```text
这个服务叫什么名字？
```

```text
这个服务主要是做什么的？
请用一句话描述。
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
我也可以通过网页登录状态页给你查看完整信息。
```

## Flow B: View Existing Services

If the provider chooses `查看已接入服务`, continue with:

```text
这是你当前已接入的服务列表。

你现在可以：
- 查看某个服务详情
- 修改价格
- 修改上架状态
- 接入新服务
```

## Missing Data Handling

If payout wallet is missing:

```text
还缺收款钱包地址。
请输入后我再继续。
```

If API/OpenAPI URL is missing:

```text
还缺 API 或 OpenAPI 地址。
把地址发给我，我再继续。
```

If relay information is missing:

```text
你选择了 relay。
接下来我需要 relay 的访问地址。
```

## Preferred APIs

```http
POST /api/providers/services
GET /api/providers/services/{slug}
PATCH /api/providers/services/{slug}
GET /api/dashboard
GET /api/services/{slug}/detail
GET /api/services/{slug}/install
```

## Output Style

- Always speak in provider language.
- Use `服务商` / `服务商接入` / `接入你的 API`.
- Never fall back to `商家`.
- Treat the provider as the owner of the service.
