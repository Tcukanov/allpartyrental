# Provider Service Locations

This document describes the implementation of the Provider Service Locations feature in the AllPartyRent platform.

## Overview

Provider Service Locations allow service providers to specify which cities they operate in or provide services to. This information is used to:

1. Filter search results based on the user's selected city
2. Display service availability to potential clients
3. Match providers with parties in specific locations

## Database Schema

### Current Implementation

The platform uses a dedicated junction table to track service locations:

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

### Service Location Logic

**Important:** Services are **not directly tied to cities**. Instead:

1. **Services belong to providers** - Each service has a `providerId` but no `cityId`
2. **Providers serve cities** - The `ProviderCity` table tracks which cities each provider serves
3. **Service availability** - A service is available in a city if its provider serves that city
4. **Location filtering** - When filtering services by city, the system finds all providers who serve that city, then returns their services

This design provides several benefits:
- Services are location-agnostic and can be offered in multiple cities
- Providers can easily manage their service areas without affecting individual services
- More efficient querying and better database normalization
- Simplified service creation (no need to specify city for each service)

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