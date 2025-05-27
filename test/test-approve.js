// Script to test transaction approval
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Transaction ID to test - use one from your debug output
const TRANSACTION_ID = 'cmacrx4h2000np1ueiq43dvn2'; // Replace with your transaction ID

async function testApproval() {
  try {
    console.log(`Testing approval for transaction ${TRANSACTION_ID}`);
    
    // 1. First check the transaction in the database
    const transaction = await prisma.transaction.findUnique({
      where: { id: TRANSACTION_ID },
      include: {
        offer: {
          include: {
            client: true,
            provider: true,
            service: true
          }
        }
      }
    });

    if (!transaction) {
      console.error('Transaction not found!');
      return;
    }

    console.log('Current transaction status:', transaction.status);
    console.log('Payment Intent ID:', transaction.paymentIntentId || 'NO PAYMENT INTENT');
    console.log('Provider:', transaction.offer.provider.name);
    
    // THE MAIN ISSUE: No payment intent associated with the transaction
    if (!transaction.paymentIntentId) {
      console.error('\n[FOUND THE ISSUE] No payment intent ID associated with this transaction!');
      console.log('This is why approval failed - there is no payment to capture');
      console.log('Transaction creation succeeded but payment intent creation failed or was not properly saved');
      console.log('\nPossible solutions:');
      console.log('1. Manually update transaction status (temporary fix)');
      console.log('2. Fix the payment flow to ensure payment intents are created and saved');
      console.log('3. Implement a fallback approval flow for transactions without payment intents');
    }

    // 2. Try to manually update the transaction status to fix the UI
    console.log('\nAttempting to update transaction status to COMPLETED...');
    const updatedTransaction = await prisma.transaction.update({
      where: { id: TRANSACTION_ID },
      data: {
        status: 'COMPLETED',
        escrowStartTime: new Date(),
        escrowEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    console.log('Updated transaction status:', updatedTransaction.status);
    console.log('Please refresh your client transactions page to see if the status updates');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApproval(); 