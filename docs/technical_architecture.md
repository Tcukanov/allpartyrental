# Technical Architecture

## Overview
This document outlines the technical architecture for the Service Marketplace for Party and Event Organization platform. The architecture follows modern best practices for building scalable, maintainable web applications.

## Technology Stack
- **Frontend**: Next.js with TypeScript
- **Backend**: Next.js API routes (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **UI Framework**: ChakraUI
- **Authentication**: NextAuth.js with JWT and Google OAuth
- **State Management**: React Context API and SWR for data fetching
- **Drag-and-Drop**: react-dnd
- **Payment Processing**: Stripe with custom escrow logic
- **Real-time Communication**: Socket.io for chat and notifications
- **AI Moderation**: OpenAI API for content moderation

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Pages    │  │  Components │  │      API Routes         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │
│  │   Auth      │  │  Payment    │  │ Notification│  │  Chat  │  │
│  │  Service    │  │  Service    │  │  Service    │  │ Service│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Prisma ORM                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────────┘
```

## Application Structure
```
/party-marketplace/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Common UI elements
│   │   ├── layout/          # Layout components
│   │   ├── client/          # Client-specific components
│   │   ├── provider/        # Provider-specific components
│   │   ├── admin/           # Admin-specific components
│   │   └── configurator/    # Party configurator components
│   ├── pages/               # Next.js pages
│   │   ├── api/             # API routes
│   │   ├── [city]/          # City-specific routes
│   │   ├── client/          # Client dashboard pages
│   │   ├── provider/        # Provider dashboard pages
│   │   └── admin/           # Admin panel pages
│   ├── lib/                 # Utility functions and libraries
│   │   ├── prisma/          # Prisma client and schema
│   │   ├── auth/            # Authentication utilities
│   │   ├── payment/         # Payment processing utilities
│   │   └── ai/              # AI moderation utilities
│   ├── hooks/               # Custom React hooks
│   ├── context/             # React context providers
│   ├── styles/              # Global styles
│   └── types/               # TypeScript type definitions
├── prisma/                  # Prisma schema and migrations
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
└── docs/                    # Project documentation
```

## Key Architectural Components

### Next.js with API Routes
The application will use Next.js as a full-stack framework, leveraging its API routes feature to build backend functionality. This approach simplifies deployment and allows for server-side rendering where appropriate.

### Authentication Flow
1. User signs up/logs in via email/password or Google OAuth
2. NextAuth.js handles authentication and creates a session
3. JWT token is issued and stored in cookies
4. Protected routes check for valid session
5. Role-based access control determines available features

### Database Access
All database access will be through Prisma ORM, which provides type-safe database queries and migrations. The database schema will be defined in the Prisma schema file.

### City-based Routing
The application will use dynamic routes with the city name as a parameter:
- `/[city]` - City homepage
- `/[city]/services` - Services in the city
- `/[city]/services/[category]` - Services by category in the city

### Real-time Communication
Socket.io will be used for real-time features:
1. Chat between clients and service providers
2. Real-time notifications
3. Updates to party status

### Payment and Escrow System
1. Client approves offers and makes payment
2. Funds are held in escrow (using Stripe Connect)
3. Provider confirms service delivery
4. Client confirms receipt or disputes
5. Funds are released or dispute resolution process begins

### AI Moderation
1. Chat messages are sent to AI moderation service
2. AI detects and masks contact information, profanity
3. Flagged content is logged for admin review
4. Price dumping detection compares offers to median prices

## Scalability Considerations
- Stateless API design for horizontal scaling
- Database connection pooling
- Caching strategies for frequently accessed data
- Potential for serverless deployment
- CDN for static assets

## Security Considerations
- HTTPS for all communications
- JWT with appropriate expiration
- CSRF protection
- Input validation and sanitization
- Rate limiting for API endpoints
- Database query parameterization
- Secure payment processing
- Data encryption for sensitive information
