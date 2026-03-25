# Consumer-First Frontend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition the SellerOS web experience as a user-facing product for discovering and using services with one unified skill, while moving provider onboarding behind a single merchant entry.

**Architecture:** Keep the existing Next.js app/router and backend APIs intact, but reorganize the navigation, page hierarchy, and page copy around a consumer-first journey: Home -> Directory -> Service Detail -> How It Works -> My Activity. Merchant onboarding remains available but becomes a distinct, secondary route and CTA. Existing provider APIs and session-bridge flows continue to power the secondary merchant entry and activity views.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, Vitest, Playwright

---

## File Map

- Modify: `C:/Users/shine/Desktop/SellerOS for x402/components/layout/site-shell.tsx`
  - Rework top navigation and global labels for a consumer-first information architecture.
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/page.tsx`
  - Turn the homepage into a user-facing landing page with one unified skill CTA and one merchant entry CTA.
- Create: `C:/Users/shine/Desktop/SellerOS for x402/app/how-it-works/page.tsx`
  - Add a dedicated usage page that explains the user flow, skill installation, payment loop, and activity viewing.
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/directory/page.tsx`
  - Reposition the directory as the main consumer browsing surface.
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/services/[slug]/page.tsx`
  - Reposition service detail as a consumer decision page.
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/dashboard/page.tsx`
  - Reframe the dashboard as “我的记录 / My Activity” rather than an operator-first control panel.
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/providers/new/page.tsx`
  - Reframe the page as a standalone merchant entry.
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/providers/page.tsx`
  - Ensure provider pages visually read as secondary merchant tooling, not part of the main user flow.
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/install/page.tsx`
  - Collapse Buyer/Seller skill framing into one user-facing skill plus one merchant entry explanation.
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/start/home-page.test.tsx`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/start/install-page.test.tsx`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/services/service-detail-page.test.tsx`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/dashboard/dashboard-page.test.tsx`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/smoke/homepage.spec.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/smoke/service-detail.spec.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/smoke/dashboard.spec.ts`

---

## Chunk 1: Navigation And Homepage

### Task 1: Rewrite the global navigation

**Files:**
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/components/layout/site-shell.tsx`
- Test: `C:/Users/shine/Desktop/SellerOS for x402/tests/smoke/homepage.spec.ts`

- [ ] **Step 1: Write/adjust the failing smoke assertion**

Update the homepage smoke test so it expects the consumer-first nav:
- 首页
- 服务目录
- 如何使用
- 我的记录
- 商家接入

- [ ] **Step 2: Run the smoke test to verify it fails**

Run: `npx playwright test tests/smoke/homepage.spec.ts --project=chromium`
Expected: FAIL because the current nav is still the old mixed IA.

- [ ] **Step 3: Implement the minimal nav rewrite**

Update `site-shell.tsx`:
- promote consumer-first routes in the primary nav
- keep merchant entry visible but clearly secondary
- ensure the session badge labels still make sense for current auth/session flows

- [ ] **Step 4: Re-run the smoke test**

Run: `npx playwright test tests/smoke/homepage.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/layout/site-shell.tsx tests/smoke/homepage.spec.ts
git commit -m "feat: shift navigation to consumer-first"
```

### Task 2: Turn the homepage into a consumer-first landing page

**Files:**
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/page.tsx`
- Test: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/start/home-page.test.tsx`

- [ ] **Step 1: Write/adjust the failing unit test**

Update the homepage test to expect:
- a single unified skill install call-to-action
- consumer-first hero copy
- a secondary merchant entry CTA

- [ ] **Step 2: Run the unit test to verify it fails**

Run: `npx vitest run tests/unit/start/home-page.test.tsx`
Expected: FAIL because the old provider-heavy hero copy still exists.

- [ ] **Step 3: Implement the homepage rewrite**

In `app/page.tsx`:
- hero should speak to users, not providers
- primary CTA: browse services / install skill
- secondary CTA: merchant entry
- reduce architecture exposition
- keep one lightweight “how it works” section and one trust/metrics section

- [ ] **Step 4: Re-run the unit test**

Run: `npx vitest run tests/unit/start/home-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx tests/unit/start/home-page.test.tsx
git commit -m "feat: rewrite homepage for consumer-first flow"
```

---

## Chunk 2: Core User Journey Pages

### Task 3: Add a dedicated “How It Works” page

**Files:**
- Create: `C:/Users/shine/Desktop/SellerOS for x402/app/how-it-works/page.tsx`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/components/layout/site-shell.tsx`

- [ ] **Step 1: Write the failing smoke expectation**

Add or extend smoke coverage to verify `/how-it-works` renders and is linked in the main nav.

- [ ] **Step 2: Run the relevant smoke test to confirm failure**

Run: `npx playwright test tests/smoke/homepage.spec.ts --project=chromium`
Expected: FAIL because the route/link does not exist yet.

- [ ] **Step 3: Implement the page**

Create a focused page with:
- one unified SellerOS Skill
- user flow: discover -> install -> pay -> use -> review activity
- payment/receipt explanation in simplified language
- merchant entry link at the bottom

- [ ] **Step 4: Re-run smoke**

Run: `npx playwright test tests/smoke/homepage.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/how-it-works/page.tsx components/layout/site-shell.tsx tests/smoke/homepage.spec.ts
git commit -m "feat: add consumer how-it-works page"
```

### Task 4: Rework the directory as the primary browsing page

**Files:**
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/directory/page.tsx`
- Test: `C:/Users/shine/Desktop/SellerOS for x402/tests/smoke/provider-directory.spec.ts`

- [ ] **Step 1: Adjust the failing smoke test**

Update expectations to assert the page reads like a user browsing page rather than a provider/ops screen.

- [ ] **Step 2: Run the smoke test to verify failure**

Run: `npx playwright test tests/smoke/provider-directory.spec.ts --project=chromium`
Expected: FAIL due to old wording/layout assumptions.

- [ ] **Step 3: Implement the page rewrite**

Keep the same data sources, but rewrite structure so the page emphasizes:
- service value
- price
- reliability
- suitability for an agent workflow

- [ ] **Step 4: Re-run smoke**

Run: `npx playwright test tests/smoke/provider-directory.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/directory/page.tsx tests/smoke/provider-directory.spec.ts
git commit -m "feat: reposition directory for consumer browsing"
```

### Task 5: Rework service detail as a decision page

**Files:**
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/services/[slug]/page.tsx`
- Test: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/services/service-detail-page.test.tsx`
- Test: `C:/Users/shine/Desktop/SellerOS for x402/tests/smoke/service-detail.spec.ts`

- [ ] **Step 1: Update the failing unit and smoke tests**

Expect the page to prioritize:
- what the service does
- what it costs
- how to use it with the unified SellerOS Skill
- why it is trustworthy

- [ ] **Step 2: Run the focused tests to verify failure**

Run:
- `npx vitest run tests/unit/services/service-detail-page.test.tsx`
- `npx playwright test tests/smoke/service-detail.spec.ts --project=chromium`

Expected: FAIL due to current mixed provider/agent copy.

- [ ] **Step 3: Implement the page rewrite**

Keep the metrics and event data, but reorder and relabel sections:
- value summary first
- install/use flow second
- technical endpoint block third
- payment/activity below

- [ ] **Step 4: Re-run both tests**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/services/[slug]/page.tsx tests/unit/services/service-detail-page.test.tsx tests/smoke/service-detail.spec.ts
git commit -m "feat: turn service detail into consumer decision page"
```

---

## Chunk 3: Activity And Merchant Entry

### Task 6: Reframe dashboard as “My Activity”

**Files:**
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/dashboard/page.tsx`
- Test: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/dashboard/dashboard-page.test.tsx`
- Test: `C:/Users/shine/Desktop/SellerOS for x402/tests/smoke/dashboard.spec.ts`

- [ ] **Step 1: Update the failing tests**

Expect:
- title / labels rewritten to “我的记录” or equivalent user-facing activity framing
- payment/call history still visible
- runtime/system details pushed lower or visually softened

- [ ] **Step 2: Run tests and confirm failure**

Run:
- `npx vitest run tests/unit/dashboard/dashboard-page.test.tsx`
- `npx playwright test tests/smoke/dashboard.spec.ts --project=chromium`

Expected: FAIL because current page still presents itself as a status panel.

- [ ] **Step 3: Implement the rewrite**

Retain existing data sources, but shift copy and hierarchy toward:
- recent usage
- receipts
- failed calls
- recovery notes

- [ ] **Step 4: Re-run both tests**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx tests/unit/dashboard/dashboard-page.test.tsx tests/smoke/dashboard.spec.ts
git commit -m "feat: reframe dashboard as user activity"
```

### Task 7: Collapse install/docs into one unified user skill story

**Files:**
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/install/page.tsx`
- Test: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/start/install-page.test.tsx`

- [ ] **Step 1: Update the failing unit test**

Expect one unified user-facing `SellerOS Skill` instead of a split buyer/seller framing in the main content.

- [ ] **Step 2: Run the test to verify failure**

Run: `npx vitest run tests/unit/start/install-page.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement the install/docs rewrite**

Make this page user-facing:
- one skill
- one start path
- wallet/payment explanation
- merchant entry as a secondary section, not peer-level main flow

- [ ] **Step 4: Re-run the unit test**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/install/page.tsx tests/unit/start/install-page.test.tsx
git commit -m "feat: simplify install page around one user skill"
```

### Task 8: Demote merchant web pages into a single secondary flow

**Files:**
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/providers/new/page.tsx`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/providers/page.tsx`

- [ ] **Step 1: Add or update a failing smoke/unit expectation if needed**

Use existing provider smoke coverage if enough; otherwise add a small assertion around the new merchant-entry framing.

- [ ] **Step 2: Run the relevant test(s)**

Expected: FAIL if the page still reads like part of the main user journey.

- [ ] **Step 3: Implement the merchant-entry rewrite**

Keep the forms and APIs, but relabel the route and page copy so it reads like:
- a dedicated merchant entry
- optional contact/help path
- not a primary homepage route

- [ ] **Step 4: Re-run tests**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/providers/new/page.tsx app/providers/page.tsx
git commit -m "feat: demote merchant pages to secondary entry"
```

---

## Chunk 4: Final Integration And Verification

### Task 9: Full regression pass

**Files:**
- Verify only

- [ ] **Step 1: Run unit tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no lint errors

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: successful Next.js production build

- [ ] **Step 4: Run smoke tests**

Run:
`npx playwright test tests/smoke/homepage.spec.ts tests/smoke/provider-directory.spec.ts tests/smoke/provider-onboarding.spec.ts tests/smoke/dashboard.spec.ts tests/smoke/provider-not-found.spec.ts tests/smoke/service-detail.spec.ts --project=chromium`

Expected: all smoke tests pass

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: verify consumer-first frontend rewrite"
```

