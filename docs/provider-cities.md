# Provider Service Locations

This document describes the implementation of the Provider Service Locations feature in the AllPartyRent platform.

## Overview

Provider Service Locations allow service providers to specify which cities they operate in or provide services to. This information is used to:

1. Filter search results based on the user's selected city
2. Display service availability to potential clients
3. Match providers with parties in specific locations

## Database Schema

### Previous Implementation (Before Version 1.0)

The initial implementation used **placeholder services** to track service locations:

- A placeholder service was created for each city a provider operates in
- These services were marked as `INACTIVE` to prevent them from appearing in search results
- The service names were prefixed with `LOCATION_PLACEHOLDER_` or `Placeholder Service for`
- The `cityId` field referenced the city the provider operates in

This approach had several drawbacks:
- It used the `Service` table for something it wasn't designed for
- It created unnecessary records in the database
- It made querying provider locations more complex

### Current Implementation (Version 1.0+)

The current implementation uses a dedicated junction table to track service locations:

```prisma
model ProviderCity {
  id          String   @id @default(cuid())
  providerId  String
  cityId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  provider    Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  city        City     @relation(fields: [cityId], references: [id], onDelete: Cascade)

  @@unique([providerId, cityId])
}
```

This provides several benefits:
- Cleaner database design with proper relationships
- More efficient querying of provider locations
- Simplified API endpoints for managing locations

## API Endpoints

### Get Provider Cities

**Endpoint:** `GET /api/provider/cities`

**Description:** Retrieves all cities a provider operates in.

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "city-id-1",
      "name": "New York",
      "state": "NY",
      "slug": "new-york",
      "providerCityId": "provider-city-id-1"
    },
    {
      "id": "city-id-2",
      "name": "Los Angeles",
      "state": "CA",
      "slug": "los-angeles",
      "providerCityId": "provider-city-id-2"
    }
  ]
}
```

### Add Provider City

**Endpoint:** `POST /api/provider/cities`

**Request Body:**
```json
{
  "cityId": "city-id"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Service location added successfully",
  "data": {
    "city": {
      "id": "city-id",
      "name": "City Name",
      "state": "State",
      "slug": "city-slug"
    },
    "providerCityId": "provider-city-id"
  }
}
```

### Remove Provider City

**Endpoint:** `DELETE /api/provider/cities/:id`

**Description:** Removes a city from a provider's service locations. The `:id` parameter is the city ID.

**Response Format:**
```json
{
  "success": true,
  "message": "Service location removed successfully",
  "data": {
    "city": {
      "id": "city-id",
      "name": "City Name",
      "state": "State",
      "slug": "city-slug"
    }
  }
}
```

## Migration

A migration script is provided to convert existing placeholder services to the new ProviderCity model:

```bash
node scripts/migrate-provider-cities.js
```

This script:
1. Finds all providers in the database
2. For each provider, locates all placeholder services with a cityId
3. Creates corresponding ProviderCity records
4. Provides a summary of the migration process

## Frontend Implementation

The Provider Cabinet page includes a "Service Locations" tab where providers can:
- View their current service locations
- Add new service locations
- Remove existing service locations

The implementation handles caching of location data in both localStorage and sessionStorage for improved performance and offline capabilities.

## Error Handling

The API endpoints include robust error handling for various scenarios:
- Unauthorized access attempts
- Missing provider record
- Attempting to remove a city with active services
- Database errors during operations
- Duplicate city entries

## Debugging

API endpoints include detailed logging to facilitate debugging:
- Session status and user role
- Provider identification
- Database operation results
- Error details with stack traces when available

## Future Improvements

Potential future improvements for the service locations feature:
1. Add ability to specify service radius around cities
2. Implement bulk addition/removal of service locations
3. Allow specifying different pricing per location
4. Add geolocation-based automatic suggestions
5. Integrate with maps API for visual representation of service areas 