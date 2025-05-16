import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { Pool } from 'pg';

/**
 * Direct SQL update for PayPal fields
 * This bypasses Prisma completely to ensure db updates
 */
export async function POST(request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to connect PayPal account' },
        { status: 401 }
      );
    }

    // Get the request body containing merchantId
    const body = await request.json();
    const { merchantId, sandboxEmail } = body;
    
    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }
    
    // Get the provider ID using Prisma
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    let providerId;
    
    // If provider doesn't exist yet, create it
    if (!user.provider) {
      console.log(`Creating new provider for user ${user.id}`);
      const newProvider = await prisma.provider.create({
        data: {
          userId: user.id,
          businessName: user.name || 'My Business',
        }
      });
      providerId = newProvider.id;
    } else {
      providerId = user.provider.id;
    }
    
    console.log(`Using provider ID: ${providerId}`);
    
    // Create direct database connection using DATABASE_URL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    try {
      // Get a client from the pool
      const client = await pool.connect();
      
      try {
        // Direct SQL update
        const updateSql = `
          UPDATE "Provider" 
          SET "paypalMerchantId" = $1, 
              "paypalEmail" = $2, 
              "paypalOnboardingComplete" = true,
              "updatedAt" = NOW()
          WHERE "id" = $3
          RETURNING "id", "paypalMerchantId", "paypalEmail", "paypalOnboardingComplete"
        `;
        
        const result = await client.query(updateSql, [
          merchantId,
          sandboxEmail || user.email,
          providerId
        ]);
        
        console.log('SQL update result:', result.rows[0]);
        
        // Verify with a separate query
        const verifySql = `
          SELECT "id", "paypalMerchantId", "paypalEmail", "paypalOnboardingComplete" 
          FROM "Provider" 
          WHERE "id" = $1
        `;
        
        const verifyResult = await client.query(verifySql, [providerId]);
        console.log('Verification result:', verifyResult.rows[0]);
        
        return NextResponse.json({
          success: true,
          updated: result.rows[0],
          verified: verifyResult.rows[0]
        });
      } finally {
        // Release the client back to the pool
        client.release();
      }
    } finally {
      // Close the pool
      await pool.end();
    }
  } catch (error) {
    console.error('Error in direct PayPal update:', error);
    return NextResponse.json(
      { error: `Failed to update PayPal details: ${error.message}` },
      { status: 500 }
    );
  }
} 