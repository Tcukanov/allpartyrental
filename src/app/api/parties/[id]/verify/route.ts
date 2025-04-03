import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get party by ID with all its details
    const party = await prisma.party.findUnique({
      where: {
        id,
      },
      include: {
        partyServices: {
          include: {
            service: true
          }
        },
        city: true
      }
    });

    if (!party) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to verify this party
    if (session.user.id !== party.clientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if party has services
    if (party.partyServices.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Party must have at least one service to publish' } },
        { status: 400 }
      );
    }

    // Format party data for verification
    const partyData = {
      name: party.name,
      date: party.date,
      startTime: party.startTime,
      duration: party.duration,
      guestCount: party.guestCount,
      city: party.city?.name,
      services: party.partyServices.map(ps => ({
        name: ps.service?.name,
        category: ps.service?.categoryId
      }))
    };

    // Verify with OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that verifies party details to ensure they don't contain spam, scams, inappropriate content, or anything that violates platform policies. Respond with JSON containing: {\"isValid\": boolean, \"reason\": string}. If invalid, provide a specific reason."
          },
          {
            role: "user",
            content: `Please verify this party data: ${JSON.stringify(partyData)}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      // Parse the response
      const content = response.choices[0]?.message?.content || "";
      const result = JSON.parse(content);

      if (!result.isValid) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'CONTENT_POLICY_VIOLATION', 
              message: 'Party details could not be verified', 
              details: result.reason 
            } 
          },
          { status: 400 }
        );
      }

      // If valid, update party status to VERIFIED
      const updatedParty = await prisma.party.update({
        where: {
          id,
        },
        data: {
          status: 'PUBLISHED',
        },
      });

      // Create notifications for providers
      const services = party.partyServices;
      
      for (const partyService of services) {
        const providers = await prisma.user.findMany({
          where: {
            role: 'PROVIDER',
            services: {
              some: {
                categoryId: partyService.service?.categoryId,
                cityId: party.cityId,
              },
            },
          },
        });

        for (const provider of providers) {
          await prisma.notification.create({
            data: {
              userId: provider.id,
              type: 'NEW_OFFER',
              title: 'New Party Request',
              content: `A new party request has been published that matches your services: ${party.name}`,
            },
          });
        }
      }

      return NextResponse.json({ 
        success: true, 
        data: updatedParty,
        verification: {
          verified: true,
          message: "Party content verified successfully"
        }
      }, { status: 200 });
    } catch (aiError) {
      console.error('OpenAI verification error:', aiError);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VERIFICATION_ERROR', 
            message: 'Failed to verify party content', 
            details: aiError instanceof Error ? aiError.message : 'Unknown error' 
          } 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Party verification error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 