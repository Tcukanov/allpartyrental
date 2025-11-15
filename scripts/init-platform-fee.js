/**
 * Initialize Platform Fee Setting
 * Run this to set the default 10% platform fee in the database
 * 
 * Usage: node scripts/init-platform-fee.js [fee_percent]
 * Example: node scripts/init-platform-fee.js 10
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const feePercent = process.argv[2] ? parseFloat(process.argv[2]) : 10;

  if (isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
    console.error('❌ Invalid fee percent. Must be a number between 0 and 100');
    process.exit(1);
  }

  console.log(`🔧 Setting platform fee to ${feePercent}%...`);

  try {
    const setting = await prisma.adminSetting.upsert({
      where: { key: 'platformFeePercent' },
      update: { value: feePercent.toString() },
      create: { 
        key: 'platformFeePercent', 
        value: feePercent.toString() 
      }
    });

    console.log('✅ Platform fee setting saved:');
    console.log({
      id: setting.id,
      key: setting.key,
      value: `${setting.value}%`,
      updatedAt: setting.updatedAt
    });

    console.log('\n💡 This fee will be used for:');
    console.log(`   • Client pays: Service price + ${feePercent}%`);
    console.log(`   • Provider commission: ${feePercent}%`);
    console.log('\n🔄 Changes will take effect within 5 minutes (cache refresh)');

  } catch (error) {
    console.error('❌ Error setting platform fee:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

