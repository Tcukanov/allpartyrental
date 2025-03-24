# Service Marketplace for Party and Event Organization

## Project Overview
- **Project Name**: Service Marketplace for Party and Event Organization
- **Description**: A platform connecting clients looking to organize parties with service providers
- **Target Audience**: AI Code Generator
- **Locale**: en-US
- **URL Structure**: Domain name followed by city, e.g., `/new-york/` then listings

## User Roles

### Client
- Create personal parties
- Use Party Configurator
- Receive offers from providers
- Approve or reject offers
- Access personal dashboard (Client Cabinet)
- Manage profile information
- View personal calendar
- See party history and statistics
- Make payments (escrow)

### Service Provider
- Manage service listings (name, price, photos, availability, description)
- Receive client requests
- Send offers to clients
- Chat with clients
- Access service provider dashboard (Service Provider Cabinet)
- Manage profile information
- View inbound requests
- Purchase advertising
- Purchase 'First Wave' subscription

### Administrator
- Manage site-wide statistics
- Manage user accounts (clients and providers)
- Manage payment disputes
- Oversee AI moderation logs
- Configure advertising packages and pricing
- Block users
- Moderate content
- Intervene in disputes

## Core Pages and Modules

### Homepage
- **Purpose**: Introduce the platform and allow quick access to key features
- **Key Features**:
  - Service Categories
  - CTA Button: 'Organize My Party!'
  - Search & Filters
  - Best in Your Location
  - 'My Party' Button (for logged-in Clients)

### Client Cabinet
- **Purpose**: Personal dashboard for clients
- **Sections**:
  - Profile Information
  - Personal Calendar (Children's Birthdays)
  - Party Statistics / History

### Service Provider Cabinet
- **Purpose**: Dashboard for service providers
- **Sections**:
  - Provider Profile
  - Requests (Inbound Orders)
  - Chats with Clients
  - Manage Services
  - Advertising & 'First Wave'

### Party Configurator
- **Purpose**: Drag-and-drop interface for clients to build a custom list of services
- **Flow**:
  - Drag-and-Drop Screen
  - Event Details
  - Service-Specific Options
  - Submitting Requests to Providers

### My Party (Client's Event Management Page)
- **Purpose**: Review and manage in-progress party, see offers, chat, and approve/reject
- **Key Elements**:
  - Chosen Categories / Services
  - Offers List (Per Service Type)
  - Status Indicators

### Admin Panel
- **Purpose**: Oversight, control, and statistics for administrators
- **Sections**:
  - Dashboard & Statistics
  - Dispute Management & Escrow Control
  - User & Content Moderation
  - Advertising Configuration

## Chat and Notifications
- **Chat Mechanics**:
  - Context: Each conversation tied to a specific request and service type
  - AI Moderation: Contact info blocking, profanity blocking
- **Notifications**:
  - Client notifications
  - Provider notifications
  - System alerts
  - Delivery methods: Email, In-app, Push

## Advertising Tools
- **Homepage Ad Slots**:
  - Providers can pay to appear in top positions
  - Various duration packages
  - Visually highlighted display
- **First Wave Priority Access**:
  - Providers receive new client requests 15 minutes earlier
  - Weekly or monthly subscriptions
  - May be bundled with homepage ads

## Payment Escrow System
- **Flow**:
  - Client approves offers → Payment made (funds in escrow)
  - Provider confirms arrival
  - Client confirms provider arrival
  - 12-hour countdown for immediate disputes
  - Release of funds after 12 hours if no dispute
  - Auto-confirmation after 24 hours if client doesn't respond
  - Dispute resolution process for "No Show" cases
- **Dispute Resolution**: Admin investigates and decides on fund release or refund

## AI Moderation and Anti-Dumping Measures
- **Contact Info Blocking**: Masking of phone numbers, emails, external links
- **Profanity/Offensive Content**: AI scanning and filtering
- **Price Dumping Check**:
  - Median price display
  - Below average warning
  - Client notification for unusually low offers
  - Off-platform discount flagging

## Technical and Legal Requirements
- **Technology Stack**:
  - Frontend: Next.js (TypeScript), drag-and-drop library
  - Backend: TypeScript
  - Database: PostgreSQL with Prisma
  - Authentication: JWT, Auth 2.0 Google
  - UI components: ChakraUI
  - Payments: Integrated payment gateway with escrow logic
- **User Agreement/Legal**: Platform as intermediary, responsibility disclaimers
- **Data Protection**: GDPR, CCPA compliance
- **Scalability/Performance**: Handle concurrent users, caching, load balancing

## Technical Warnings and Requirements
Throughout the requirements, there are several areas that need further technical specification:
- Database schemas for user profiles, services, party configurations
- API endpoints for various functionalities
- UI/UX specifications for complex interfaces
- Payment gateway integration details
- AI moderation implementation
- Real-time chat and notification system implementation
