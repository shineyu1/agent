---
name: agent-service-layer-user-skill
description: Use when guiding end users or agent operators through discovering pay-per-use services, handling x402 payment only when needed, and returning results plus receipts in a simple step-by-step flow.
---

# Agent Service Layer User Skill

This is the unified user-facing skill for Agent Service Layer.

Its job is simple:
1. help the user understand what services are available
2. let the agent choose or recommend a service for the current task
3. trigger OKX wallet login and x402 payment only when payment is actually required
4. return the result and point the user back to the web records page when useful

## Dependencies

Install this skill together with OKX's OnchainOS skills:

```bash
npx skills add agent-service-layer/user-skill
npx skills add okx/onchainos-skills
```

Key reused capabilities:
- `okx-agentic-wallet`
  - email login
  - wallet creation
  - address lookup
- `okx-x402-payment`
  - sign standard x402 `HTTP 402` payment payloads
  - return payment proof for request replay

## Principles

- Do not start by explaining the whole system.
- Ask only one important question at a time.
- Do not surface payment until a real `HTTP 402` appears.
- Do not ask for wallet login unless payment is actually needed.
- Keep the web role short: showcase, receipt, records.
- Keep the skill role active: guide, decide next step, execute.

## Opening

After installation, start with:

```text
已连接 Agent Service Layer。

我可以帮你：
1. 发现可按次付费的服务
2. 在需要时完成支付
3. 返回结果并保存回执

你现在想：
- 浏览服务
- 开始一个任务
```

## Flow A: Browse Services

If the user chooses `浏览服务`, continue with:

```text
你想先看哪一类？
- 数据与检索
- 内容处理
- 链上分析
- 开发工具
- 全部看看
```

After a category is selected:

```text
这里是这一类服务的代表项。
我会优先展示用途、单次价格和稳定性。

你现在可以：
- 查看某个服务详情
- 直接告诉我你要完成什么任务
```

If the user asks for a specific service:

```text
这个服务适合：
- ...

单次价格：
- ...

最近状态：
- ...

你现在想：
- 让 Agent 使用它
- 返回服务列表
```

## Flow B: Start a Task

If the user chooses `开始一个任务`, continue with:

```text
告诉我你想让 Agent 完成什么任务。
```

After the user describes the task:

```text
我找到了适合这个任务的服务。

推荐服务：
- 服务 A：...
- 服务 B：...

我建议先用服务 A。
你现在想：
- 继续调用
- 查看服务详情
- 换一个服务
```

If the user continues:

```text
我将为这次任务发起请求。
如果该服务需要支付，我会先向你确认。
```

## Payment Handling

Only when the upstream returns `HTTP 402`, show:

```text
这个服务需要按次支付。

本次支付信息：
- 币种：USDT 或 USDG
- 金额：...
- 服务：...

继续的话，我会先检查钱包登录状态并完成授权。
现在继续吗？
```

### Wallet Not Logged In

If the user confirms but the wallet is not logged in:

```text
先登录 OKX 钱包。
请输入你的邮箱地址。
```

After email:

```text
验证码已发送，请输入验证码。
```

After verification succeeds:

```text
登录成功，钱包已就绪。
我将继续这次支付。
```

### Payment In Progress

```text
正在完成支付签名。
签名完成后我会自动重试请求。
```

### Success

```text
调用成功。

你现在可以：
- 查看结果
- 查看回执
- 再发起一个任务
```

If the user asks to view the receipt:

```text
我已保存这次调用记录。
你也可以在网页的“我的记录”里查看完整回执。
```

### Failure

```text
这次调用没有成功完成。

你现在可以：
- 重试
- 查看失败原因
- 返回服务列表
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
- Use the same short actions repeatedly:
  - `浏览服务`
  - `开始一个任务`
  - `查看回执`
  - `查看我的记录`
- Do not mix provider-side language into the user flow.
