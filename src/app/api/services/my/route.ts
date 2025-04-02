import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ServiceStatus, NotificationType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Provider access required' } },
        { status: 403 }
      );
    }

    // Get services for the provider
    const services = await prisma.service.findMany({
      where: {
        providerId: session.user.id as string,
      },
      include: {
        category: true,
        city: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: services }, { status: 200 });
  } catch (error) {
    console.error('Get provider services error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Provider access required' } },
        { status: 403 }
      );
    }

    // Parse request body with a size limit check
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid request body' } },
        { status: 400 }
      );
    }

    const { 
      categoryId, 
      cityId, 
      name, 
      description, 
      price, 
      photos,
      availableDays,
      availableHoursStart,
      availableHoursEnd,
      minRentalHours,
      maxRentalHours 
    } = body;

    // Validate input
    if (!categoryId || !cityId || !name || !description || !price) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Validate and process photos
    let processedPhotos = [];
    if (photos && Array.isArray(photos)) {
      // Take only the first 5 photos
      const limitedPhotos = photos.slice(0, 5);
      
      // Validate each photo (checking if they're not too large for DB storage)
      for (const photo of limitedPhotos) {
        if (typeof photo === 'string') {
          // Simple size check - can be made more sophisticated
          if (photo.length > 1024 * 1024) { // If image string > ~1MB
            console.warn('Image too large, skipping:', photo.substring(0, 100) + '...');
            continue; // Skip this photo
          }
          processedPhotos.push(photo);
        }
      }
    }

    console.log('Creating service with fields:', {
      providerId: session.user.id,
      categoryId,
      cityId,
      name,
      description,
      price: typeof price,
      photosCount: processedPhotos.length,
      availableDays: availableDays ? availableDays.length : 0,
      hasHours: !!availableHoursStart && !!availableHoursEnd,
      minRentalHours,
      maxRentalHours
    });

    try {
      // Validate city existence first
      if (cityId) {
        const cityExists = await prisma.city.findUnique({
          where: { id: cityId },
        });
        
        if (!cityExists) {
          console.error(`City with ID ${cityId} not found in database`);
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                code: 'VALIDATION_ERROR', 
                message: 'Selected city not found. Please select a valid city.' 
              } 
            },
            { status: 400 }
          );
        }

        console.log(`City validation passed: ${cityId} - ${cityExists.name}`);
      }

      // Validate category existence
      if (categoryId) {
        const categoryExists = await prisma.serviceCategory.findUnique({
          where: { id: categoryId },
        });
        
        if (!categoryExists) {
          console.error(`Category with ID ${categoryId} not found in database`);
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                code: 'VALIDATION_ERROR', 
                message: 'Selected category not found. Please select a valid category.' 
              } 
            },
            { status: 400 }
          );
        }

        console.log(`Category validation passed: ${categoryId} - ${categoryExists.name}`);
      }
      
      // Build the create data with validated required fields
      const createData: any = {
        providerId: session.user.id as string,
        categoryId,
        cityId,
        name: name.trim(),
        description: description.trim(),
        price: typeof price === 'string' ? parseFloat(price) : price,
        photos: processedPhotos || [],
        status: 'PENDING_APPROVAL' as ServiceStatus,
      };
      
      // Handle availability and rental fields if provided
      if (availableDays !== undefined) {
        // Make sure it's an array
        createData.availableDays = Array.isArray(availableDays) ? availableDays : [];
      }
      
      if (availableHoursStart !== undefined) {
        createData.availableHoursStart = availableHoursStart;
      }
      
      if (availableHoursEnd !== undefined) {
        createData.availableHoursEnd = availableHoursEnd;
      }
      
      if (minRentalHours !== undefined) {
        createData.minRentalHours = typeof minRentalHours === 'number' ? minRentalHours : 
          (minRentalHours ? parseInt(String(minRentalHours)) : null);
      }
      
      if (maxRentalHours !== undefined) {
        createData.maxRentalHours = typeof maxRentalHours === 'number' ? maxRentalHours : 
          (maxRentalHours ? parseInt(String(maxRentalHours)) : null);
      }
      
      try {
        // Create service with pending approval status
        const service = await prisma.service.create({
          data: createData,
        });
        
        console.log('Service created successfully with ID:', service.id);

        // Create a notification for the provider
        await prisma.notification.create({
          data: {
            userId: session.user.id as string,
            type: NotificationType.SYSTEM,
            title: 'Service Pending Review',
            content: `Your service "${name}" has been submitted and is pending admin approval.`,
          },
        });

        // Find admins to notify them about the new service
        const admins = await prisma.user.findMany({
          where: {
            role: 'ADMIN',
          },
          select: {
            id: true,
          },
        });

        // Create notifications for all admins
        if (admins.length > 0) {
          await Promise.all(
            admins.map((admin) =>
              prisma.notification.create({
                data: {
                  userId: admin.id,
                  type: NotificationType.SYSTEM,
                  title: 'New Service Requires Approval',
                  content: `Provider ${session.user.name} has submitted a new service "${name}" that requires approval.`,
                },
              })
            )
          );
        }

        return NextResponse.json({ success: true, data: service }, { status: 201 });
      } catch (dbError) {
        console.error('Database error creating service:', dbError);
        return NextResponse.json(
          { success: false, error: { code: 'DB_ERROR', message: 'Database error: ' + (dbError.message || 'Unknown error') } },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Create service error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error: ' + (error.message || 'Unknown error') } },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error: ' + (error.message || 'Unknown error') } },
      { status: 500 }
    );
  }
}
