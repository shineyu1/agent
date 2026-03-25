# SellerOS x402 买方优先前端改版实施计划

> **给执行型 agent 的要求：** 必须使用 `superpowers:subagent-driven-development`（如果当前环境支持子代理）或 `superpowers:executing-plans` 来执行本计划。所有步骤都使用 `- [ ]` 复选框格式追踪。

**目标：** 在不改动后端行为的前提下，把公开前端重构为买方优先的桌面端体验，加入前端中英切换，并重做首页、安装页、服务目录页和“我的记录”页。

**实现思路：** 保留当前 Next.js App Router 架构，但新增一层轻量前端语言状态管理，以及按页面拆分的双语文案模块，让导航和页面文案可以切换，同时不引入路由级国际化。本轮只针对桌面端断点设计和实现，不安排移动端适配。改造顺序按共享壳层、首页、安装页、目录页、记录页依次推进，并在每一块同步更新测试，避免 UI 改了但断言仍停留在旧结构上。

**技术栈：** Next.js 15 App Router、React 19、TypeScript、Tailwind CSS v4、Vitest、Playwright

---

## 文件边界

### 需要修改的现有文件

- `C:\Users\shine\Desktop\SellerOS for x402\app\layout.tsx`
  - 保持根布局简洁，但要为全局语言 provider 预留挂载位置。
- `C:\Users\shine\Desktop\SellerOS for x402\app\globals.css`
  - 替换当前偏普通暗色 SaaS 的视觉风格，加入新的桌面端字体层级、命令区样式、语言切换样式、页面间距和更克制的容器风格。
- `C:\Users\shine\Desktop\SellerOS for x402\app\page.tsx`
  - 按已经确认的买方叙事重做首页结构。
- `C:\Users\shine\Desktop\SellerOS for x402\app\directory\page.tsx`
  - 改写为面向买方的服务发现页。
- `C:\Users\shine\Desktop\SellerOS for x402\app\dashboard\page.tsx`
  - 保留现有数据来源，但重构为“我的记录 / My Records”体验。
- `C:\Users\shine\Desktop\SellerOS for x402\app\install\page.tsx`
  - 修复乱码文案，并改成新的买方优先安装说明页。
- `C:\Users\shine\Desktop\SellerOS for x402\components\layout\site-shell.tsx`
  - 精简导航，加入语言切换，弱化服务商入口优先级。
- `C:\Users\shine\Desktop\SellerOS for x402\tests\unit\start\home-page.test.tsx`
  - 用新的首页文案和结构替换旧断言。
- `C:\Users\shine\Desktop\SellerOS for x402\tests\unit\start\install-page.test.tsx`
  - 用修复后的中文文案和双语结构更新断言。
- `C:\Users\shine\Desktop\SellerOS for x402\tests\unit\dashboard\dashboard-page.test.tsx`
  - 更新“我的记录”页的买方视角断言。
- `C:\Users\shine\Desktop\SellerOS for x402\tests\smoke\homepage.spec.ts`
  - 更新首页冒烟测试，覆盖新的导航、语言切换和命令区。

### 需要新增的文件

- `C:\Users\shine\Desktop\SellerOS for x402\components\layout\language-toggle.tsx`
  - 前端中英切换按钮组件。
- `C:\Users\shine\Desktop\SellerOS for x402\components\layout\language-provider.tsx`
  - 前端语言状态 provider，建议使用 React context 加本地持久化。
- `C:\Users\shine\Desktop\SellerOS for x402\lib\content\site-copy.ts`
  - 顶栏导航和全局通用文案。
- `C:\Users\shine\Desktop\SellerOS for x402\lib\content\home-copy.ts`
  - 首页双语文案模型。
- `C:\Users\shine\Desktop\SellerOS for x402\lib\content\directory-copy.ts`
  - 服务目录页双语文案。
- `C:\Users\shine\Desktop\SellerOS for x402\lib\content\records-copy.ts`
  - “我的记录”页双语文案。
- `C:\Users\shine\Desktop\SellerOS for x402\lib\content\install-copy.ts`
  - 安装页双语文案和修复后的中文字符串。
- `C:\Users\shine\Desktop\SellerOS for x402\lib\content\language.ts`
  - 语言类型和文案工具函数。
- `C:\Users\shine\Desktop\SellerOS for x402\tests\unit\layout\site-shell.test.tsx`
  - 针对导航和语言切换的新单测。

---

## 第 1 块：先加前端语言基础设施

### 任务 1：定义语言类型和全局导航文案

**文件：**
- 新建：`C:\Users\shine\Desktop\SellerOS for x402\lib\content\language.ts`
- 新建：`C:\Users\shine\Desktop\SellerOS for x402\lib\content\site-copy.ts`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\layout\site-shell.test.tsx`

- [ ] **步骤 1：先写失败测试**

```tsx
import { describe, expect, it } from "vitest";
import { primaryNavByLanguage } from "@/lib/content/site-copy";

describe("site copy", () => {
  it("提供中英文的买方优先导航文案", () => {
    expect(primaryNavByLanguage.zh.map((item) => item.label)).toEqual([
      "首页",
      "服务目录",
      "我的记录",
      "文档"
    ]);

    expect(primaryNavByLanguage.en.map((item) => item.label)).toEqual([
      "Home",
      "Directory",
      "My Records",
      "Docs"
    ]);
  });
});
```

- [ ] **步骤 2：运行测试，确认它先失败**

运行：`npm test -- tests/unit/layout/site-shell.test.tsx`  
预期：FAIL，因为语言模块和导航文案模块还不存在。

- [ ] **步骤 3：写最小实现**

```ts
export type SiteLanguage = "zh" | "en";

export const primaryNavByLanguage = {
  zh: [
    { href: "/", label: "首页" },
    { href: "/directory", label: "服务目录" },
    { href: "/dashboard", label: "我的记录" },
    { href: "/docs", label: "文档" }
  ],
  en: [
    { href: "/", label: "Home" },
    { href: "/directory", label: "Directory" },
    { href: "/dashboard", label: "My Records" },
    { href: "/docs", label: "Docs" }
  ]
} as const;
```

- [ ] **步骤 4：重新运行测试，确认通过**

运行：`npm test -- tests/unit/layout/site-shell.test.tsx`  
预期：PASS

- [ ] **步骤 5：提交**

```bash
git add tests/unit/layout/site-shell.test.tsx lib/content/language.ts lib/content/site-copy.ts
git commit -m "test: define bilingual site navigation copy"
```

### 任务 2：加入前端语言 provider 和切换按钮

**文件：**
- 新建：`C:\Users\shine\Desktop\SellerOS for x402\components\layout\language-provider.tsx`
- 新建：`C:\Users\shine\Desktop\SellerOS for x402\components\layout\language-toggle.tsx`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\app\layout.tsx`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\components\layout\site-shell.tsx`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\layout\site-shell.test.tsx`

- [ ] **步骤 1：先把新的壳层输出写进失败测试**

```tsx
expect(html).toContain("中文");
expect(html).toContain("EN");
expect(html).toContain("服务目录");
```

- [ ] **步骤 2：运行测试，确认它失败**

运行：`npm test -- tests/unit/layout/site-shell.test.tsx`  
预期：FAIL，因为当前顶部导航还没有语言切换。

- [ ] **步骤 3：写最小实现**

```tsx
"use client";

const LanguageContext = createContext<...>(...);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState<SiteLanguage>("zh");
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div>
      <button onClick={() => setLanguage("zh")}>中文</button>
      <button onClick={() => setLanguage("en")}>EN</button>
    </div>
  );
}
```

- [ ] **步骤 4：重新运行测试，确认通过**

运行：`npm test -- tests/unit/layout/site-shell.test.tsx`  
预期：PASS

- [ ] **步骤 5：提交**

```bash
git add app/layout.tsx components/layout/site-shell.tsx components/layout/language-provider.tsx components/layout/language-toggle.tsx tests/unit/layout/site-shell.test.tsx
git commit -m "feat: add frontend language toggle scaffold"
```

---

## 第 2 块：重做首页，建立买方优先 Hero

### 任务 3：先改首页测试，明确新的结构和文案

**文件：**
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\start\home-page.test.tsx`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\tests\smoke\homepage.spec.ts`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\start\home-page.test.tsx`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\smoke\homepage.spec.ts`

- [ ] **步骤 1：先写新的失败断言**

```tsx
expect(html).toContain("发现并调用可按次付费的 Agent 服务");
expect(html).toContain("30 秒接入");
expect(html).toContain("浏览服务");
expect(html).toContain("查看文档");
```

```ts
await expect(page.getByRole("button", { name: "中文" })).toBeVisible();
await expect(page.getByRole("button", { name: "EN" })).toBeVisible();
await expect(page.getByText("npx skills add agent-service-layer/user-skill")).toBeVisible();
```

- [ ] **步骤 2：运行测试，确认它失败**

运行：`npm test -- tests/unit/start/home-page.test.tsx`  
预期：FAIL，因为首页仍是旧文案。

运行：`npm run test:e2e -- tests/smoke/homepage.spec.ts`  
预期：FAIL，因为冒烟测试仍绑定旧导航和旧首屏。

- [ ] **步骤 3：先写首页文案模块的最小结构**

```ts
export const homeCopy = {
  zh: {
    heroTitle: "发现并调用可按次付费的 Agent 服务",
    heroEyebrow: "x402 pay-per-use for agents",
    heroIntro: "安装 Skill，让 Agent 发现服务、按次支付、直接调用，并保留结果与回执记录。"
  },
  en: { ... }
};
```

- [ ] **步骤 4：再次运行单测，确认还未通过**

运行：`npm test -- tests/unit/start/home-page.test.tsx`  
预期：仍然 FAIL，因为真正的首页组件还没切换到新结构。

- [ ] **步骤 5：提交**

```bash
git add tests/unit/start/home-page.test.tsx tests/smoke/homepage.spec.ts lib/content/home-copy.ts
git commit -m "test: define buyer-first homepage expectations"
```

### 任务 4：实现新的首页结构和样式

**文件：**
- 新建：`C:\Users\shine\Desktop\SellerOS for x402\lib\content\home-copy.ts`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\app\page.tsx`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\app\globals.css`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\components\layout\site-shell.tsx`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\start\home-page.test.tsx`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\smoke\homepage.spec.ts`

- [ ] **步骤 1：实现中心聚焦型 Hero**

```tsx
<section className="home-hero">
  <p>{copy.heroEyebrow}</p>
  <h1>{copy.heroTitle}</h1>
  <p>{copy.heroIntro}</p>
  <div className="command-block">
    {installCommands.map(...)}
    <button>{copy.copyLabel}</button>
  </div>
</section>
```

- [ ] **步骤 2：补齐首页后续区块**

```tsx
<section>{copy.capabilitiesTitle}</section>
<section>{copy.flowTitle}</section>
<section>{copy.trustTitle}</section>
<section>{copy.closingTitle}</section>
```

- [ ] **步骤 3：重写首页相关全局样式**

加入以下样式能力：

- 更大的 Hero 标题层级
- 更克制的首屏容器
- 更强调的命令区
- 更强的文字节奏
- 顶栏语言切换样式

- [ ] **步骤 4：运行测试，确认通过**

运行：`npm test -- tests/unit/start/home-page.test.tsx`  
预期：PASS

运行：`npm run test:e2e -- tests/smoke/homepage.spec.ts`  
预期：PASS

- [ ] **步骤 5：提交**

```bash
git add app/page.tsx app/globals.css components/layout/site-shell.tsx lib/content/home-copy.ts
git commit -m "feat: rebuild homepage around buyer-first hero"
```

---

## 第 3 块：清理安装页、目录页和“我的记录”页

### 任务 5：修复安装页乱码并接入双语文案

**文件：**
- 新建：`C:\Users\shine\Desktop\SellerOS for x402\lib\content\install-copy.ts`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\app\install\page.tsx`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\start\install-page.test.tsx`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\start\install-page.test.tsx`

- [ ] **步骤 1：先写修复后中文文案的失败测试**

```tsx
expect(html).toContain("安装 Skill，立即开始");
expect(html).toContain("浏览服务");
expect(html).toContain("我的记录");
```

- [ ] **步骤 2：运行测试，确认它失败**

运行：`npm test -- tests/unit/start/install-page.test.tsx`  
预期：FAIL，因为当前页面仍包含乱码字符串。

- [ ] **步骤 3：实现清理后的安装页文案**

```ts
export const installCopy = {
  zh: {
    title: "安装 Skill，立即开始",
    ...
  },
  en: { ... }
};
```

- [ ] **步骤 4：重新运行测试，确认通过**

运行：`npm test -- tests/unit/start/install-page.test.tsx`  
预期：PASS

- [ ] **步骤 5：提交**

```bash
git add app/install/page.tsx lib/content/install-copy.ts tests/unit/start/install-page.test.tsx
git commit -m "fix: clean install page copy and prepare bilingual content"
```

### 任务 6：把目录页重构成买方服务发现页

**文件：**
- 新建：`C:\Users\shine\Desktop\SellerOS for x402\lib\content\directory-copy.ts`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\app\directory\page.tsx`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\app\globals.css`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\discovery\directory.test.ts`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\tests\smoke\user-journey.spec.ts`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\discovery\directory.test.ts`

- [ ] **步骤 1：先写新的目录页失败断言**

```ts
expect(html).toContain("为你的 Agent 发现可直接调用的服务");
expect(html).toContain("价格");
expect(html).toContain("成功率");
expect(html).toContain("查看服务详情");
```

- [ ] **步骤 2：运行测试，确认它失败**

运行：`npm test -- tests/unit/discovery/directory.test.ts`  
预期：FAIL，因为当前目录页还是旧文案结构。

- [ ] **步骤 3：实现目录页文案和卡片层级调整**

每张服务卡优先强调：

- 服务用途
- 价格
- 成功率
- 平均延迟
- 最近调用量

- [ ] **步骤 4：重新运行测试，确认通过**

运行：`npm test -- tests/unit/discovery/directory.test.ts`  
预期：PASS

- [ ] **步骤 5：提交**

```bash
git add app/directory/page.tsx app/globals.css lib/content/directory-copy.ts tests/unit/discovery/directory.test.ts tests/smoke/user-journey.spec.ts
git commit -m "feat: reframe directory page for buyer-side service discovery"
```

### 任务 7：把 Dashboard 重构为“我的记录”

**文件：**
- 新建：`C:\Users\shine\Desktop\SellerOS for x402\lib\content\records-copy.ts`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\app\dashboard\page.tsx`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\dashboard\dashboard-page.test.tsx`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\tests\smoke\dashboard.spec.ts`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\dashboard\dashboard-page.test.tsx`

- [ ] **步骤 1：先写新的“我的记录”失败测试**

```tsx
expect(html).toContain("我的记录");
expect(html).toContain("总支出");
expect(html).toContain("最近调用");
expect(html).toContain("回执");
```

- [ ] **步骤 2：运行测试，确认它失败**

运行：`npm test -- tests/unit/dashboard/dashboard-page.test.tsx`  
预期：FAIL，因为当前页面仍是旧标题和旧结构。

- [ ] **步骤 3：实现新的买方记录页结构**

保留现有 `snapshot` 数据来源，但按以下顺序重排和重命名：

- 支出
- 调用次数
- 失败记录
- 回执入口

- [ ] **步骤 4：重新运行测试，确认通过**

运行：`npm test -- tests/unit/dashboard/dashboard-page.test.tsx`  
预期：PASS

- [ ] **步骤 5：提交**

```bash
git add app/dashboard/page.tsx lib/content/records-copy.ts tests/unit/dashboard/dashboard-page.test.tsx tests/smoke/dashboard.spec.ts
git commit -m "feat: reframe dashboard as buyer records"
```

---

## 第 4 块：统一壳层、样式和回归验证

### 任务 8：统一顶栏和全局视觉系统

**文件：**
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\app\globals.css`
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\components\layout\site-shell.tsx`
- 测试：`C:\Users\shine\Desktop\SellerOS for x402\tests\unit\layout\site-shell.test.tsx`

- [ ] **步骤 1：先补最终导航行为的失败测试**

```tsx
expect(html).not.toContain("如何使用");
expect(html).toContain("文档");
```

- [ ] **步骤 2：运行测试，确认它失败**

运行：`npm test -- tests/unit/layout/site-shell.test.tsx`  
预期：FAIL，因为当前导航层级仍有旧入口或旧排序。

- [ ] **步骤 3：完成最终壳层清理**

包括：

- 最终导航顺序
- 服务商入口降级
- 语言切换位置固定
- 顶栏密度更干净

- [ ] **步骤 4：重新运行测试，确认通过**

运行：`npm test -- tests/unit/layout/site-shell.test.tsx`  
预期：PASS

- [ ] **步骤 5：提交**

```bash
git add app/globals.css components/layout/site-shell.tsx tests/unit/layout/site-shell.test.tsx
git commit -m "style: unify buyer-first shell and global visual system"
```

### 任务 9：跑完整验证并记录剩余事项

**文件：**
- 修改：`C:\Users\shine\Desktop\SellerOS for x402\docs\superpowers\plans\2026-03-25-buyer-first-frontend-redesign.md`

- [ ] **步骤 1：运行定向单测**

运行：  
`npm test -- tests/unit/layout/site-shell.test.tsx tests/unit/start/home-page.test.tsx tests/unit/start/install-page.test.tsx tests/unit/dashboard/dashboard-page.test.tsx tests/unit/discovery/directory.test.ts`

预期：PASS

- [ ] **步骤 2：运行定向冒烟测试**

运行：  
`npm run test:e2e -- tests/smoke/homepage.spec.ts tests/smoke/dashboard.spec.ts tests/smoke/user-journey.spec.ts`

预期：PASS

- [ ] **步骤 3：运行 lint**

运行：`npm run lint`  
预期：PASS

- [ ] **步骤 4：把遗留事项记录到计划或实现备注中**

```md
- [ ] 后续可选优化：把语言选择做成更稳定的持久化方案
- [ ] 后续单独立项：补做移动端适配与响应式布局
```

- [ ] **步骤 5：提交**

```bash
git add docs/superpowers/plans/2026-03-25-buyer-first-frontend-redesign.md
git commit -m "docs: finalize buyer-first frontend execution checklist"
```

---

计划已完成，保存在 `docs/superpowers/plans/2026-03-25-buyer-first-frontend-redesign.md`。可以进入执行阶段。
