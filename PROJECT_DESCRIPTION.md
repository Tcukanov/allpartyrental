# AllPartyRental Platform Documentation

## Project Overview

READ THIS FILE BEFORE ANY REPOSNE OR CODE WRITING.
npx prisma migrate dev do not use instead use push.
ONLY USE RAW QUERY WORKING WITH PRISMA.

AllPartyRental is a marketplace platform that connects party equipment/service providers with clients looking to rent party supplies and services. The platform allows providers to list their services and clients to find, compare, and book party rentals in their area.

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, Chakra UI
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Deployment**: Vercel
- **Payment Processing**: Stripe (with escrow functionality)

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

4. **Bookings**
   - Party planning
   - Service requests
   - Quotes/Offers from providers
   - Transactions and payments

5. **Location System**
   - City management with default city support
   - Provider service areas
   - Location-based service discovery

## Key Routes & Pages

- `/` - Home page
- `/services` - Browse all services with filters
- `/services/[id]` - Individual service details
- `/[location]/[service]` - Browse services by location and category
- `/admin/*` - Admin dashboard routes
- `/provider/*` - Provider dashboard routes
- `/client/*` - Client dashboard routes

## Database Schema

Key models include:
- `User` - Base user model with authentication
- `Provider` - Provider profile information
- `Service` - Service listings
- `ServiceCategory` - Categories for services
- `ServiceAddon` - Add-ons for services
- `City` - Location information
- `ProviderCity` - Junction table for provider service areas
- `Party` - Client party planning data
- `Transaction` - Payment transactions

## API Structure

- `/api/services/*` - Service management endpoints
- `/api/cities/*` - City management endpoints
- `/api/categories/*` - Category management endpoints
- `/api/admin/*` - Admin-only endpoints
- `/api/provider/*` - Provider-only endpoints
- `/api/client/*` - Client-only endpoints
- `/api/transactions/*` - Transaction processing endpoints

## Frontend Components

The UI is built with Chakra UI and follows these design patterns:
- Page components in `/app` directory following Next.js app router structure
- Server components for data fetching and initial rendering
- Client components for interactive UI elements
- Consistent filter UI pattern across service listing pages

## Code Organization

1. **Server-Side Components**
   - Handle data fetching
   - Prepare data for client components
   - Provide metadata for SEO

2. **Client-Side Components**
   - Handle user interactions
   - Manage state
   - Fetch additional data via API routes

3. **API Routes**
   - Follow RESTful patterns
   - Include authentication checks
   - Return standardized response formats
   
## Filter System

The platform uses a consistent filtering pattern across service browsing pages:
- Top filter bar: Basic search and sorting options
- Left sidebar: Category-specific additional filters
- Dynamic filter generation based on category metadata

## Authentication

- NextAuth.js handles authentication
- Role-based access control (client, provider, admin)
- Protected API routes and pages

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

2. **Component Structure**
   - Server components fetch initial data
   - Client components handle interactions
   - Separate business logic from UI

3. **Filtering Pattern**
   - Filters at the top bar
   - More complex filters in the left sidebar
   - Results in a responsive grid

4. **Error Handling**
   - Wrap API calls in try/catch blocks
   - Provide meaningful error messages
   - Log errors with appropriate detail level

5. **Database Operations**
   - Use Prisma for all database operations
   - Structure complex queries with appropriate joins
   - Implement proper transaction handling for multi-step operations

By following these patterns, the codebase will maintain consistency and be easier to extend and maintain. 