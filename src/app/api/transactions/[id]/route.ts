import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get a transaction by ID
 * This can be used to check if a transaction exists and see its details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Fetching transaction ${params.id}`);
    
    // Try to get the transaction by ID
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        offer: true,
        party: true
      }
    });
    
    if (!transaction) {
      console.log(`Transaction not found: ${params.id}`);
      return NextResponse.json(
        { success: false, error: { message: 'Transaction not found' } },
        { status: 404 }
      );
    }
    
    console.log(`Transaction found: ${transaction.id}`);
    return NextResponse.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch transaction' } },
      { status: 500 }
    );
  }
} 