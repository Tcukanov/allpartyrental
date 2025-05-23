# All Party Rent API Documentation

This document provides details for testing the All Party Rent API endpoints. Use this as a reference when setting up your Postman collection.

## Table of Contents
- [Authentication](#authentication)
- [Services](#services)
- [Users](#users)
- [Parties](#parties)
- [Offers](#offers)
- [Chat](#chat)
- [Notifications](#notifications)
- [Transactions](#transactions)
- [Categories & Cities](#categories--cities)
- [Email Configuration](#email-configuration)

## Base URL

For local development:
```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using Next-Auth session cookies. To ensure your requests are authenticated:

1. Log in through the web interface
2. Ensure cookies are being sent with your requests in Postman

Authentication-specific endpoints:

### POST /auth/register
Creates a new user account.

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "role": "CLIENT" // or "PROVIDER"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "CLIENT"
  }
}
```

### POST /auth/check-account
Checks if an email is already registered.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "exists": true,
  "role": "CLIENT"
}
```

## Services

### GET /services
Returns a list of services with optional filtering.

**Query Parameters:**
- `categoryId`: Filter by category ID
- `cityId`: Filter by city ID
- `search`: Search term for service name/description
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `sort`: Sorting option (price_asc, price_desc, newest)
- `page`: Page number for pagination (default: 1)
- `limit`: Results per page (default: 10)
- `exclude`: Service ID to exclude from results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "service-id",
      "name": "Service Name",
      "description": "Service description",
      "price": 100,
      "provider": {
        "id": "provider-id",
        "name": "Provider Name"
      },
      "category": {
        "id": "category-id",
        "name": "Category Name"
      },
      "city": {
        "id": "city-id",
        "name": "City Name"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### POST /services
Creates a new service. Requires provider authentication.

**Request Body:**
```json
{
  "name": "New Service",
  "description": "Service description",
  "price": 100,
  "categoryId": "category-id",
  "cityId": "city-id",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "id": "new-service-id",
  "name": "New Service",
  "description": "Service description",
  "price": 100,
  "categoryId": "category-id",
  "cityId": "city-id",
  "status": "ACTIVE",
  "providerId": "provider-id",
  "category": {
    "id": "category-id",
    "name": "Category Name"
  },
  "city": {
    "id": "city-id",
    "name": "City Name"
  }
}
```

### GET /services/[id]
Gets a specific service by ID.

**Response:**
```json
{
  "id": "service-id",
  "name": "Service Name",
  "description": "Service description",
  "price": 100,
  "provider": {
    "id": "provider-id",
    "name": "Provider Name"
  },
  "category": {
    "id": "category-id",
    "name": "Category Name"
  },
  "city": {
    "id": "city-id",
    "name": "City Name"
  }
}
```

### PUT /services/[id]
Updates a service. Requires provider authentication and ownership.

**Request Body:**
```json
{
  "name": "Updated Service Name",
  "description": "Updated description",
  "price": 120
}
```

**Response:**
```json
{
  "id": "service-id",
  "name": "Updated Service Name",
  "description": "Updated description",
  "price": 120,
  "providerId": "provider-id"
}
```

### DELETE /services/[id]
Deletes a service. Requires provider authentication and ownership.

**Response:**
```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

### GET /services/my
Gets services owned by the authenticated provider.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "service-id",
      "name": "Service Name",
      "price": 100
    }
  ]
}
```

## Users

### GET /users/me
Gets the profile of the currently authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "CLIENT",
    "profile": {
      "avatar": "avatar-url",
      "phone": "1234567890",
      "address": "User address",
      "website": "https://example.com",
      "socialLinks": []
    }
  }
}
```

### PUT /users/me
Updates the profile of the currently authenticated user.

**Request Body:**
```json
{
  "name": "Updated Name",
  "avatar": "updated-avatar-url",
  "phone": "9876543210",
  "address": "Updated address",
  "website": "https://updated-example.com",
  "socialLinks": ["https://twitter.com/user"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "Updated Name",
    "email": "user@example.com",
    "role": "CLIENT",
    "profile": {
      "avatar": "updated-avatar-url",
      "phone": "9876543210",
      "address": "Updated address",
      "website": "https://updated-example.com",
      "socialLinks": ["https://twitter.com/user"]
    }
  }
}
```

## Parties

### GET /parties
Gets a list of parties with optional filtering.

**Query Parameters:**
- `status`: Filter by status (DRAFT, PUBLISHED, etc.)
- `page`: Page number for pagination
- `limit`: Results per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "party-id",
      "title": "Party Name",
      "description": "Party description",
      "date": "2023-12-31T20:00:00.000Z",
      "status": "PUBLISHED",
      "services": [
        {
          "id": "service-id",
          "name": "Service Name"
        }
      ]
    }
  ],
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

### POST /parties
Creates a new party. Requires client authentication.

**Request Body:**
```json
{
  "title": "New Party",
  "description": "Party description",
  "date": "2023-12-31T20:00:00.000Z",
  "location": "Party location",
  "status": "DRAFT"
}
```

**Response:**
```json
{
  "id": "new-party-id",
  "title": "New Party",
  "description": "Party description",
  "date": "2023-12-31T20:00:00.000Z",
  "location": "Party location",
  "status": "DRAFT",
  "clientId": "client-id"
}
```

### GET /parties/[id]
Gets a specific party by ID.

**Response:**
```json
{
  "id": "party-id",
  "title": "Party Name",
  "description": "Party description",
  "date": "2023-12-31T20:00:00.000Z",
  "location": "Party location",
  "status": "PUBLISHED",
  "client": {
    "id": "client-id",
    "name": "Client Name"
  },
  "services": [
    {
      "id": "service-id",
      "name": "Service Name",
      "price": 100
    }
  ]
}
```

### PUT /parties/[id]
Updates a party. Requires client authentication and ownership.

**Request Body:**
```json
{
  "title": "Updated Party Name",
  "description": "Updated description",
  "date": "2024-01-01T20:00:00.000Z"
}
```

**Response:**
```json
{
  "id": "party-id",
  "title": "Updated Party Name",
  "description": "Updated description",
  "date": "2024-01-01T20:00:00.000Z",
  "clientId": "client-id"
}
```

### POST /parties/[id]/verify
Verifies a party. Used for admin verification.

**Response:**
```json
{
  "success": true,
  "message": "Party verified successfully"
}
```

## Offers

### GET /offers
Gets a list of offers for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "offer-id",
      "status": "PENDING",
      "service": {
        "id": "service-id",
        "name": "Service Name"
      },
      "party": {
        "id": "party-id",
        "title": "Party Title"
      }
    }
  ]
}
```

### POST /offers
Creates a new offer.

**Request Body:**
```json
{
  "serviceId": "service-id",
  "partyId": "party-id",
  "price": 100,
  "message": "Offer message"
}
```

**Response:**
```json
{
  "id": "new-offer-id",
  "serviceId": "service-id",
  "partyId": "party-id",
  "price": 100,
  "status": "PENDING",
  "message": "Offer message"
}
```

### GET /offers/[id]
Gets a specific offer by ID.

**Response:**
```json
{
  "id": "offer-id",
  "serviceId": "service-id",
  "partyId": "party-id",
  "price": 100,
  "status": "PENDING",
  "message": "Offer message",
  "service": {
    "id": "service-id",
    "name": "Service Name"
  },
  "party": {
    "id": "party-id",
    "title": "Party Title"
  }
}
```

### PUT /offers/[id]
Updates an offer.

**Request Body:**
```json
{
  "price": 120,
  "message": "Updated offer message"
}
```

**Response:**
```json
{
  "id": "offer-id",
  "price": 120,
  "message": "Updated offer message",
  "status": "PENDING"
}
```

### POST /offers/[id]/approve
Approves an offer.

**Response:**
```json
{
  "success": true,
  "status": "APPROVED",
  "message": "Offer approved successfully"
}
```

### POST /offers/[id]/reject
Rejects an offer.

**Response:**
```json
{
  "success": true,
  "status": "REJECTED",
  "message": "Offer rejected successfully"
}
```

## Chat

### GET /chats
Gets a list of chats for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chat-id",
      "participants": [
        {
          "id": "user-id",
          "name": "User Name"
        }
      ],
      "lastMessage": {
        "content": "Message content",
        "createdAt": "2023-06-01T12:00:00.000Z"
      },
      "unreadCount": 2
    }
  ]
}
```

### POST /chats
Creates a new chat.

**Request Body:**
```json
{
  "participantIds": ["user-id-1", "user-id-2"],
  "initialMessage": "Hello, I'm interested in your service."
}
```

**Response:**
```json
{
  "id": "new-chat-id",
  "participants": [
    {
      "id": "user-id-1",
      "name": "User 1"
    },
    {
      "id": "user-id-2",
      "name": "User 2"
    }
  ],
  "messages": [
    {
      "id": "message-id",
      "content": "Hello, I'm interested in your service.",
      "senderId": "user-id-1",
      "createdAt": "2023-06-01T12:00:00.000Z"
    }
  ]
}
```

### GET /chats/[id]
Gets a specific chat by ID.

**Response:**
```json
{
  "id": "chat-id",
  "participants": [
    {
      "id": "user-id-1",
      "name": "User 1"
    },
    {
      "id": "user-id-2",
      "name": "User 2"
    }
  ],
  "messages": [
    {
      "id": "message-id",
      "content": "Message content",
      "senderId": "user-id-1",
      "createdAt": "2023-06-01T12:00:00.000Z"
    }
  ]
}
```

### POST /chats/[id]
Sends a message to a specific chat.

**Request Body:**
```json
{
  "content": "New message content"
}
```

**Response:**
```json
{
  "id": "new-message-id",
  "content": "New message content",
  "senderId": "user-id",
  "chatId": "chat-id",
  "createdAt": "2023-06-01T12:00:00.000Z"
}
```

## Notifications

### GET /notifications
Gets notifications for the authenticated user.

**Query Parameters:**
- `page`: Page number for pagination
- `limit`: Results per page
- `status`: Filter by status (READ, UNREAD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification-id",
      "type": "OFFER_APPROVED",
      "content": "Your offer has been approved",
      "read": false,
      "createdAt": "2023-06-01T12:00:00.000Z",
      "entityId": "offer-id",
      "entityType": "OFFER"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

### POST /notifications/[id]/read
Marks a notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### POST /notifications/read-all
Marks all notifications as read.

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "count": 5
}
```

## Transactions & Payments (PayPal Marketplace)

AllPartyRent uses **PayPal Marketplace** for automated payment processing with commission splitting.

### Payment Flow Overview
1. **Client Payment**: Clients pay via PayPal credit card forms
2. **Automatic Splitting**: PayPal splits payments between provider and platform
3. **Instant Payouts**: Connected providers receive money immediately
4. **Commission Handling**: Platform commission deducted automatically

### POST /payments/create
Creates a PayPal payment order with marketplace splitting.

**Request Body:**
```json
{
  "serviceId": "service-id",
  "bookingDate": "2024-01-15",
  "hours": 4
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "paypal-order-id",
  "transactionId": "transaction-id",
  "offerId": "offer-id",
  "amount": 105.00,
  "isMarketplacePayment": true,
  "breakdown": {
    "servicePrice": 100.00,
    "clientPays": 105.00,
    "providerReceives": 88.00,
    "platformCommission": 17.00
  }
}
```

### POST /payments/capture
Captures a PayPal payment and processes commission splitting.

**Request Body:**
```json
{
  "orderId": "paypal-order-id"
}
```

**Response:**
```json
{
  "success": true,
  "captureId": "paypal-capture-id",
  "transactionId": "transaction-id",
  "amountReceived": 105.00,
  "platformCommission": 17.00,
  "providerPayment": 88.00,
  "isMarketplacePayment": true
}
```

### GET /transactions
Gets transactions for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (PENDING_PAYMENT, PAID_PENDING_PROVIDER_ACCEPTANCE, COMPLETED, etc.)
- `page`: Page number for pagination
- `limit`: Results per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "transaction-id",
      "amount": 100.00,
      "status": "PAID_PENDING_PROVIDER_ACCEPTANCE",
      "clientFeePercent": 5.0,
      "providerFeePercent": 12.0,
      "isMarketplacePayment": true,
      "paymentIntentId": "paypal-order-id",
      "paymentMethodId": "paypal-capture-id",
      "createdAt": "2023-06-01T12:00:00.000Z",
      "offer": {
        "id": "offer-id",
        "price": 100.00,
        "service": {
          "id": "service-id",
          "name": "Service Name"
        },
        "client": {
          "id": "client-id",
          "name": "Client Name"
        },
        "provider": {
          "id": "provider-id",
          "name": "Provider Name",
          "paypalOnboardingComplete": true
        }
      }
    }
  ],
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

### GET /transactions/[id]
Gets a specific transaction by ID.

**Response:**
```json
{
  "id": "transaction-id",
  "amount": 100.00,
  "status": "COMPLETED",
  "clientFeePercent": 5.0,
  "providerFeePercent": 12.0,
  "isMarketplacePayment": true,
  "paymentIntentId": "paypal-order-id",
  "paymentMethodId": "paypal-capture-id",
  "createdAt": "2023-06-01T12:00:00.000Z",
  "offer": {
    "id": "offer-id",
    "price": 100.00,
    "description": "Booking for Service Name on 2024-01-15",
    "service": {
      "id": "service-id",
      "name": "Service Name"
    },
    "client": {
      "id": "client-id",
      "name": "Client Name"
    },
    "provider": {
      "id": "provider-id",
      "name": "Provider Name",
      "paypalMerchantId": "provider-paypal-merchant-id",
      "paypalOnboardingComplete": true
    }
  }
}
```

### POST /bookings/accept
Provider accepts a booking (completes the transaction).

**Request Body:**
```json
{
  "transactionId": "transaction-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking accepted successfully",
  "isMarketplacePayment": true,
  "status": "COMPLETED"
}
```

### Provider PayPal Integration

### GET /provider/paypal-status
Gets provider's PayPal connection status.

**Response:**
```json
{
  "success": true,
  "data": {
    "businessName": "Provider Business Name",
    "paypalMerchantId": "provider-merchant-id",
    "paypalOnboardingComplete": true,
    "paypalStatus": "COMPLETED"
  }
}
```

### POST /provider/paypal-onboard
Starts PayPal onboarding process for providers.

**Request Body:**
```json
{
  "returnUrl": "https://yoursite.com/provider/settings/payments?onboarding=complete"
}
```

**Response:**
```json
{
  "success": true,
  "onboardingUrl": "https://www.sandbox.paypal.com/webapps/merchantboarding/webflow/externalpartnerflow?token=...",
  "message": "Redirect to PayPal to complete onboarding"
}
```

### Payment Structure

**For $100 Service:**
```
Client Pays: $105.00 (service + 5% client fee)
├── Provider Gets: $88.00 (service - 12% commission) [INSTANT via marketplace]
└── Platform Keeps: $17.00 (12% commission + 5% client fee)
```

**Transaction Statuses:**
- `PENDING_PAYMENT` - Waiting for client payment
- `PAID_PENDING_PROVIDER_ACCEPTANCE` - Payment received, waiting for provider to accept
- `COMPLETED` - Provider accepted, transaction complete
- `CANCELLED` - Transaction cancelled
- `REFUNDED` - Payment refunded

## Categories & Cities

### GET /categories
Gets a list of service categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "category-id",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description"
    }
  ]
}
```

### GET /categories/[slug]
Gets a specific category by slug.

**Response:**
```json
{
  "id": "category-id",
  "name": "Category Name",
  "slug": "category-slug",
  "description": "Category description"
}
```

### GET /cities
Gets a list of cities.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "city-id",
      "name": "City Name",
      "slug": "city-slug",
      "state": "State",
      "country": "Country"
    }
  ]
}
```

### GET /cities/[slug]
Gets a specific city by slug.

**Response:**
```json
{
  "id": "city-id",
  "name": "City Name",
  "slug": "city-slug",
  "state": "State",
  "country": "Country"
}
```

## Email Configuration

The application includes email functionality for features like user verification and password resets. See the [Email Configuration Guide](./docs/email-config.md) for detailed setup instructions.

### POST /auth/verify-email
Verifies a user's email using a verification token.

**Query Parameters:**
- `token`: The verification token sent to the user's email

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### POST /auth/resend-verification
Resends a verification email to the user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

In development mode, the response will also include:
```json
{
  "verificationLink": "http://localhost:3000/auth/verify-email?token=verification-token",
  "token": "verification-token"
}
```

## Testing Tips

1. **Authentication**: First test the authentication flow (registration or login) and ensure your Postman session is authenticated.
2. **Order of Testing**: Test in this order: Categories/Cities → Services → Parties → Offers → Transactions → Notifications.
3. **Environment Variables**: Set up environment variables in Postman for:
   - `baseUrl` (e.g., http://localhost:3000/api)
   - `serviceId`, `categoryId`, `cityId`, etc. after creating or fetching them
4. **Collection Variables**: Save IDs of created resources to use in subsequent requests.
5. **Tests**: Add tests to Postman requests to validate responses.
6. **Environment Setup**: Consider setting up a separate testing environment in your database.

## Example Postman Test Flows

### Provider Flow
1. Register as a provider
2. Get categories and cities
3. Create a service
4. View incoming offers
5. Approve an offer
6. Check transactions and approve completion
7. View notifications

### Client Flow
1. Register as a client
2. Browse categories and services
3. Create a party
4. Add services to party
5. Create offers for providers
6. Process payment for approved offers
7. Check notifications

## Troubleshooting

If you encounter 401 Unauthorized errors, check:
- You are properly logged in and cookies are being sent
- Your session hasn't expired
- You have the correct permissions for the action 