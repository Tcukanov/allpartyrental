import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        city: true,
        category: true,
        provider: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch services'
        }
      },
      { status: 500 }
    );
  }
} 