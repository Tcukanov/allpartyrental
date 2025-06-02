# AllPartyRent Platform Documentation

## Project Overview

READ THIS FILE BEFORE ANY REPOSNE OR CODE WRITING.
DO NOT USE MIGRATE DEV USE PUSH INSTEAD.
PLEASE DO NOT USE HARDCODE, ONLY WHERE'S NO OPTION.

AllPartyRent is a marketplace platform that connects party equipment/service providers with clients looking to rent party supplies and services. The platform allows providers to list their services and clients to find, compare, and book party rentals in their area.

##CATEGORIES
WE ONLY USING NOW SOFT PLAY. IN FUTURE WE WILL ADD 
BOUNCE HOUSES, PHOTO BOOTH, ETC

## Tech Stack

- **Frontend**: Next.js 15.0 (App Router), React, Chakra UI
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Deployment**: Vercel
- **Payment Processing**: PayPal Marketplace (with automatic commission splitting)

## Payment System - PayPal Marketplace

AllPartyRent uses **PayPal Marketplace** for secure, automated payment processing with built-in commission handling:

### **How It Works:**
1. **Client Payment**: Clients pay through PayPal credit card forms (Service Price + 5% client fee)
2. **Automatic Splitting**: PayPal automatically splits payments:
   - **Provider receives**: Service Price - 12% platform commission (instant transfer)
   - **Platform keeps**: 12% commission + 5% client fee
3. **Instant Payouts**: Providers receive money directly when bookings are confirmed
4. **No Manual Transfers**: Zero intervention required for provider payments

### **Provider Onboarding:**
- Providers can connect their PayPal business accounts through our onboarding flow
- Connected providers get instant payments via marketplace
- Non-connected providers fall back to manual payout system
- PayPal handles all KYC and compliance requirements

### **Payment Structure:**
```
Example: $100 Service
├── Client Pays: $105 (service + 5% client fee)
├── Provider Gets: $88 (service - 12% commission) [INSTANT]
└── Platform Keeps: $17 (12% commission + 5% client fee)
```

### **Benefits:**
- ✅ Instant provider payments
- ✅ Automatic commission deduction
- ✅ Reduced transaction fees
- ✅ PayPal's fraud protection
- ✅ No manual accounting for payouts
- ✅ Better cash flow for providers

## Core Features

1. **User Management**
   - Client accounts (people looking for party services)
   - Provider accounts (businesses offering party services)
   - Admin accounts for platform management

2. **Service Listings**
   - Providers can create and manage service listings
   - Services include details like price, description, photos, colors
   - Services are categorized and associated with locations

3. **Search & Filter System**
   - City-based filtering
   - Category-based filtering
   - Dynamic filters based on category (size, color, material, etc.)
   - Text search functionality

4. **Bookings & Payments**
   - Party planning
   - Service requests
   - Quotes/Offers from providers
   - PayPal Marketplace transactions with automatic splitting
   - Instant provider payouts for connected accounts

5. **Location System**
   - City management with default city support
   - Provider service areas
   - Location-based service discovery

6. **Provider Payment Integration**
   - PayPal onboarding flow for providers
   - Payment status tracking
   - Automatic marketplace vs. manual payment detection
   - Commission tracking and reporting

## Key Routes & Pages

- `/` - Home page
- `/services` - Browse all services with filters
- `/services/[id]` - Individual service details
- `/[location]/[service]` - Browse services by location and category
- `/admin/*` - Admin dashboard routes
- `/provider/*` - Provider dashboard routes
  - `/provider/dashboard/paypal` - PayPal marketplace integration & settings
- `/client/*` - Client dashboard routes

## Database Schema

Key models include:
- `User` - Base user model with authentication
- `Provider` - Provider profile information + PayPal marketplace data
  - `paypalMerchantId` - Provider's PayPal merchant ID
  - `paypalOnboardingId` - PayPal partner referral tracking ID
  - `paypalTrackingId` - PayPal onboarding tracking ID
  - `paypalOnboardingStatus` - Current onboarding status (NOT_STARTED, PENDING, COMPLETED, FAILED)
  - `paypalCanReceivePayments` - Whether provider can receive marketplace payments
  - `paypalStatusIssues` - Array of status validation issues
- `Service` - Service listings
- `ServiceCategory` - Categories for services
- `ServiceAddon` - Add-ons for services
- `City` - Location information
- `ProviderCity` - Junction table for provider service areas
- `Party` - Client party planning data
- `Transaction` - Payment transactions with commission tracking
  - `clientFeePercent` - Client fee percentage applied
  - `providerFeePercent` - Provider commission percentage
  - `isMarketplacePayment` - Whether payment used marketplace splitting

## API Structure

- `/api/services/*` - Service management endpoints
- `/api/cities/*` - City management endpoints
- `/api/categories/*` - Category management endpoints
- `/api/admin/*` - Admin-only endpoints
- `/api/provider/*` - Provider-only endpoints
- `/api/client/*` - Client-only endpoints
- `/api/payments/*` - Payment processing endpoints
  - `/api/payments/create` - Create marketplace or regular payment orders
  - `/api/payments/capture` - Capture payments with automatic splitting
- `/api/transactions/*` - Transaction processing endpoints
- `/api/paypal/*` - PayPal marketplace integration endpoints
  - `/api/paypal/onboard-seller` - Create PayPal partner referrals for provider onboarding
  - `/api/paypal/callback` - Handle PayPal onboarding completion callbacks

## Payment Flow

### **1. Payment Creation**
```javascript
// Automatically tries marketplace payment first
const paymentResult = await paymentService.createMarketplacePaymentOrder(
  transactionId,
  servicePrice,
  providerId,
  { paymentMethod: 'card_fields' }
);

// Falls back to regular payment if provider not connected
if (!provider.paypalMerchantId) {
  return await paymentService.createPaymentOrder(transactionId, servicePrice);
}
```

### **2. Payment Capture**
```javascript
// PayPal automatically handles commission splitting
const captureResult = await paymentService.capturePayment(orderId);

// Marketplace payments: Provider gets money instantly
// Regular payments: Manual payout required
```

### **3. Provider Onboarding**
```javascript
// Generate PayPal partner referral link
const referral = await paypalClient.createPartnerReferral(
  providerEmail,
  returnUrl
);

// Provider completes PayPal business account setup
// System automatically detects completion and enables marketplace payments
```

## Frontend Components

The UI is built with Chakra UI and follows these design patterns:
- Page components in `/app` directory following Next.js app router structure
- Server components for data fetching and initial rendering
- Client components for interactive UI elements
- Consistent filter UI pattern across service listing pages
- **PayPal Components**:
  - `PayPalCreditCardForm` - Embedded credit card payment form with partner attribution
  - **PayPal Settings Page** (`/provider/dashboard/paypal`) - Complete provider PayPal management interface
  - PayPal provider navigation integrated in dashboard sidebar

## Code Organization

1. **Server-Side Components**
   - Handle data fetching
   - Prepare data for client components
   - Provide metadata for SEO

2. **Client-Side Components**
   - Handle user interactions
   - Manage state
   - Fetch additional data via API routes
   - PayPal SDK integration

3. **API Routes**
   - Follow RESTful patterns
   - Include authentication checks
   - Return standardized response formats
   - PayPal Marketplace API integration

4. **Payment Services**
   - `PayPalClient` - Direct PayPal API communication
   - `PaymentService` - Business logic for marketplace payments
   - Automatic fallback between marketplace and regular payments
   
## Filter System

The platform uses a consistent filtering pattern across service browsing pages:
- Top filter bar: Basic search and sorting options
- Left sidebar: Category-specific additional filters
- Dynamic filter generation based on category metadata

## Authentication

- NextAuth.js handles authentication
- Role-based access control (client, provider, admin)
- Protected API routes and pages

## Environment Variables

### **Required for PayPal Marketplace:**
```env
# PayPal Credentials
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_ENVIRONMENT="SANDBOX" # or "LIVE"

# Marketplace Settings
PAYPAL_PLATFORM_MERCHANT_ID="your-platform-merchant-id"
PAYPAL_PARTNER_ID="your-partner-id"
PAYPAL_PARTNER_ATTRIBUTION_ID="your-partner-attribution-id"
```

## Patterns to Follow

When modifying or adding code to this project, follow these patterns:

1. **API Responses**
   ```typescript
   // Success response
   return NextResponse.json({ 
     success: true, 
     data: resultData 
   }, { status: 200 });
   
   // Error response
   return NextResponse.json({ 
     success: false, 
     error: { 
       message: 'Error message', 
       details: errorDetails 
     } 
   }, { status: errorCode });
   ```

2. **Payment Processing**
   ```javascript
   // Always try marketplace payment first
   try {
     return await paymentService.createMarketplacePaymentOrder(...);
   } catch (marketplaceError) {
     // Fallback to regular payment
     return await paymentService.createPaymentOrder(...);
   }
   ```

3. **Component Structure**
   - Server components fetch initial data
   - Client components handle interactions
   - Separate business logic from UI

4. **Filtering Pattern**
   - Filters at the top bar
   - More complex filters in the left sidebar
   - Results in a responsive grid

5. **Error Handling**
   - Wrap API calls in try/catch blocks
   - Provide meaningful error messages
   - Log errors with appropriate detail level

6. **Database Operations**
   - Use Prisma for all database operations
   - Structure complex queries with appropriate joins
   - Implement proper transaction handling for multi-step operations

7. **Payment Integration**
   - Always check provider PayPal connection status
   - Handle both marketplace and regular payment flows
   - Provide clear feedback on payment structure to users

By following these patterns, the codebase will maintain consistency and be easier to extend and maintain. 