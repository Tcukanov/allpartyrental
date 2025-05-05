const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Execute raw SQL to add the column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT;
    `);
    
    console.log('Successfully added stripeAccountId column to Provider table');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 