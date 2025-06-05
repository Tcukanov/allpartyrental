const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Updating Provider records with PayPal settings...');
    
    // Find all providers that need PayPal settings
    const providers = await prisma.provider.findMany({
      include: {
        user: true
      }
    });

    console.log(`Found ${providers.length} provider(s) to update`);

    for (const provider of providers) {
      const updateData = {
        paypalCanReceivePayments: true,
        paypalMerchantId: `auto-merchant-${provider.userId}`,
        paypalEmail: provider.user.email,
        paypalOnboardingStatus: 'PENDING', // Changed to PENDING so refresh can complete it
        paypalOnboardingComplete: false
      };

      await prisma.provider.update({
        where: { id: provider.id },
        data: updateData
      });

      console.log(`✅ Updated provider ${provider.id} (${provider.user.email})`);
    }

    console.log('🎉 All Provider records updated successfully!');
    console.log('💡 Now visit https://party-vendors.com/provider/dashboard/paypal and click "Refresh Status" to complete the connection');

  } catch (error) {
    console.error('❌ Error updating Provider records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 