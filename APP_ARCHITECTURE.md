# AllPartyRent Application Architecture

## System Overview

```mermaid
graph TB
    %% User Types
    Client[👤 Client User]
    Provider[🏢 Provider User]
    Admin[👑 Admin User]
    
    %% Core Application
    NextJS[🚀 Next.js App]
    Auth[🔐 NextAuth.js]
    DB[(🗄️ PostgreSQL Database)]
    PayPal[💳 PayPal API]
    
    %% Main User Flows
    Client --> NextJS
    Provider --> NextJS
    Admin --> NextJS
    NextJS --> Auth
    NextJS --> DB
    NextJS --> PayPal
```

## Database Schema & Relationships

```mermaid
erDiagram
    User ||--o| Provider : "has provider profile"
    User ||--o| Profile : "has profile"
    User ||--o{ Notification : "receives notifications"
    
    Provider ||--o{ Service : "offers services"
    Provider ||--o{ Offer : "makes offers"
    
    Service }o--|| ServiceCategory : "belongs to category"
    Service }o--|| City : "located in city"
    Service ||--o{ ServiceAddon : "has addons"
    Service ||--o{ Offer : "receives offers"
    
    Party }o--|| User : "created by client"
    Party }o--|| City : "located in city"
    Party ||--o{ PartyService : "includes services"
    
    PartyService }o--|| Service : "requests service"
    PartyService ||--o{ Offer : "receives offers"
    
    Offer }o--|| User : "from client"
    Offer }o--|| Provider : "from provider"
    Offer ||--o| Transaction : "creates transaction"
    
    Transaction }o--|| Offer : "for offer"
    Transaction }o--|| Party : "for party"
    
    User {
        string id PK
        string email
        string name
        enum role "CLIENT|PROVIDER|ADMIN"
        datetime createdAt
        boolean emailVerified
    }
    
    Provider {
        string id PK
        string userId FK
        string businessName
        string paypalMerchantId
        string paypalEmail
        boolean paypalOnboardingComplete
        enum paypalStatus
    }
    
    Service {
        string id PK
        string providerId FK
        string categoryId FK
        string cityId FK
        string name
        decimal price
        enum status "ACTIVE|INACTIVE"
    }
    
    Transaction {
        string id PK
        string offerId FK
        string partyId FK
        decimal amount
        enum status "PENDING|ESCROW|COMPLETED|REFUNDED"
        string paymentIntentId
        datetime escrowEndTime
    }
```

## User Journey Flow

```mermaid
flowchart TD
    Start([User Visits Site]) --> Login{Already Registered?}
    
    Login -->|No| Register[Register Account]
    Login -->|Yes| Auth[Login]
    
    Register --> RoleSelect{Select Role}
    RoleSelect -->|Client| ClientDash[Client Dashboard]
    RoleSelect -->|Provider| ProviderSetup[Provider Setup]
    
    Auth --> RoleCheck{User Role?}
    RoleCheck -->|Client| ClientDash
    RoleCheck -->|Provider| ProviderDash[Provider Dashboard]
    RoleCheck -->|Admin| AdminDash[Admin Dashboard]
    
    %% Client Flow
    ClientDash --> BrowseServices[Browse Services]
    BrowseServices --> SelectService[Select Service]
    SelectService --> BookService[Book Service]
    BookService --> Payment[Make Payment]
    Payment --> PayPalCheckout[PayPal Checkout]
    PayPalCheckout --> Confirmation[Booking Confirmed]
    
    %% Provider Flow
    ProviderSetup --> PayPalOnboard[PayPal Onboarding]
    PayPalOnboard --> ProviderDash
    ProviderDash --> CreateService[Create Services]
    CreateService --> ManageOffers[Manage Offers]
    ManageOffers --> AcceptBooking[Accept Booking]
    AcceptBooking --> ServiceDelivery[Deliver Service]
    ServiceDelivery --> GetPaid[Receive Payment]
    
    %% Admin Flow
    AdminDash --> ManageUsers[Manage Users]
    AdminDash --> ManageServices[Manage Services]
    AdminDash --> ViewTransactions[View Transactions]
```

## Payment Processing Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant App as NextJS App
    participant DB as Database
    participant PP as PayPal API
    participant P as Provider
    
    C->>App: Select Service & Book
    App->>DB: Create Transaction (PENDING)
    App->>PP: Create PayPal Order
    PP-->>App: Return Order ID
    App-->>C: Redirect to PayPal Checkout
    
    C->>PP: Complete Payment
    PP->>App: Payment Webhook/Callback
    App->>DB: Update Transaction (ESCROW)
    App->>P: Notify Provider of Booking
    
    P->>App: Accept Booking
    App->>DB: Update Offer Status
    App->>C: Notify Client
    
    Note over App,DB: Service Delivery Period
    
    App->>DB: Check Escrow Timer
    DB-->>App: Escrow Period Ended
    App->>PP: Release Funds to Provider
    App->>DB: Update Transaction (COMPLETED)
    App->>P: Notify Payment Released
```

## Service Booking Process

```mermaid
stateDiagram-v2
    [*] --> ServiceDiscovery
    
    ServiceDiscovery --> ServiceSelection : Browse/Search
    ServiceSelection --> BookingDetails : Select Service
    BookingDetails --> PaymentProcess : Enter Details
    
    PaymentProcess --> PaymentPending : Create PayPal Order
    PaymentPending --> PaymentCompleted : PayPal Success
    PaymentPending --> PaymentFailed : PayPal Failed
    
    PaymentCompleted --> ProviderReview : Notify Provider
    ProviderReview --> BookingAccepted : Provider Accepts
    ProviderReview --> BookingRejected : Provider Rejects/Timeout
    
    BookingAccepted --> ServiceInProgress : Service Period
    ServiceInProgress --> EscrowPeriod : Service Completed
    EscrowPeriod --> PaymentReleased : Auto-release or Manual
    
    BookingRejected --> RefundProcessed : Auto-refund
    PaymentFailed --> [*]
    PaymentReleased --> [*]
    RefundProcessed --> [*]
```

## System Architecture Components

```mermaid
graph LR
    subgraph "Frontend Layer"
        Web[Web App - Next.js]
        Auth[Authentication]
        UI[Chakra UI Components]
    end
    
    subgraph "API Layer"
        REST[REST API Routes]
        Middleware[Auth Middleware]
        Validation[Input Validation]
    end
    
    subgraph "Business Logic"
        UserMgmt[User Management]
        ServiceMgmt[Service Management]
        PaymentMgmt[Payment Processing]
        TransactionMgmt[Transaction Processing]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        PostgreSQL[(PostgreSQL)]
    end
    
    subgraph "External Services"
        PayPalAPI[PayPal API]
        FileStorage[File Storage]
        Email[Email Service]
    end
    
    subgraph "Background Jobs"
        TransactionProcessor[Transaction Processor]
        NotificationSender[Notification Sender]
    end
    
    Web --> REST
    REST --> Middleware
    Middleware --> Validation
    Validation --> UserMgmt
    Validation --> ServiceMgmt
    Validation --> PaymentMgmt
    
    UserMgmt --> Prisma
    ServiceMgmt --> Prisma
    PaymentMgmt --> Prisma
    PaymentMgmt --> PayPalAPI
    
    Prisma --> PostgreSQL
    
    TransactionProcessor --> Prisma
    TransactionProcessor --> PayPalAPI
    NotificationSender --> Email
```

## Key Features & Capabilities

### For Clients:
- Browse and search services by category/location
- Book services with calendar scheduling
- Secure PayPal payment processing
- Real-time booking status updates
- Service provider communication

### For Providers:
- PayPal merchant onboarding
- Service catalog management
- Booking request management
- Payment tracking and history
- Business profile management

### For Admins:
- User and provider management
- Transaction monitoring
- System settings and configuration
- Platform analytics

### Technical Features:
- Automatic transaction processing with escrow
- Background job processing for payments
- Real-time notifications
- Responsive design with Chakra UI
- Type-safe database operations with Prisma
- Secure authentication with NextAuth.js 