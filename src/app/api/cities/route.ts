import { prisma } from '@/lib/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_CITY_SETTING_KEY, setDefaultCity } from '@/lib/cities/default-city';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching cities from database...');
    
    // Check if there are any cities in the database
    const cityCount = await prisma.city.count();
    console.log(`City count in database: ${cityCount}`);
    
    // If no cities, add some default ones for testing
    if (cityCount === 0) {
      console.log('No cities found in database, creating default cities');
      
      const defaultCities = [
        { name: 'New York', slug: 'new-york', state: 'NY' },
        { name: 'Los Angeles', slug: 'los-angeles', state: 'CA' },
        { name: 'Chicago', slug: 'chicago', state: 'IL' },
        { name: 'Houston', slug: 'houston', state: 'TX' },
        { name: 'Phoenix', slug: 'phoenix', state: 'AZ' },
      ];
      
      // Create the default cities
      const createdCities = await Promise.all(
        defaultCities.map(city => 
          prisma.city.create({
            data: city
          })
        )
      );
      
      console.log('Default cities created successfully');

      // Set the first city as default
      if (createdCities.length > 0) {
        await setDefaultCity(createdCities[0].id);
        console.log(`Set ${createdCities[0].name} as the default city`);
      }
    }
    
    // Get the default city ID from system settings
    const defaultCitySetting = await prisma.systemSettings.findUnique({
      where: { key: DEFAULT_CITY_SETTING_KEY }
    });
    
    const defaultCityId = defaultCitySetting?.value;
    console.log(`Default city ID from settings: ${defaultCityId || 'not set'}`);
    
    // Get all cities with full logging
    const cities = await prisma.city.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log(`Found ${cities.length} cities in database`);
    if (cities.length > 0) {
      console.log('Sample city:', JSON.stringify(cities[0]));
    }

    // Add isDefault flag to each city in the response
    const citiesWithDefaultFlag = cities.map(city => ({
      ...city,
      isDefault: city.id === defaultCityId
    }));

    return NextResponse.json({ success: true, data: citiesWithDefaultFlag }, { status: 200 });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch cities',
          details: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
}