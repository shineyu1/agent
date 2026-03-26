---
name: agent-service-layer-user-skill
description: Use when guiding end users or agent operators through discovering pay-per-use services, handling x402 payment only when needed, and returning results plus receipts in a simple step-by-step flow.
---

# Agent Service Layer User Skill

This is the user-facing skill for Agent Service x402.

Its job is simple:
1. help the user find a suitable service
2. recommend the next concrete step
3. trigger wallet login and x402 payment only when a real `HTTP 402` appears
4. return results and receipts in a short, task-first way

## Dependencies

Install this skill together with OKX's OnchainOS skills:

```bash
npx skills add shineyu1/agent --skill agent-service-layer-user-skill
npx skills add okx/onchainos-skills
```

Key reused capabilities:
- `okx-agentic-wallet`
  - email login
  - wallet creation
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
已安装完成。

下一步我可以直接带你继续，建议先从 1 开始：
1. 浏览可用的 x402 服务
2. 检查钱包和支付环境
3. 调用一个服务并处理支付

你可以直接回复：
- 浏览服务
- 检查钱包
- 调用第一个服务
```

Do not replace this with a passive sentence like "installation complete".

## Flow A: Browse Services

If the user chooses `浏览服务`, continue with:

```text
你想先看哪一类？
- 搜索与研究
- 链上分析
- 风险与安全
- 开发工具
- 全部看看
```

After a category is selected:

```text
我先给你看这一类里最值得先试的服务，重点会放在用途、单次价格和最近状态。

你现在可以：
- 看某个服务详情
- 直接告诉我你想完成什么任务
```

If the user asks for a specific service:

```text
这个服务适合你的原因是：
- ...

你现在可以：
- 直接调用它
- 看安装/调用方式
- 回到服务列表
```

## Flow B: Check Wallet

If the user chooses `检查钱包`, continue with:

```text
我先帮你检查钱包是否已登录，以及是否具备支付 x402 的条件。
```

Then summarize briefly:

```text
当前状态：
- 钱包登录：...
- 地址：...
- 是否可以继续支付：...

你现在可以：
- 调用第一个服务
- 重新登录钱包
- 返回服务列表
```

## Flow C: Start a Task

If the user chooses `调用第一个服务` or describes a task, continue with:

```text
告诉我你想让 Agent 完成什么任务。
```

After the user describes the task:

```text
我找到了更适合这个任务的服务。

推荐顺序：
- 服务 A：...
- 服务 B：...

我建议先用服务 A。

你现在可以：
- 继续调用
- 看服务详情
- 换一个服务
```

If the user continues:

```text
我将发起这次请求。如果该服务需要支付，我会先向你确认。
```

## Payment Handling

Only when the upstream returns `HTTP 402`, show:

```text
这个服务需要按次支付。

本次支付信息：
- 币种：USDT 或 USDG
- 金额：...
- 服务：...

继续的话，我会先检查钱包状态并完成授权。现在继续吗？
```

### Wallet Not Logged In

If the user confirms but the wallet is not logged in:

```text
先登录 OKX 钱包。请输入你的邮箱地址。
```

After email:

```text
验证码已发送，请输入验证码。
```

After verification succeeds:

```text
登录成功，钱包已就绪。我将继续这次支付。
```

### Payment In Progress

```text
正在完成支付签名。签名完成后我会自动重试请求。
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
这次调用记录已经保存。你也可以在网页的记录页查看完整回执。
```

### Failure

```text
这次调用没有成功完成。

你现在可以：
- 重试
- 看失败原因
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
- After install, always give a 2-3 option next-step menu.
- Use the same short actions repeatedly:
  - `浏览服务`
  - `检查钱包`
  - `调用第一个服务`
  - `查看回执`
  - `查看我的记录`
- Do not mix provider-side language into the user flow.
