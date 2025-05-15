// Script to debug transaction status
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugTransaction() {
  try {
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        status: {
          in: ['PROVIDER_REVIEW', 'COMPLETED', 'ESCROW']
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10,
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

    console.log('=== LATEST TRANSACTIONS ===');
    if (transactions.length === 0) {
      console.log('No transactions found');
    } else {
      transactions.forEach((tx, index) => {
        console.log(`\n[${index + 1}] Transaction ID: ${tx.id}`);
        console.log(`Status: ${tx.status}`);
        console.log(`Created: ${tx.createdAt}`);
        console.log(`Updated: ${tx.updatedAt}`);
        console.log(`Service: ${tx.offer?.service?.name || 'Unknown'}`);
        console.log(`Client: ${tx.offer?.client?.name || 'Unknown'}`);
        console.log(`Provider: ${tx.offer?.provider?.name || 'Unknown'}`);
        
        if (tx.transferId) {
          console.log(`Has transfer ID: ${tx.transferId}`);
        } else {
          console.log('No transfer ID (payment not sent to provider)');
        }
        
        if (tx.escrowStartTime || tx.escrowEndTime) {
          console.log(`Escrow: ${tx.escrowStartTime} to ${tx.escrowEndTime}`);
        }
        
        console.log('---');
      });
    }

    // Examine prisma schema to make sure status field is correct
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === 'Transaction');
    const statusField = model.fields.find(f => f.name === 'status');
    
    console.log('\n=== TRANSACTION STATUS FIELD INFO ===');
    console.log(`Field type: ${statusField.type}`);
    console.log(`Is enum: ${statusField.kind === 'enum'}`);
    if (statusField.kind === 'enum') {
      const enumValues = Prisma.dmmf.datamodel.enums.find(e => e.name === statusField.type);
      console.log('Possible status values:', enumValues.values.map(v => v.name).join(', '));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugTransaction(); 