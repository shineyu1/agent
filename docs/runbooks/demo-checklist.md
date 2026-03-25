# SellerOS Demo Checklist

## Goal

Run a live demo that proves SellerOS can turn an existing API into a payable x402 service on X Layer and show the resulting transaction inside the seller dashboard.

## Before Demo Day

- confirm the upstream demo API is stable and responds with predictable output
- prepare one listed service and one unlisted service
- verify payout wallets for the provider and platform are correct
- verify the payment integration points to the intended X Layer environment
- seed enough data so directory, dashboard, and recent transactions do not look empty
- prepare a fallback canned request payload in case free-form input fails

## Demo Accounts and Assets

- provider account ready to log in
- buyer or agent wallet funded for at least one paid call
- provider wallet visible for payout explanation
- platform wallet visible for fee explanation, even if fee is set to zero

## Demo Flow

### 1. Show provider onboarding

- open the provider onboarding page
- show manual mode or OpenAPI import mode
- point out price, payout wallet, listing state, and access mode
- publish the service

Success criteria:

- a payable endpoint is generated
- the service card is viewable

### 2. Show discovery

- open the directory page or directory API response
- filter or sort by price, latency, or success rate
- open the new service card

Success criteria:

- the service appears if listed
- the service card shows objective metrics and endpoint info

### 3. Trigger a 402 quote

- call the payable endpoint without payment proof
- show the 402 response and quote metadata

Success criteria:

- the quote is tied to the service and amount
- the buyer sees how much to pay

### 4. Complete payment on X Layer

- submit one real payment
- capture the transaction hash

Success criteria:

- payment confirmation succeeds
- transaction hash is visible for the audience

### 5. Fulfill the request

- resend the request with valid payment proof
- show the returned API response

Success criteria:

- upstream data is returned
- the receipt path is preserved

### 6. Show dashboard impact

- open the seller dashboard
- point to updated income, call count, success rate, latency, and recent transaction history

Success criteria:

- the latest transaction hash appears
- the call is counted as paid usage

## Fallback Plan

- if live payment fails, switch to a prepared sandbox flow using the same UI path
- if the upstream API is slow, use a preconfigured stable endpoint with deterministic output
- if directory indexing lags, open the direct service card URL

## What To Emphasize Verbally

- the provider did not rebuild their backend
- the provider kept pricing and distribution control
- the buyer paid on X Layer for a real service call
- the result was actually delivered, not only paid for
- the paid call created operational data and reputation signals
