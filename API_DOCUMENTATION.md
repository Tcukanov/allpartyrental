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

## Transactions

### GET /transactions
Gets transactions for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (PENDING, PAID, etc.)
- `page`: Page number for pagination
- `limit`: Results per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "transaction-id",
      "amount": 100,
      "status": "PENDING",
      "createdAt": "2023-06-01T12:00:00.000Z",
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
        "name": "Provider Name"
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

### POST /transactions
Creates a new transaction.

**Request Body:**
```json
{
  "serviceId": "service-id",
  "partyId": "party-id",
  "amount": 100,
  "description": "Payment for service"
}
```

**Response:**
```json
{
  "id": "new-transaction-id",
  "serviceId": "service-id",
  "partyId": "party-id",
  "amount": 100,
  "status": "PENDING",
  "description": "Payment for service"
}
```

### GET /transactions/[id]
Gets a specific transaction by ID.

**Response:**
```json
{
  "id": "transaction-id",
  "amount": 100,
  "status": "PENDING",
  "createdAt": "2023-06-01T12:00:00.000Z",
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
    "name": "Provider Name"
  }
}
```

### POST /transactions/[id]/pay
Processes payment for a transaction.

**Request Body:**
```json
{
  "paymentMethod": "CREDIT_CARD",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "cvc": "123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "status": "PAID",
  "message": "Payment processed successfully"
}
```

### POST /transactions/[id]/approve
Approves a transaction (provider confirms service completion).

**Response:**
```json
{
  "success": true,
  "status": "COMPLETED",
  "message": "Transaction approved successfully"
}
```

### POST /transactions/[id]/decline
Declines a transaction.

**Response:**
```json
{
  "success": true,
  "status": "DECLINED",
  "message": "Transaction declined successfully"
}
```

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