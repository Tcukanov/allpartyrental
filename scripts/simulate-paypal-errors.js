/**
 * Script to simulate PayPal errors for screenshot capture
 * Run this to temporarily set error states in the database
 * 
 * Usage:
 * 1. node scripts/simulate-paypal-errors.js payments
 * 2. Take screenshot
 * 3. node scripts/simulate-paypal-errors.js email
 * 4. Take screenshot
 * 5. node scripts/simulate-paypal-errors.js restore
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const errorType = process.argv[2];

const ERROR_MESSAGES = {
  payments: {
    type: 'CANNOT_RECEIVE_PAYMENTS',
    message: 'Attention: You currently cannot receive payments due to restriction on your PayPal account. Please reach out to PayPal Customer Support or connect to https://www.paypal.com for more information.'
  },
  email: {
    type: 'EMAIL_NOT_CONFIRMED',
    message: 'Attention: Please confirm your email address on https://www.paypal.com/businessprofile/settings in order to receive payments! You currently cannot receive payments.'
  }
};

async function main() {
  console.log('🔧 PayPal Error Simulator for Screenshot Capture\n');

  if (!errorType || !['payments', 'email', 'restore'].includes(errorType)) {
    console.log('❌ Invalid usage!');
    console.log('\nUsage:');
    console.log('  node scripts/simulate-paypal-errors.js payments   # Simulate payments_receivable = false');
    console.log('  node scripts/simulate-paypal-errors.js email      # Simulate primary_email_confirmed = false');
    console.log('  node scripts/simulate-paypal-errors.js restore    # Restore normal state');
    process.exit(1);
  }

  // Find a provider with PayPal connected
  const provider = await prisma.provider.findFirst({
    where: {
      paypalMerchantId: {
        not: null
      }
    }
  });

  if (!provider) {
    console.log('❌ No provider found with PayPal connected');
    console.log('   Please connect a PayPal account first');
    process.exit(1);
  }

  console.log(`✅ Found provider: ${provider.businessName} (ID: ${provider.id})`);

  if (errorType === 'restore') {
    // Restore normal state
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        paypalCanReceivePayments: true,
        paypalStatusIssues: null,
        paypalOnboardingStatus: 'COMPLETED'
      }
    });
    console.log('✅ Restored provider to normal state (payments enabled)');
    console.log('   Refresh http://localhost:3000/provider/dashboard/paypal to see changes');
  } else {
    // Set error state
    const error = ERROR_MESSAGES[errorType];
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        paypalCanReceivePayments: false,
        paypalStatusIssues: JSON.stringify([error]),
        paypalOnboardingStatus: 'ISSUES'
      }
    });

    console.log(`\n✅ Set error state: ${error.type}`);
    console.log('\n📸 NOW CAPTURE SCREENSHOT:');
    console.log('   1. Go to: http://localhost:3000/provider/dashboard/paypal');
    console.log('   2. You should see a RED error alert with the message:');
    console.log(`\n   "${error.message}"`);
    console.log('\n   3. Take a screenshot of the error alert');
    console.log(`   4. Save as: ${errorType === 'payments' ? '2_payments_not_receivable_error.png' : '3_email_not_confirmed_error.png'}`);
    
    if (errorType === 'payments') {
      console.log('\n📋 Next step:');
      console.log('   Run: node scripts/simulate-paypal-errors.js email');
    } else if (errorType === 'email') {
      console.log('\n📋 Next step:');
      console.log('   Run: node scripts/simulate-paypal-errors.js restore');
    }
  }

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

