import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

// DELETE endpoint to remove a service location for a provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    console.log(`DELETE /api/provider/cities/${id}: Request to delete city ID: ${id}`);
    
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log(`DELETE /api/provider/cities/${id}: No user session found`);
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    // Verify the user is a provider
    if (session.user.role !== 'PROVIDER') {
      console.log(`DELETE /api/provider/cities/${id}: User ${session.user.id} is not a provider, role: ${session.user.role}`);
      return NextResponse.json(
        { success: false, error: { message: 'Only providers can access this endpoint' } },
        { status: 403 }
      );
    }
    
    // Get the provider record
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!provider) {
      console.log(`DELETE /api/provider/cities/${id}: Provider record not found for user ${session.user.id}`);
      return NextResponse.json(
        { success: false, error: { message: 'Provider record not found' } },
        { status: 404 }
      );
    }
    
    console.log(`DELETE /api/provider/cities/${id}: Using provider with ID: ${provider.id}`);
    
    // Verify the city exists
    const city = await prisma.city.findUnique({
      where: { id },
    });
    
    if (!city) {
      console.log(`DELETE /api/provider/cities/${id}: City with ID ${id} not found`);
      return NextResponse.json(
        { success: false, error: { message: 'City not found' } },
        { status: 404 }
      );
    }
    
    console.log(`DELETE /api/provider/cities/${id}: Found city: ${city.name}, ${city.state}`);
    
    // Find the provider-city relation using raw SQL
    const providerCityResult = await prisma.$queryRaw`
      SELECT * FROM "ProviderCity" 
      WHERE "providerId" = ${provider.id} AND "cityId" = ${id}
      LIMIT 1
    `;
    
    if (!Array.isArray(providerCityResult) || providerCityResult.length === 0) {
      console.log(`DELETE /api/provider/cities/${id}: No service location found for city ${city.name}`);
      return NextResponse.json(
        { success: false, error: { message: 'This location is not in your service areas' } },
        { status: 404 }
      );
    }
    
    const providerCity = providerCityResult[0];
    console.log(`DELETE /api/provider/cities/${id}: Found provider-city relation: ${providerCity.id}`);
    
    // Check if the provider has active services in this city
    const activeServices = await prisma.service.findMany({
      where: {
        providerId: session.user.id,
        cityId: id,
        NOT: { 
          status: 'INACTIVE'
        }
      },
    });
    
    console.log(`DELETE /api/provider/cities/${id}: Found ${activeServices.length} active services in this city`);
    
    // If there are active services, don't allow deletion
    if (activeServices.length > 0) {
      const activeServiceNames = activeServices.map(s => s.name).join(', ');
      console.log(`DELETE /api/provider/cities/${id}: Cannot remove due to active services: ${activeServiceNames}`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Cannot remove this location because you have active services in this area. Deactivate or delete those services first.',
            activeServices: activeServices.map(s => ({ id: s.id, name: s.name }))
          } 
        },
        { status: 400 }
      );
    }
    
    try {
      // Delete the provider-city relation using raw SQL
      await prisma.$executeRaw`
        DELETE FROM "ProviderCity" 
        WHERE id = ${providerCity.id}
      `;
      
      console.log(`DELETE /api/provider/cities/${id}: Removed service location ${city.name} for provider ${provider.id}`);
      
      // Also create a notification to confirm the action
      const notification = await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'SYSTEM',
          title: 'Service Location Removed',
          content: `${city.name}, ${city.state} has been removed from your service locations.`,
          isRead: false
        }
      });
      
      console.log(`DELETE /api/provider/cities/${id}: Created notification: ${notification.id}`);
      
      return NextResponse.json({
        success: true,
        message: 'Service location removed successfully',
        data: { city }
      });
    } catch (deleteError) {
      console.error(`DELETE /api/provider/cities/${id}: Error removing service location:`, deleteError);
      if (deleteError instanceof Error) {
        console.error(`DELETE /api/provider/cities/${id}: Error details: ${deleteError.message}`);
        if (deleteError.stack) {
          console.error(`DELETE /api/provider/cities/${id}: Stack trace: ${deleteError.stack}`);
        }
      }
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Failed to remove service location due to database error',
            details: deleteError instanceof Error ? deleteError.message : String(deleteError)
          } 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DELETE /api/provider/cities Error removing provider city:', error);
    if (error instanceof Error) {
      console.error(`DELETE /api/provider/cities Error details: ${error.message}`);
      if (error.stack) {
        console.error(`DELETE /api/provider/cities Stack trace: ${error.stack}`);
      }
    }
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to remove service location',
          details: error instanceof Error ? error.message : String(error) 
        } 
      },
      { status: 500 }
    );
  }
} 