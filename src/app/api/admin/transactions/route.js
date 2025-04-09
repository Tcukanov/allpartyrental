'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

/**
 * Fetch all transactions for admin view
 * This endpoint is restricted to admin users only
 */
export async function GET() {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Fetch payment intents from Stripe (transactions)
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100
    });
    
    // Get payment intents and corresponding charges
    const transactions = [];
    
    for (const intent of paymentIntents.data) {
      // Get the charge data if available
      let chargeData = {};
      if (intent.latest_charge) {
        const charge = await stripe.charges.retrieve(intent.latest_charge);
        chargeData = {
          receipt_url: charge.receipt_url,
          receipt_number: charge.receipt_number,
          failure_message: charge.failure_message
        };
      }
      
      // Map Status from Stripe to our app status
      let status;
      switch (intent.status) {
        case 'succeeded':
          status = 'COMPLETED';
          break;
        case 'processing':
          status = 'PENDING';
          break;
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
        case 'requires_capture':
          status = 'PENDING';
          break;
        case 'canceled':
          status = intent.cancellation_reason === 'requested_by_customer' ? 'REFUNDED' : 'FAILED';
          break;
        default:
          status = 'PENDING';
      }
      
      // Try to find associated party and user information if available
      let partyInfo = { id: null, name: null };
      let userInfo = { id: null, name: null, email: null };
      
      if (intent.metadata && intent.metadata.partyId) {
        try {
          const party = await prisma.party.findUnique({
            where: { id: intent.metadata.partyId },
            select: { id: true, name: true }
          });
          if (party) {
            partyInfo = party;
          }
        } catch (err) {
          console.error(`Error fetching party info for ${intent.metadata.partyId}:`, err);
        }
      }
      
      if (intent.metadata && intent.metadata.userId) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: intent.metadata.userId },
            select: { id: true, name: true, email: true }
          });
          if (user) {
            userInfo = user;
          }
        } catch (err) {
          console.error(`Error fetching user info for ${intent.metadata.userId}:`, err);
        }
      }
      
      // Add transaction
      transactions.push({
        id: intent.id,
        amount: intent.amount / 100, // Stripe amounts are in cents
        currency: intent.currency,
        status: status,
        description: intent.description || 'Payment',
        createdAt: new Date(intent.created * 1000).toISOString(),
        updatedAt: intent.canceled_at ? new Date(intent.canceled_at * 1000).toISOString() : null,
        partyId: partyInfo.id,
        partyName: partyInfo.name,
        userId: userInfo.id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        receiptUrl: chargeData.receipt_url,
        receiptNumber: chargeData.receipt_number,
        failureMessage: chargeData.failure_message
      });
    }
    
    // Return the transactions
    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions from Stripe:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions from Stripe',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 