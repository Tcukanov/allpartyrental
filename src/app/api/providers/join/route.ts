// src/app/api/providers/join/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { prisma } from '@/lib/prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      businessName, 
      phone, 
      website, 
      address, 
      city, 
      description, 
      categories, 
      serviceCities, 
      availability, 
      priceRange 
    } = body;

    // Validate required fields
    if (!name || !email || !password || !businessName || !phone || !categories || !serviceCities || !availability) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email already in use' } },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user with PROVIDER role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'PROVIDER',
        profile: {
          create: {
            avatar: null,
            phone,
            website: website || null,
            address: address || null,
            socialLinks: {},
            isProStatus: false
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Create service categories for the provider (if needed)
    // This would depend on your database schema and how you're handling categories

    return NextResponse.json({ 
      success: true, 
      data: { 
        user,
        message: 'Provider registration successful' 
      } 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Provider registration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch registration requirements or terms
 */
export async function GET() {
  try {
    // Return provider registration information
    return NextResponse.json({
      success: true,
      data: {
        serviceCategories: [
          'Decoration',
          'Catering',
          'Entertainment',
          'Venue',
          'Photography',
          'Music',
          'Bounce House',
          'Clown/Entertainer',
          'Party Supplies',
          'Transportation'
        ],
        cities: [
          'New York',
          'Los Angeles',
          'Chicago',
          'Houston',
          'Miami',
          'Seattle',
          'Boston',
          'San Francisco',
          'Denver',
          'Atlanta'
        ],
        requirements: {
          description: "Minimum 100 characters description of your business",
          categories: "Select at least one service category",
          cities: "Select at least one service area"
        },
        platformFee: "5% of transaction amount"
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching provider registration info:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}