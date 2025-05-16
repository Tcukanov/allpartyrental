# AllPartyRent AI Coding Guide

This document provides technical details about the AllPartyRent codebase specifically designed to help AI systems understand the architecture and generate appropriate code.

## Architecture Overview

The application follows a hybrid rendering approach with Next.js App Router:
- Server components for data fetching and initial rendering
- Client components (marked with "use client") for interactive elements
- API routes using Next.js API route handlers

## File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   ├── [location]/         # Dynamic city/category routes
│   │   └── [service]/      # Service category within location
│   ├── services/           # Services browsing pages
│   ├── admin/              # Admin dashboard
│   ├── provider/           # Provider dashboard
│   └── client/             # Client dashboard
├── components/             # Reusable React components
│   ├── layout/             # Layout components
│   ├── ui/                 # UI components
│   ├── services/           # Service-related components
│   └── payment/            # Payment-related components
├── lib/                    # Utility libraries
│   ├── auth/               # Authentication utilities
│   ├── prisma/             # Database client
│   ├── cities/             # City-related utilities
│   └── notifications/      # Notification utilities
└── prisma/                 # Prisma schema and migrations
    ├── schema.prisma       # Database schema
    └── migrations/         # Database migrations
```

## Key Naming Conventions

1. **Files**:
   - React components use PascalCase (e.g., `ServiceCard.tsx`)
   - Utility files use kebab-case (e.g., `default-city.ts`)
   - API route files named `route.ts` in appropriate directories

2. **Components**:
   - Component names match their filenames
   - Page components are typically named `Page` or include the word "Page"
   - Client components are marked with `"use client"` directive

3. **Functions**:
   - HTTP methods in API routes (GET, POST, PUT, DELETE)
   - Utility functions use camelCase
   - React event handlers prefixed with `handle` (e.g., `handleSubmit`)

4. **Variables**:
   - State variables use camelCase
   - Constants use UPPER_SNAKE_CASE for global constants

## Common Patterns

### API Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Data fetching
    const data = await prisma.someModel.findMany();
    
    // Return success response
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Error message',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}
```

### Server Component Pattern

```typescript
import React from 'react';
import { prisma } from '@/lib/prisma/client';
import ClientComponent from './client-component';

export default async function ServerComponent({ params }) {
  // Data fetching in server component
  const data = await prisma.someModel.findMany();
  
  // Render client component with data
  return <ClientComponent initialData={data} />;
}
```

### Client Component Pattern

```typescript
"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

export default function ClientComponent({ initialData }) {
  const toast = useToast();
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/some-endpoint');
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Component JSX
  return (
    // UI implementation
  );
}
```

### Filter Pattern Implementation

The project implements a consistent filtering pattern across browsing pages:

```typescript
// Top Filter Bar
<Box mt={6} bg="white" p={4} borderRadius="lg" boxShadow="md">
  <Flex w="full" wrap="wrap" gap={4}>
    {/* Search input */}
    <Box flex="1" minW="200px">
      <Text fontWeight="medium" mb={2}>Search</Text>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input 
          placeholder="Search services..." 
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </InputGroup>
    </Box>
    
    {/* Other basic filters */}
  </Flex>
</Box>

// Left Sidebar with Additional Filters
<Flex mt={6} gap={6} flexDirection={{ base: "column", md: "row" }}>
  {/* Left Sidebar with Additional Filters */}
  <Box w={{ base: "100%", md: "300px" }} flexShrink={0}>
    <Box bg="white" p={4} borderRadius="lg" boxShadow="md">
      <Heading as="h3" size="md" mb={4}>Additional Filters</Heading>
      
      <VStack spacing={4} align="stretch">
        {/* Dynamic filter rendering */}
      </VStack>
    </Box>
  </Box>
  
  {/* Content Area */}
  <Box flex="1">
    {/* Results Grid */}
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {/* Items */}
    </SimpleGrid>
  </Box>
</Flex>
```

### Database Models and Relationships

Key models and relationships to be aware of:

- `User` - Base user model (linked to Provider)
- `Provider` - Provider profile (has many ProviderCity locations)
- `ProviderCity` - Junction table between Provider and City
- `City` - Location model (used by services and parties)
- `Service` - Service listing (belongs to Provider and Category)
- `ServiceCategory` - Category for services (has many Services)
- `Party` - Event planned by Client (belongs to City)
- `Transaction` - Payment record

## TypeScript Types

Common types used throughout the codebase:

```typescript
// City type
type City = {
  id: string;
  name: string;
  slug: string;
  state: string;
  isDefault?: boolean;
};

// Category type
type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

// Service type
type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  photos: string[];
  colors?: string[];
  provider: {
    name: string;
    profile?: {
      address?: string;
      isProStatus?: boolean;
    };
  };
  city?: City;
};

// Filter type
type Filter = {
  id: string;
  name: string;
  type: string;
  options: string[];
  iconUrl?: string;
};
```

## Common API Endpoints

- `GET /api/cities` - List all cities
- `GET /api/categories` - List all categories
- `GET /api/services/public` - List services with filtering
- `GET /api/categories/filters` - Get filters for a category

## Important Default Values

- Default city is stored in SystemSettings with key `default_city_id`
- Default sorting order is by price in ascending order
- Default grid layouts: 1 column on mobile, 2 on tablet, 3-4 on desktop

## Error Handling

Standard error pattern:

```typescript
try {
  // Operation
} catch (error) {
  console.error('Error context:', error);
  
  // For API routes
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        message: 'User-friendly error message',
        details: error instanceof Error ? error.message : 'Unknown error'
      } 
    },
    { status: 500 }
  );
  
  // For client components
  toast({
    title: 'Error',
    description: 'User-friendly error message',
    status: 'error',
    duration: 3000,
    isClosable: true,
  });
}
```

## Performance Considerations

- Use server components for initial data fetching
- Client-side filtering for quick UI feedback
- Lazy loading for images using Next.js Image component
- Paginate large data sets when appropriate
- Cache API responses when feasible

## Mock Data and Testing

### IMPORTANT: Rules for Development and Testing

1. **No Hardcoded Mock Data**: Never use hardcoded mock data directly in the codebase. All test data should be configurable through environment variables or specific test configurations.

2. **Sandbox over Mocks**: Always prefer using real sandbox environments (PayPal Sandbox, etc.) instead of creating mock implementations. This ensures testing is done in conditions that match production as closely as possible.

3. **Environment Variables**: Use environment variables to control all external service configurations. For example:
   ```
   PAYPAL_MODE=sandbox
   PAYPAL_SANDBOX_CLIENT_ID=your_sandbox_client_id
   PAYPAL_SANDBOX_CLIENT_SECRET=your_sandbox_client_secret
   ```

4. **Conditional Logic**: If sandbox environments aren't available, use environment-based flags to determine behavior:
   ```typescript
   // CORRECT approach
   if (process.env.NODE_ENV === 'development' && !process.env.PAYPAL_SANDBOX_CLIENT_ID) {
     console.warn('Using fallback sandbox configuration. Add real sandbox credentials for complete testing.');
     // Use sandbox fallback logic
   }
   
   // INCORRECT approach - Do NOT do this
   if (isDevelopment) {
     return mockPaypalResponse(); // Hardcoded mock - NOT ALLOWED
   }
   ```

5. **Testing in Development**:
   - Always create proper sandbox accounts for testing integrations
   - Never use production credentials in development environments
   - Document all sandbox testing procedures in appropriate README files

By following these patterns and conventions, you'll generate code that integrates seamlessly with the existing AllPartyRent platform. 