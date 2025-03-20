# Database Schema Outline

## Overview
This document outlines the database schema for the Service Marketplace for Party and Event Organization platform. The schema is designed to support all the required functionality while maintaining data integrity and performance.

## Entity Relationship Diagram (Conceptual)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Service   │     │    Party    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Profile   │     │    Offer    │     │ PartyService│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Calendar   │     │ Transaction │     │    Chat     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Dispute   │     │   Message   │
                    └─────────────┘     └─────────────┘
```

## Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  CLIENT
  PROVIDER
  ADMIN
}

enum ServiceStatus {
  ACTIVE
  INACTIVE
}

enum PartyStatus {
  DRAFT
  PUBLISHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum OfferStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum TransactionStatus {
  PENDING
  ESCROW
  COMPLETED
  REFUNDED
  DISPUTED
}

enum NotificationType {
  NEW_OFFER
  OFFER_UPDATED
  MESSAGE
  PAYMENT
  SYSTEM
}

enum AdvertisementType {
  HOMEPAGE
  FIRST_WAVE
}

model User {
  id                String            @id @default(cuid())
  email             String            @unique
  password          String?
  name              String
  role              UserRole
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  profile           Profile?
  clientParties     Party[]           @relation("ClientParties")
  services          Service[]
  offers            Offer[]           @relation("ProviderOffers")
  receivedOffers    Offer[]           @relation("ClientOffers")
  sentMessages      Message[]         @relation("SentMessages")
  receivedMessages  Message[]         @relation("ReceivedMessages")
  notifications     Notification[]
  advertisements    Advertisement[]
  calendar          Calendar[]
}

model Profile {
  id                String            @id @default(cuid())
  userId            String            @unique
  avatar            String?
  phone             String?
  address           String?
  website           String?
  socialLinks       Json?
  isProStatus       Boolean           @default(false)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  user              User              @relation(fields: [userId], references: [id])
}

model Calendar {
  id                String            @id @default(cuid())
  userId            String
  childName         String
  birthDate         DateTime
  sendReminders     Boolean           @default(false)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  user              User              @relation(fields: [userId], references: [id])
}

model ServiceCategory {
  id                String            @id @default(cuid())
  name              String
  description       String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  services          Service[]
}

model City {
  id                String            @id @default(cuid())
  name              String
  slug              String            @unique
  state             String
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  services          Service[]
  parties           Party[]
}

model Service {
  id                String            @id @default(cuid())
  providerId        String
  categoryId        String
  cityId            String
  name              String
  description       String
  price             Decimal
  photos            String[]
  status            ServiceStatus     @default(ACTIVE)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  provider          User              @relation(fields: [providerId], references: [id])
  category          ServiceCategory   @relation(fields: [categoryId], references: [id])
  city              City              @relation(fields: [cityId], references: [id])
  offers            Offer[]
  partyServices     PartyService[]
}

model Party {
  id                String            @id @default(cuid())
  clientId          String
  cityId            String
  name              String
  date              DateTime
  startTime         String
  duration          Int
  guestCount        Int
  status            PartyStatus       @default(DRAFT)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  client            User              @relation("ClientParties", fields: [clientId], references: [id])
  city              City              @relation(fields: [cityId], references: [id])
  partyServices     PartyService[]
  transactions      Transaction[]
}

model PartyService {
  id                String            @id @default(cuid())
  partyId           String
  serviceId         String
  specificOptions   Json?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  party             Party             @relation(fields: [partyId], references: [id])
  service           Service           @relation(fields: [serviceId], references: [id])
  offers            Offer[]
}

model Offer {
  id                String            @id @default(cuid())
  providerId        String
  clientId          String
  serviceId         String
  partyServiceId    String
  price             Decimal
  description       String
  photos            String[]
  status            OfferStatus       @default(PENDING)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  provider          User              @relation("ProviderOffers", fields: [providerId], references: [id])
  client            User              @relation("ClientOffers", fields: [clientId], references: [id])
  service           Service           @relation(fields: [serviceId], references: [id])
  partyService      PartyService      @relation(fields: [partyServiceId], references: [id])
  transaction       Transaction?
  chat              Chat?
}

model Transaction {
  id                String            @id @default(cuid())
  partyId           String
  offerId           String            @unique
  amount            Decimal
  status            TransactionStatus @default(PENDING)
  paymentIntentId   String?
  paymentMethodId   String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  party             Party             @relation(fields: [partyId], references: [id])
  offer             Offer             @relation(fields: [offerId], references: [id])
  dispute           Dispute?
}

model Dispute {
  id                String            @id @default(cuid())
  transactionId     String            @unique
  reason            String
  description       String
  resolution        String?
  isResolved        Boolean           @default(false)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  transaction       Transaction       @relation(fields: [transactionId], references: [id])
}

model Chat {
  id                String            @id @default(cuid())
  offerId           String            @unique
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  offer             Offer             @relation(fields: [offerId], references: [id])
  messages          Message[]
}

model Message {
  id                String            @id @default(cuid())
  chatId            String
  senderId          String
  receiverId        String
  content           String
  originalContent   String?
  isFlagged         Boolean           @default(false)
  flagReason        String?
  createdAt         DateTime          @default(now())
  
  // Relations
  chat              Chat              @relation(fields: [chatId], references: [id])
  sender            User              @relation("SentMessages", fields: [senderId], references: [id])
  receiver          User              @relation("ReceivedMessages", fields: [receiverId], references: [id])
}

model Notification {
  id                String            @id @default(cuid())
  userId            String
  type              NotificationType
  title             String
  content           String
  isRead            Boolean           @default(false)
  createdAt         DateTime          @default(now())
  
  // Relations
  user              User              @relation(fields: [userId], references: [id])
}

model Advertisement {
  id                String            @id @default(cuid())
  userId            String
  type              AdvertisementType
  startDate         DateTime
  endDate           DateTime
  isActive          Boolean           @default(true)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  user              User              @relation(fields: [userId], references: [id])
}

model SystemSettings {
  id                String            @id @default(cuid())
  key               String            @unique
  value             String
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}
```

## Key Entities and Relationships

### User
- Central entity with role-based distinctions (CLIENT, PROVIDER, ADMIN)
- One-to-one relationship with Profile
- One-to-many relationships with various entities based on role

### Service
- Represents services offered by providers
- Belongs to a ServiceCategory and City
- Associated with multiple Offers and PartyServices

### Party
- Represents a client's event
- Contains multiple PartyServices
- Associated with Transactions

### Offer
- Represents a provider's offer for a specific PartyService
- Links Client, Provider, Service, and PartyService
- Associated with a Transaction and Chat

### Transaction
- Represents payment for an approved offer
- Includes escrow status tracking
- May be associated with a Dispute

### Chat and Message
- Chat is associated with an Offer
- Messages are exchanged between Client and Provider
- Messages can be flagged by AI moderation

### Advertisement
- Represents paid promotions by providers
- Includes type (HOMEPAGE, FIRST_WAVE) and duration

## Indexing Strategy
- Foreign keys will be indexed for performance
- Frequently queried fields like status, dates, and location will be indexed
- Composite indexes for common query patterns

## Data Integrity
- Foreign key constraints ensure referential integrity
- Enum types enforce valid status values
- Default values provide sensible initial states
- Timestamps track creation and updates

## Notes on Implementation
- The schema uses Prisma's declarative syntax
- Relations are defined explicitly with fields and references
- CUID is used for ID generation instead of auto-incrementing integers for security
- JSON fields are used for flexible data structures like specificOptions and socialLinks
