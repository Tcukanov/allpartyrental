// Script to add blockedDates column to Service table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding blockedDates column to Service table...');
    
    // Check if column already exists
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Service'
    `;
    
    const columnExists = columns.some(
      col => col.column_name === 'blockedDates'
    );
    
    if (columnExists) {
      console.log('blockedDates column already exists.');
    } else {
      // Add the column
      await prisma.$executeRaw`
        ALTER TABLE "Service" 
        ADD COLUMN "blockedDates" TIMESTAMP[] DEFAULT '{}'::timestamp[];
      `;
      console.log('Successfully added blockedDates column!');
    }
  } catch (error) {
    console.error('Error adding blockedDates column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 