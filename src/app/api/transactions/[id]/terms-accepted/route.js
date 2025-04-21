import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * API endpoint to update a transaction with terms acceptance status
 * POST /api/transactions/[id]/terms-accepted
 */
export async function POST(request, { params }) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: { message: "Authentication required" } 
      }, { status: 401 });
    }
    
    // Get the transaction ID from the URL params
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: { message: "Transaction ID is required" } 
      }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    const { termsAccepted, termsType } = body;
    
    if (termsAccepted === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: { message: "termsAccepted is required" } 
      }, { status: 400 });
    }
    
    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        offer: {
          include: {
            client: true
          }
        }
      }
    });
    
    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: { message: "Transaction not found" } 
      }, { status: 404 });
    }
    
    // Verify the user has permission (must be the client who owns the transaction)
    if (transaction.offer.clientId !== session.user.id) {
      return NextResponse.json({ 
        success: false, 
        error: { message: "You don't have permission to update this transaction" } 
      }, { status: 403 });
    }
    
    // Update the transaction to include terms acceptance
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        termsAccepted,
        termsType,
        termsAcceptedAt: termsAccepted ? new Date() : null
      }
    });
    
    logger.info(`Terms accepted for transaction ${id} by user ${session.user.id}`);
    
    return NextResponse.json({ 
      success: true, 
      data: { transaction: updatedTransaction }
    });
    
  } catch (error) {
    logger.error("Error accepting terms for transaction:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: { message: "Error accepting terms", details: error.message } 
    }, { status: 500 });
  }
} 