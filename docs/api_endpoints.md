# API Endpoints

## Overview
This document outlines the API endpoints for the Service Marketplace for Party and Event Organization platform. The API follows RESTful principles and is implemented using Next.js API routes.

## Authentication Endpoints

### `/api/auth/[...nextauth]`
- **Description**: NextAuth.js authentication endpoints
- **Methods**: GET, POST
- **Functionality**: Handles login, logout, session management

### `/api/auth/register`
- **Method**: POST
- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "role": "CLIENT | PROVIDER"
  }
  ```
- **Response**: User object with token

## User Endpoints

### `/api/users/me`
- **Method**: GET
- **Description**: Get current user profile
- **Authentication**: Required
- **Response**: User object with profile

### `/api/users/me`
- **Method**: PUT
- **Description**: Update current user profile
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "name": "string",
    "avatar": "string",
    "phone": "string",
    "address": "string",
    "website": "string",
    "socialLinks": {}
  }
  ```
- **Response**: Updated user object

### `/api/users/:id`
- **Method**: GET
- **Description**: Get user by ID
- **Authentication**: Required (Admin only)
- **Response**: User object

### `/api/users/:id/block`
- **Method**: POST
- **Description**: Block a user
- **Authentication**: Required (Admin only)
- **Response**: Success message

## Calendar Endpoints

### `/api/calendar`
- **Method**: GET
- **Description**: Get user's calendar entries
- **Authentication**: Required (Client only)
- **Response**: Array of calendar entries

### `/api/calendar`
- **Method**: POST
- **Description**: Create a new calendar entry
- **Authentication**: Required (Client only)
- **Request Body**:
  ```json
  {
    "childName": "string",
    "birthDate": "date",
    "sendReminders": "boolean"
  }
  ```
- **Response**: Created calendar entry

### `/api/calendar/:id`
- **Method**: PUT
- **Description**: Update a calendar entry
- **Authentication**: Required (Client only)
- **Request Body**:
  ```json
  {
    "childName": "string",
    "birthDate": "date",
    "sendReminders": "boolean"
  }
  ```
- **Response**: Updated calendar entry

### `/api/calendar/:id`
- **Method**: DELETE
- **Description**: Delete a calendar entry
- **Authentication**: Required (Client only)
- **Response**: Success message

## Service Category Endpoints

### `/api/categories`
- **Method**: GET
- **Description**: Get all service categories
- **Response**: Array of categories

### `/api/categories/:id`
- **Method**: GET
- **Description**: Get category by ID
- **Response**: Category object

### `/api/categories`
- **Method**: POST
- **Description**: Create a new category
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```
- **Response**: Created category

## City Endpoints

### `/api/cities`
- **Method**: GET
- **Description**: Get all cities
- **Response**: Array of cities

### `/api/cities/:id`
- **Method**: GET
- **Description**: Get city by ID
- **Response**: City object

### `/api/cities`
- **Method**: POST
- **Description**: Create a new city
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```json
  {
    "name": "string",
    "slug": "string",
    "state": "string"
  }
  ```
- **Response**: Created city

## Service Endpoints

### `/api/services`
- **Method**: GET
- **Description**: Get all services with filtering
- **Query Parameters**:
  - `categoryId`: Filter by category
  - `cityId`: Filter by city
  - `search`: Search term
  - `minPrice`: Minimum price
  - `maxPrice`: Maximum price
  - `sort`: Sorting option
- **Response**: Array of services

### `/api/services/my`
- **Method**: GET
- **Description**: Get provider's services
- **Authentication**: Required (Provider only)
- **Response**: Array of services

### `/api/services/:id`
- **Method**: GET
- **Description**: Get service by ID
- **Response**: Service object

### `/api/services`
- **Method**: POST
- **Description**: Create a new service
- **Authentication**: Required (Provider only)
- **Request Body**:
  ```json
  {
    "categoryId": "string",
    "cityId": "string",
    "name": "string",
    "description": "string",
    "price": "number",
    "photos": ["string"]
  }
  ```
- **Response**: Created service

### `/api/services/:id`
- **Method**: PUT
- **Description**: Update a service
- **Authentication**: Required (Provider only)
- **Request Body**:
  ```json
  {
    "categoryId": "string",
    "name": "string",
    "description": "string",
    "price": "number",
    "photos": ["string"],
    "status": "ACTIVE | INACTIVE"
  }
  ```
- **Response**: Updated service

### `/api/services/:id`
- **Method**: DELETE
- **Description**: Delete a service
- **Authentication**: Required (Provider only)
- **Response**: Success message

## Party Endpoints

### `/api/parties`
- **Method**: GET
- **Description**: Get client's parties
- **Authentication**: Required (Client only)
- **Response**: Array of parties

### `/api/parties/:id`
- **Method**: GET
- **Description**: Get party by ID
- **Authentication**: Required
- **Response**: Party object with services and offers

### `/api/parties`
- **Method**: POST
- **Description**: Create a new party
- **Authentication**: Required (Client only)
- **Request Body**:
  ```json
  {
    "cityId": "string",
    "name": "string",
    "date": "date",
    "startTime": "string",
    "duration": "number",
    "guestCount": "number"
  }
  ```
- **Response**: Created party

### `/api/parties/:id`
- **Method**: PUT
- **Description**: Update a party
- **Authentication**: Required (Client only)
- **Request Body**:
  ```json
  {
    "name": "string",
    "date": "date",
    "startTime": "string",
    "duration": "number",
    "guestCount": "number",
    "status": "DRAFT | PUBLISHED | IN_PROGRESS | COMPLETED | CANCELLED"
  }
  ```
- **Response**: Updated party

### `/api/parties/:id/services`
- **Method**: POST
- **Description**: Add a service to a party
- **Authentication**: Required (Client only)
- **Request Body**:
  ```json
  {
    "serviceId": "string",
    "specificOptions": {}
  }
  ```
- **Response**: Created party service

### `/api/parties/:id/services/:serviceId`
- **Method**: PUT
- **Description**: Update a party service
- **Authentication**: Required (Client only)
- **Request Body**:
  ```json
  {
    "specificOptions": {}
  }
  ```
- **Response**: Updated party service

### `/api/parties/:id/services/:serviceId`
- **Method**: DELETE
- **Description**: Remove a service from a party
- **Authentication**: Required (Client only)
- **Response**: Success message

### `/api/parties/:id/publish`
- **Method**: POST
- **Description**: Publish a party to receive offers
- **Authentication**: Required (Client only)
- **Response**: Updated party

## Offer Endpoints

### `/api/offers`
- **Method**: GET
- **Description**: Get offers for provider
- **Authentication**: Required (Provider only)
- **Query Parameters**:
  - `status`: Filter by status
- **Response**: Array of offers

### `/api/offers/:id`
- **Method**: GET
- **Description**: Get offer by ID
- **Authentication**: Required
- **Response**: Offer object

### `/api/offers`
- **Method**: POST
- **Description**: Create a new offer
- **Authentication**: Required (Provider only)
- **Request Body**:
  ```json
  {
    "partyServiceId": "string",
    "price": "number",
    "description": "string",
    "photos": ["string"]
  }
  ```
- **Response**: Created offer

### `/api/offers/:id`
- **Method**: PUT
- **Description**: Update an offer
- **Authentication**: Required (Provider only)
- **Request Body**:
  ```json
  {
    "price": "number",
    "description": "string",
    "photos": ["string"]
  }
  ```
- **Response**: Updated offer

### `/api/offers/:id/approve`
- **Method**: POST
- **Description**: Approve an offer
- **Authentication**: Required (Client only)
- **Response**: Updated offer

### `/api/offers/:id/reject`
- **Method**: POST
- **Description**: Reject an offer
- **Authentication**: Required (Client only)
- **Response**: Updated offer

## Chat Endpoints

### `/api/chats`
- **Method**: GET
- **Description**: Get user's chats
- **Authentication**: Required
- **Response**: Array of chats

### `/api/chats/:id`
- **Method**: GET
- **Description**: Get chat by ID
- **Authentication**: Required
- **Response**: Chat object with messages

### `/api/chats/:id/messages`
- **Method**: POST
- **Description**: Send a message
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "content": "string"
  }
  ```
- **Response**: Created message

## Transaction Endpoints

### `/api/transactions`
- **Method**: GET
- **Description**: Get user's transactions
- **Authentication**: Required
- **Response**: Array of transactions

### `/api/transactions/:id`
- **Method**: GET
- **Description**: Get transaction by ID
- **Authentication**: Required
- **Response**: Transaction object

### `/api/transactions/:id/pay`
- **Method**: POST
- **Description**: Create payment for transaction
- **Authentication**: Required (Client only)
- **Request Body**:
  ```json
  {
    "paymentMethodId": "string"
  }
  ```
- **Response**: Updated transaction

### `/api/transactions/:id/arrived`
- **Method**: POST
- **Description**: Mark provider as arrived
- **Authentication**: Required (Provider only)
- **Response**: Updated transaction

### `/api/transactions/:id/confirm`
- **Method**: POST
- **Description**: Confirm provider arrival
- **Authentication**: Required (Client only)
- **Response**: Updated transaction

### `/api/transactions/:id/dispute`
- **Method**: POST
- **Description**: Create a dispute
- **Authentication**: Required (Client only)
- **Request Body**:
  ```json
  {
    "reason": "string",
    "description": "string"
  }
  ```
- **Response**: Created dispute

## Advertisement Endpoints

### `/api/advertisements`
- **Method**: GET
- **Description**: Get provider's advertisements
- **Authentication**: Required (Provider only)
- **Response**: Array of advertisements

### `/api/advertisements`
- **Method**: POST
- **Description**: Create a new advertisement
- **Authentication**: Required (Provider only)
- **Request Body**:
  ```json
  {
    "type": "HOMEPAGE | FIRST_WAVE",
    "startDate": "date",
    "endDate": "date"
  }
  ```
- **Response**: Created advertisement with payment intent

### `/api/advertisements/packages`
- **Method**: GET
- **Description**: Get available advertisement packages
- **Authentication**: Required (Provider only)
- **Response**: Array of packages

## Notification Endpoints

### `/api/notifications`
- **Method**: GET
- **Description**: Get user's notifications
- **Authentication**: Required
- **Response**: Array of notifications

### `/api/notifications/:id/read`
- **Method**: POST
- **Description**: Mark notification as read
- **Authentication**: Required
- **Response**: Updated notification

### `/api/notifications/read-all`
- **Method**: POST
- **Description**: Mark all notifications as read
- **Authentication**: Required
- **Response**: Success message

## Admin Endpoints

### `/api/admin/statistics`
- **Method**: GET
- **Description**: Get site-wide statistics
- **Authentication**: Required (Admin only)
- **Response**: Statistics object

### `/api/admin/users`
- **Method**: GET
- **Description**: Get all users with filtering
- **Authentication**: Required (Admin only)
- **Query Parameters**:
  - `role`: Filter by role
  - `search`: Search term
- **Response**: Array of users

### `/api/admin/transactions`
- **Method**: GET
- **Description**: Get all transactions with filtering
- **Authentication**: Required (Admin only)
- **Query Parameters**:
  - `status`: Filter by status
- **Response**: Array of transactions

### `/api/admin/disputes`
- **Method**: GET
- **Description**: Get all disputes
- **Authentication**: Required (Admin only)
- **Response**: Array of disputes

### `/api/admin/disputes/:id/resolve`
- **Method**: POST
- **Description**: Resolve a dispute
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```json
  {
    "resolution": "string",
    "refund": "boolean"
  }
  ```
- **Response**: Updated dispute

### `/api/admin/moderation/messages`
- **Method**: GET
- **Description**: Get flagged messages
- **Authentication**: Required (Admin only)
- **Response**: Array of flagged messages

### `/api/admin/advertising/settings`
- **Method**: GET
- **Description**: Get advertising settings
- **Authentication**: Required (Admin only)
- **Response**: Settings object

### `/api/admin/advertising/settings`
- **Method**: PUT
- **Description**: Update advertising settings
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```json
  {
    "homepageAdPrices": {
      "1": "number",
      "3": "number",
      "5": "number",
      "7": "number",
      "14": "number",
      "30": "number"
    },
    "firstWavePrices": {
      "weekly": "number",
      "monthly": "number"
    }
  }
  ```
- **Response**: Updated settings

## WebSocket Endpoints

### `/api/socket`
- **Description**: Socket.io connection for real-time features
- **Authentication**: Required
- **Events**:
  - `join:chat`: Join a chat room
  - `message:send`: Send a message
  - `message:received`: Receive a message
  - `notification:new`: New notification
  - `party:updated`: Party status updated
  - `offer:new`: New offer received
  - `offer:updated`: Offer status updated

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Error Codes
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `INTERNAL_ERROR`: Server error

## API Versioning
- API version is included in the URL path: `/api/v1/...`
- Current version is v1

## Rate Limiting
- API requests are rate-limited to prevent abuse
- Limit: 100 requests per minute per IP address

## Authentication
- JWT token must be included in the Authorization header
- Format: `Authorization: Bearer {token}`

## CORS
- Cross-Origin Resource Sharing is enabled for the frontend domain
