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
}

// Helper function to validate required filters
async function validateRequiredFilters(categoryId: string, filterValues: Record<string, any>) {
  try {
    // Fetch the category filters to check which ones are required using raw query
    const categoryFilters = await prisma.$queryRaw`
      SELECT * FROM "CategoryFilter"
      WHERE "categoryId" = ${categoryId}
      AND "isRequired" = true
    `;
    
    console.log("Required filters for category:", categoryFilters);
    console.log("Filter values provided:", filterValues);
    
    if (!Array.isArray(categoryFilters) || categoryFilters.length === 0) {
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

    // Get or create the provider record for this user
    let provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    if (!provider) {
      // Auto-create Provider record for users with PROVIDER role who don't have one
      console.log(`Auto-creating Provider record for user: ${session.user.name} (${session.user.id})`);
      
      provider = await prisma.provider.create({
        data: {
          userId: session.user.id,
          businessName: session.user.name || 'Business Name',
          bio: `Professional services provider`,
          isVerified: false,
          paypalCanReceivePayments: false,  // Start with payments disabled
          paypalOnboardingStatus: 'NOT_STARTED',  // Start with onboarding not started
          paypalEnvironment: 'sandbox'
        }
      });
    }

    // PAYPAL CONNECTION REQUIREMENT: Check if provider can receive payments
    console.log('📊 Checking PayPal connection status:', {
      providerId: provider.id,
      paypalCanReceivePayments: provider.paypalCanReceivePayments,
      paypalMerchantId: provider.paypalMerchantId,
      paypalOnboardingStatus: provider.paypalOnboardingStatus
    });

    if (!provider.paypalCanReceivePayments || !provider.paypalMerchantId) {
      console.log('❌ Provider cannot create services - PayPal not connected');
      return NextResponse.json({
        success: false,
        error: {
          code: 'PAYPAL_CONNECTION_REQUIRED',
          message: 'PayPal connection required to create services',
          details: 'You must connect your PayPal account before creating services. This ensures you can receive payments from customers.',
          action: {
            text: 'Connect PayPal Account',
            url: '/provider/dashboard/paypal'
          }
        }
      }, { status: 400 });
    }

    console.log('✅ Provider PayPal connection verified - proceeding with service creation');

    const services = await prisma.service.findMany({
      where: {
        providerId: provider.id  // Use Provider ID, not User ID
      },
      include: {
        category: true
      },
      orderBy: {
        updatedAt: 'desc' // Show most recently updated services first
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
    
    // Get or create the provider record for this user
    let provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    if (!provider) {
      // Auto-create Provider record for users with PROVIDER role who don't have one
      console.log(`Auto-creating Provider record for user: ${session.user.name} (${session.user.id})`);
      
      provider = await prisma.provider.create({
        data: {
          userId: session.user.id,
          businessName: session.user.name || 'Business Name',
          bio: `Professional services provider`,
          isVerified: false,
          paypalCanReceivePayments: false,  // Start with payments disabled
          paypalOnboardingStatus: 'NOT_STARTED',  // Start with onboarding not started
          paypalEnvironment: 'sandbox'
        }
      });
    }

    // PAYPAL CONNECTION REQUIREMENT: Check if provider can receive payments
    console.log('📊 Checking PayPal connection status:', {
      providerId: provider.id,
      paypalCanReceivePayments: provider.paypalCanReceivePayments,
      paypalMerchantId: provider.paypalMerchantId,
      paypalOnboardingStatus: provider.paypalOnboardingStatus
    });

    if (!provider.paypalCanReceivePayments || !provider.paypalMerchantId) {
      console.log('❌ Provider cannot create services - PayPal not connected');
      return NextResponse.json({
        success: false,
        error: {
          code: 'PAYPAL_CONNECTION_REQUIRED',
          message: 'PayPal connection required to create services',
          details: 'You must connect your PayPal account before creating services. This ensures you can receive payments from customers.',
          action: {
            text: 'Connect PayPal Account',
            url: '/provider/dashboard/paypal'
          }
        }
      }, { status: 400 });
    }

    console.log('✅ Provider PayPal connection verified - proceeding with service creation');

    const providerId = provider.id;  // Use Provider ID, not User ID
    const data = await request.json();
    
    console.log("Received data:", data);
    
    // Extract filterValues and other data from request
    const { 
      name, 
      description, 
      price, 
      categoryId, 
      filterValues, 
      images, 
      addons,
      blockedDates 
    } = data;
    
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
      // Fetch category and its filters using raw query instead of relation
      const category = await prisma.serviceCategory.findUnique({
        where: { id: categoryId }
      });
      
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 });
      }
      
      // Get the filters for this category with a separate raw query
      const categoryFilters = await prisma.$queryRaw`
        SELECT * FROM "CategoryFilter" 
        WHERE "categoryId" = ${categoryId}
      `;
      
      // Filter to find color filters
      const colorFilters = Array.isArray(categoryFilters) 
        ? categoryFilters.filter(filter => filter.type === 'color')
        : [];
      
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
    
    // Define metadata
    const metadata = {
      filterValues
    };

    // Convert blockedDates strings to Date objects if they exist
    const parsedBlockedDates = blockedDates && Array.isArray(blockedDates) 
      ? blockedDates.map((dateStr: string) => new Date(dateStr))
      : [];

    // Create service
    const service = await prisma.service.create({
      data: {
        name,
        description,
        price: parseFloat(price.toString()),
        categoryId,
        providerId,
        photos: data.photos || [],
        availableDays: data.availableDays || [],
        availableHoursStart: data.availableHoursStart || null,
        availableHoursEnd: data.availableHoursEnd || null,
        minRentalHours: data.minRentalHours || null,
        maxRentalHours: data.maxRentalHours || null,
        colors,
        metadata: JSON.stringify(metadata),
        blockedDates: parsedBlockedDates,
      }
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
        userId: session.user.id,  // Use User ID, not Provider ID
        type: "SYSTEM",
        title: "Service Created",
        content: `Your service "${name}" has been created and is awaiting approval.`
      }
    });
    
    // Prepare the response
    // Get the complete service with its category info
    const completeService = await prisma.service.findUnique({
      where: { id: service.id },
      include: {
        category: true
      }
    });
    
    const responseService = {
      ...completeService,
      filterValues: JSON.parse(JSON.stringify(metadata)).filterValues
    };
    
    return NextResponse.json({ 
      success: true,
      message: 'Service created successfully', 
      service: responseService 
    });
  } catch (error) {
    console.error('Error creating service:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      console.error('Foreign key constraint violation:', error.meta);
      
      if (error.meta?.field_name?.includes('providerId')) {
        return NextResponse.json({ 
          success: false,
          error: 'Provider account setup incomplete. Unable to create service because provider record is missing or invalid.',
          code: 'PROVIDER_SETUP_INCOMPLETE',
          details: {
            field: error.meta.field_name,
            suggestion: 'Please refresh the page and try again. If the problem persists, contact support.'
          }
        }, { status: 400 });
      }
      
      if (error.meta?.field_name?.includes('categoryId')) {
        return NextResponse.json({ 
          success: false,
          error: 'Invalid category selected. The selected category may no longer exist.',
          code: 'INVALID_CATEGORY',
          details: 'Please select a different category and try again.'
        }, { status: 400 });
      }
      

      
      return NextResponse.json({ 
        success: false,
        error: 'Invalid reference data. One or more selected options are no longer valid.',
        code: 'FOREIGN_KEY_CONSTRAINT',
        details: {
          field: error.meta?.field_name,
          suggestion: 'Please refresh the page and try again with different selections.'
        }
      }, { status: 400 });
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: false,
        error: 'Duplicate service detected. A service with the same name or details already exists.',
        code: 'DUPLICATE_SERVICE',
        details: 'Please modify the service name or details and try again.'
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to create service',
      code: 'SERVICE_CREATION_FAILED',
      details: {
        errorType: error.constructor.name,
        prismaErrorCode: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 