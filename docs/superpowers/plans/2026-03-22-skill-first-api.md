# Skill-First API Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing SellerOS backend as a stable API surface for Buyer Skill, Seller Skill, and the reduced web shell.

**Architecture:** Keep the existing payment execution route as the source of truth, then add thin read/write API routes around the current service store, payment ledger, and dashboard aggregators. Avoid duplicating business logic in route handlers by extracting shared serializers for service detail, install metadata, receipts, and provider summaries.

**Tech Stack:** Next.js App Router route handlers, TypeScript, Prisma with JSON fallback stores, Vitest, Playwright

---

## Chunk 1: Shared Buyer API Surface

### Task 1: Add buyer-facing contract tests

**Files:**
- Create: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/services/service-detail-route.test.ts`
- Create: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/services/service-install-route.test.ts`
- Create: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/services/receipt-route.test.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/discovery/directory-route.test.ts`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run the targeted tests and verify they fail for missing routes/fields**
- [ ] **Step 3: Implement only the minimum route behavior needed to satisfy the tests**
- [ ] **Step 4: Re-run the targeted tests and confirm they pass**

### Task 2: Add shared serializers and buyer routes

**Files:**
- Create: `C:/Users/shine/Desktop/SellerOS for x402/lib/services/api/service-detail.ts`
- Create: `C:/Users/shine/Desktop/SellerOS for x402/app/api/services/[slug]/detail/route.ts`
- Create: `C:/Users/shine/Desktop/SellerOS for x402/app/api/services/[slug]/install/route.ts`
- Create: `C:/Users/shine/Desktop/SellerOS for x402/app/api/receipts/[txHash]/route.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/app/api/directory/route.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/lib/services/discovery/directory.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/lib/services/gateway/payment-event-store.ts`

- [ ] **Step 1: Implement shared service detail/install serializers**
- [ ] **Step 2: Implement `GET /api/services/[slug]/detail`**
- [ ] **Step 3: Implement `GET /api/services/[slug]/install`**
- [ ] **Step 4: Implement `GET /api/receipts/[txHash]`**
- [ ] **Step 5: Extend `GET /api/directory` with stable sort/filter-friendly response fields**
- [ ] **Step 6: Run the targeted buyer/shared route tests**

## Chunk 2: Seller API Surface

### Task 3: Add seller-facing contract tests

**Files:**
- Create: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/providers/provider-service-detail-route.test.ts`
- Create: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/providers/provider-service-update-route.test.ts`
- Create: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/dashboard/dashboard-route.test.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/providers/services-api.test.ts`

- [ ] **Step 1: Write failing tests for list/detail/update/dashboard contracts**
- [ ] **Step 2: Run the targeted tests and verify the missing behavior fails correctly**
- [ ] **Step 3: Implement only the minimum code to satisfy the contracts**
- [ ] **Step 4: Re-run the targeted tests and confirm they pass**

### Task 4: Implement seller read/update routes and dashboard API

**Files:**
- Create: `C:/Users/shine/Desktop/SellerOS for x402/app/api/providers/services/[slug]/route.ts`
- Create: `C:/Users/shine/Desktop/SellerOS for x402/app/api/dashboard/route.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/lib/services/registry/service-store.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/lib/services/analytics/dashboard.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/lib/services/analytics/service-health.ts`

- [ ] **Step 1: Add store helpers for provider-facing reads and safe updates**
- [ ] **Step 2: Implement `GET /api/providers/services/[slug]`**
- [ ] **Step 3: Implement `PATCH /api/providers/services/[slug]` with guarded editable fields only**
- [ ] **Step 4: Implement `GET /api/dashboard` as the stable web/skill summary endpoint**
- [ ] **Step 5: Run the targeted seller/dashboard tests**

## Chunk 3: Integration and Verification

### Task 5: Keep the payable flow stable against the new API surface

**Files:**
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/gateway/payable-endpoint.test.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/gateway/payable-dashboard-flow.test.ts`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/services/service-detail-page.test.tsx`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/tests/unit/dashboard/dashboard-page.test.tsx`

- [ ] **Step 1: Add regression assertions for new route shapes and receipt lookups**
- [ ] **Step 2: Run targeted regression tests**
- [ ] **Step 3: Fix any route serialization inconsistencies**
- [ ] **Step 4: Re-run targeted regressions until green**

### Task 6: Full verification

**Files:**
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/README.md`
- Modify: `C:/Users/shine/Desktop/SellerOS for x402/docs/runbooks/deployment-runbook.md`

- [ ] **Step 1: Update docs for the finalized skill-first API surface**
- [ ] **Step 2: Run `npx vitest run`**
- [ ] **Step 3: Run `npm run lint`**
- [ ] **Step 4: Run `npx playwright test tests/smoke/homepage.spec.ts tests/smoke/provider-directory.spec.ts tests/smoke/provider-onboarding.spec.ts tests/smoke/dashboard.spec.ts tests/smoke/provider-not-found.spec.ts tests/smoke/service-detail.spec.ts --project=chromium`**
- [ ] **Step 5: Run `npm run build`**

Plan complete and saved to `docs/superpowers/plans/2026-03-22-skill-first-api.md`.
