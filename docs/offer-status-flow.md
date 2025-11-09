# Offer Status Flow Documentation

## Overview

This document explains how offer statuses work in the payment flow and why they're critical for preventing "ghost bookings" from showing to providers.

## Problem Statement

**Original Issue**: When a user clicked PayPal button, an offer was created with status `PENDING` immediately. If the user cancelled payment or payment failed, the offer remained visible to providers, creating confusion and "ghost bookings."

**Solution**: Introduced `PAYMENT_PENDING` status to distinguish between unpaid offers and paid offers awaiting provider acceptance.

---

## Offer Status Definitions

### `PAYMENT_PENDING` (Legacy - No longer used)
- **When**: Previously used for offers before payment authorization
- **Status**: Deprecated - new offers use `PENDING` directly
- **Note**: May still exist in database for old transactions

### `PENDING`
- **When**: Offer created when user authorizes payment (approves in PayPal)
- **Visible to Provider**: ✅ **YES** - Shows in "Requests" tab
- **Visible to Client**: ✅ Yes - Shows as "Pending Provider Approval"
- **Purpose**: Indicates a paid booking request that needs provider review
- **Transitions to**:
  - `APPROVED` (provider accepts)
  - `REJECTED` (provider declines)
  - `CANCELLED` (client cancels before provider responds)

### `APPROVED`
- **When**: Provider accepts the booking request
- **Visible to Provider**: ✅ YES - Shows in "Active Bookings"
- **Visible to Client**: ✅ YES - Shows as "Confirmed"
- **Purpose**: Confirmed booking, service will be provided
- **Transitions to**:
  - `COMPLETED` (after service is delivered)
  - `CANCELLED` (provider or client cancels)

### `REJECTED`
- **When**: Provider declines the booking request
- **Visible to Provider**: ✅ YES - Shows in "Rejected" tab
- **Visible to Client**: ✅ YES - Shows as "Declined"
- **Purpose**: Provider cannot fulfill this booking
- **Final State**: ✅ (no further transitions)

### `CANCELLED`
- **When**: Client or provider cancels an approved booking
- **Visible to Provider**: ✅ YES - Shows in "Cancelled" tab
- **Visible to Client**: ✅ YES - Shows as "Cancelled"
- **Purpose**: Booking was approved but cancelled before delivery
- **Final State**: ✅ (no further transitions)

---

## Complete Payment & Booking Flow (AUTHORIZATION → CAPTURE)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Fills Booking Form                                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User Clicks PayPal/Card Button (createOrder)              │
│    - PayPal Order created (intent: CAPTURE)                  │
│    - Offer NOT created yet                                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────┴──────┐
                    │            │
        ┌───────────▼─┐    ┌─────▼──────────┐
        │  User       │    │  User          │
        │  Approves   │    │  Cancels       │
        │  in PayPal  │    │                │
        └───────────┬─┘    └─────┬──────────┘
                    │            │
                    │            ▼
                    │      ┌─────────────────────────┐
                    │      │ No offer created        │
                    │      │ ❌ Nothing to show      │
                    │      └─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Payment AUTHORIZED (onApprove → /api/payments/authorize) │
│    - Offer created with status: PENDING                      │
│    - Transaction created with status: PENDING                │
│    - Payment held but NOT captured yet                       │
│    - ✅ Visible to provider for review                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────┴──────┐
                    │            │
        ┌───────────▼─┐    ┌─────▼──────────┐
        │  Provider   │    │  Provider      │
        │  Approves   │    │  Rejects       │
        └───────────┬─┘    └─────┬──────────┘
                    │            │
                    ▼            ▼
        ┌────────────────┐  ┌────────────────┐
        │ CAPTURE        │  │ CANCEL         │
        │ Payment        │  │ Authorization  │
        │                │  │                │
        │ Transaction:   │  │ Transaction:   │
        │ COMPLETED      │  │ DECLINED       │
        │                │  │                │
        │ ✅ Confirmed   │  │ ❌ Declined    │
        │ ✅ Money       │  │ ✅ Funds       │
        │    captured    │  │    released    │
        └────────────────┘  └────────────────┘
```

---

## Database Schema

### Offer Model
```prisma
model Offer {
  id              String      @id @default(cuid())
  status          OfferStatus @default(PAYMENT_PENDING)
  // ... other fields
}

enum OfferStatus {
  PAYMENT_PENDING  // Payment not captured yet - hidden from provider
  PENDING          // Payment captured, awaiting provider acceptance
  APPROVED
  REJECTED
  CANCELLED
}
```

---

## API Filtering Rules

### Provider Requests Endpoint (`/api/provider/requests`)

```typescript
// Only show offers where payment has been captured
const where = {
  providerId: provider.id,
  status: {
    not: 'PAYMENT_PENDING'  // Hide unpaid offers
  }
};
```

**Result**: Providers only see offers where payment was successfully captured.

### Provider Transactions Endpoint (`/api/provider/transactions`)

```typescript
// Only show transactions that are not pending payment
const where = {
  offer: {
    providerId: provider.id
  },
  status: {
    not: 'PENDING'  // Hide unpaid transactions
  }
};
```

**Result**: Providers only see transactions where payment was captured.

---

## Payment Retry Logic

### Scenario: Card Declined, User Retries

1. **First Attempt**:
   - Offer created: `PAYMENT_PENDING`
   - Transaction created: `PENDING`
   - Payment fails → Everything stays `PENDING`

2. **Second Attempt (Retry)**:
   - Check if offer exists with `PAYMENT_PENDING` or `PENDING`
   - Found existing offer? **Allow retry** (don't block)
   - Update existing transaction with new PayPal order ID
   - If payment succeeds → Change offer to `PENDING`

3. **Block Duplicate Bookings**:
   - Only block if offer exists with transaction status = `COMPLETED`
   - This means payment was already captured for this booking

```javascript
// In payment-service.js
const existingOffer = await prisma.offer.findFirst({
  where: {
    serviceId,
    clientId,
    status: { in: ['PAYMENT_PENDING', 'PENDING'] }
  },
  include: { transaction: true }
});

// Only block if already paid
if (existingOffer?.transaction?.status === 'COMPLETED') {
  throw new Error('You have already booked this service');
}

// Allow retry if PENDING (unpaid)
```

---

## Key Benefits

1. **No Ghost Bookings**: Providers never see unpaid booking attempts
2. **Clean Provider Dashboard**: Only real, paid bookings appear
3. **Clear Status Tracking**: Easy to understand booking lifecycle
4. **Payment Retry Support**: Users can retry failed payments
5. **Audit Trail**: Database keeps all attempts (even failed payments)

---

## Migration Notes

**Date**: 2025-11-08  
**Migration**: `20251108212822_add_payment_pending_status`

### What Changed:
- Added `PAYMENT_PENDING` to `OfferStatus` enum
- Updated `payment-service.js` to use `PAYMENT_PENDING` for new offers
- Updated `capturePayment()` to change `PAYMENT_PENDING` → `PENDING` after capture
- Updated provider API endpoints to filter out `PAYMENT_PENDING` status

### Backwards Compatibility:
- Existing offers with `PENDING` status remain unchanged
- They will continue to work as before
- New offers will use the new `PAYMENT_PENDING` → `PENDING` flow

---

## Testing Scenarios

### ✅ Test 1: Successful Payment
1. User books service → Offer created (`PAYMENT_PENDING`)
2. Payment succeeds → Offer changes to `PENDING`
3. Provider sees booking in "Requests" tab ✅

### ✅ Test 2: Failed Payment
1. User books service → Offer created (`PAYMENT_PENDING`)
2. Payment fails → Offer stays `PAYMENT_PENDING`
3. Provider does NOT see booking ✅

### ✅ Test 3: Payment Retry After Failure
1. User books service → Offer created (`PAYMENT_PENDING`)
2. First payment fails → Offer stays `PAYMENT_PENDING`
3. User retries with correct card → Uses same offer
4. Payment succeeds → Offer changes to `PENDING`
5. Provider sees booking ✅

### ✅ Test 4: Prevent Duplicate Bookings
1. User completes booking (Offer: `PENDING`, Transaction: `COMPLETED`)
2. User tries to book same service again
3. System blocks: "You have already booked this service" ✅

---

## Support & Questions

For questions about this flow, see:
- `src/lib/payment/payment-service.js` - Payment logic
- `src/app/api/provider/requests/route.ts` - Provider requests filtering
- `src/utils/statusConfig.ts` - Status display configuration

**Last Updated**: November 8, 2025

