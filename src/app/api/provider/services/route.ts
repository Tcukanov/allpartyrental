import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

// Define an extended service type that includes metadata
interface ServiceWithMetadata {
  id: string;
  name: string;
  description: string;
  price: number | string;
  categoryId: string;
  cityId?: string | null;
  providerId: string;
  photos: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  availableDays: string[];
  availableHoursStart?: string | null;
  availableHoursEnd?: string | null;
  minRentalHours?: number | null;
  maxRentalHours?: number | null;
  colors: string[];
  metadata?: string | null;
  category: {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
  };
  city: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    state: string;
  };
}

// Helper function to validate required filters
async function validateRequiredFilters(categoryId: string, filterValues: Record<string, any>) {
  try {
    // Fetch the category filters to check which ones are required
    const categoryFilters = await prisma.categoryFilter.findMany({
      where: { 
        categoryId,
        isRequired: true 
      }
    });
    
    console.log("Required filters for category:", categoryFilters);
    console.log("Filter values provided:", filterValues);
    
    if (categoryFilters.length === 0) {
      // No required filters for this category
      return { valid: true };
    }
    
    // Check if all required filters have values
    const missingFilters = categoryFilters.filter(filter => {
      // Check if the filter ID exists in the provided values
      if (!filterValues || !(filter.id in filterValues)) {
        console.log(`Filter ${filter.name} (${filter.id}) is missing entirely`);
        return true;
      }
      
      const value = filterValues[filter.id];
      console.log(`Checking filter ${filter.name} (${filter.id}): `, value);
      
      // For undefined/null values
      if (value === undefined || value === null) {
        console.log(`Filter ${filter.name} has undefined/null value`);
        return true;
      }
      
      // For array values (checkbox groups), check if at least one option is selected
      if (Array.isArray(value)) {
        const isEmpty = value.length === 0;
        if (isEmpty) {
          console.log(`Filter ${filter.name} has empty array value`);
        }
        return isEmpty;
      }
      
      // For string values, check if it's just whitespace
      if (typeof value === 'string' && !value.trim()) {
        console.log(`Filter ${filter.name} has empty string value`);
        return true;
      }
      
      // If we get here, the filter has a value and is valid
      return false;
    });
    
    if (missingFilters.length > 0) {
      console.log("Missing filters:", missingFilters.map(f => f.name));
      return {
        valid: false,
        missingFilters: missingFilters.map(f => f.name)
      };
    }
    
    console.log("All required filters are valid");
    return { valid: true };
  } catch (error) {
    console.error('Error validating filters:', error);
    return { 
      valid: false, 
      error: 'Failed to validate required filters'
    };
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const services = await prisma.service.findMany({
      where: {
        providerId: session.user.id
      },
      include: {
        category: true,
        city: true
      }
    });

    // Process services to parse metadata if it exists
    const processedServices = services.map(service => {
      const serviceWithMeta = service as unknown as ServiceWithMetadata;
      try {
        // If service has metadata, try to parse it
        if (serviceWithMeta.metadata) {
          const metadata = JSON.parse(serviceWithMeta.metadata);
          return {
            ...serviceWithMeta,
            filterValues: metadata.filterValues || {}
          };
        }
        return serviceWithMeta;
      } catch (e) {
        // If parsing fails, return the service as is
        return serviceWithMeta;
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: processedServices 
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Internal server error',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const providerId = session.user.id;
    const data = await request.json();
    
    console.log("Received data:", data);
    
    // Extract filterValues and other data from request
    const { name, description, price, categoryId, cityId, filterValues, images, addons } = data;
    
    // Validate required fields
    if (!name || !description || !price || !categoryId || !data.photos?.length) {
      console.log("Missing required fields in service creation");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Handle color selection
    let colors: string[] = [];
    try {
      // Fetch category filters to identify color filters
      const category = await prisma.serviceCategory.findUnique({
        where: { id: categoryId },
        include: { filters: true }
      });
      
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 });
      }
      
      const colorFilters = category.filters.filter(filter => filter.type === 'color');
      
      // Extract color values
      for (const filter of colorFilters) {
        const colorValue = filterValues[filter.id];
        console.log(`Processing color filter ${filter.id}:`, colorValue);
        
        if (colorValue) {
          // Handle single string value
          if (typeof colorValue === 'string') {
            colors.push(colorValue);
          } 
          // Handle array of colors (from previous implementation)
          else if (Array.isArray(colorValue) && colorValue.length > 0) {
            colors = [...colors, ...colorValue];
          }
        }
      }
      
      console.log("Extracted colors:", colors);
    } catch (error) {
      console.error("Error processing color filters:", error);
    }
    
    // Validate required filters
    const validationResult = await validateRequiredFilters(categoryId, filterValues);
    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: 'Missing required filters',
        details: validationResult.missingFilters 
      }, { status: 400 });
    }
    
    // Prepare metadata as a JSON string
    let metadataString = '';
    try {
      metadataString = JSON.stringify({ filterValues });
    } catch (error) {
      console.error("Error stringifying filter values:", error);
      return NextResponse.json({ error: 'Invalid filter values format' }, { status: 400 });
    }
    
    // Create the service first
    const service = await prisma.service.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        status: "PENDING_APPROVAL",
        providerId,
        categoryId,
        cityId: cityId || null,
        photos: data.photos || [],
        availableDays: data.availableDays || [],
        availableHoursStart: data.availableHoursStart,
        availableHoursEnd: data.availableHoursEnd,
        minRentalHours: data.minRentalHours,
        maxRentalHours: data.maxRentalHours,
        colors,
        metadata: metadataString
      } as any // Type assertion to bypass type checking
    });
    
    console.log(`Created service ${service.id}`);
    
    // Now create addons one by one if provided
    if (addons && Array.isArray(addons) && addons.length > 0) {
      console.log(`Creating ${addons.length} add-ons for service ${service.id}`);
      
      for (const addon of addons) {
        try {
          await prisma.serviceAddon.create({
            data: {
              serviceId: service.id,
              title: addon.title,
              description: addon.description || '',
              price: parseFloat(addon.price),
              thumbnail: addon.thumbnail || '',
              isRequired: addon.isRequired || false
            }
          });
          console.log(`Created addon: ${addon.title}`);
        } catch (error) {
          console.error(`Error creating addon: ${addon.title}`, error);
        }
      }
      
      console.log(`Successfully created add-ons for service ${service.id}`);
    }
    
    // Create notifications for provider
    await prisma.notification.create({
      data: {
        userId: providerId,
        type: "SYSTEM",
        title: "Service Created",
        content: `Your service "${name}" has been created and is awaiting approval.`
      }
    });
    
    // Prepare the response
    // Get the complete service with its category and city info
    const completeService = await prisma.service.findUnique({
      where: { id: service.id },
      include: {
        category: true,
        city: true
      }
    });
    
    const responseService = {
      ...completeService,
      filterValues: JSON.parse(metadataString).filterValues
    };
    
    return NextResponse.json({ 
      success: true,
      message: 'Service created successfully', 
      service: responseService 
    });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create service',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 