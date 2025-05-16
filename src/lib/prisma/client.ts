import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Add connection handling options for better stability
    // This helps prevent "Connection already open" errors
    // and ensures transactions complete properly
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Set transaction timeout to ensure operations complete
    transactionOptions: {
      maxWait: 5000, // 5s max waiting for a transaction
      timeout: 10000  // 10s max transaction time
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export the PrismaClient constructor as well for type imports
export { PrismaClient };
