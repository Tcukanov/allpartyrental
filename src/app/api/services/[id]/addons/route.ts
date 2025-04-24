import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Service ID is required' } },
        { status: 400 }
      );
    }

    console.log(`Fetching addons for service: ${id}`);
    
    // Check if the service exists
    const service = await prisma.service.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Fetch all addons for this service
    const addons = await prisma.serviceAddon.findMany({
      where: { serviceId: id },
      orderBy: [
        { isRequired: 'desc' }, // Required addons first
        { price: 'asc' }        // Then by price (lowest first)
      ]
    });

    console.log(`Found ${addons.length} addons for service ${id}`);

    return NextResponse.json(
      { success: true, data: addons },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error fetching addons for service ${id}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch service addons',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
} 