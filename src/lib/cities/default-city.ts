import { prisma } from '@/lib/prisma/client';

export const DEFAULT_CITY_SETTING_KEY = 'default_city_id';

/**
 * Get the default city
 * @returns The default city or null if not found
 */
export async function getDefaultCity() {
  try {
    // Get default city ID from system settings
    const defaultCitySetting = await prisma.systemSettings.findUnique({
      where: { key: DEFAULT_CITY_SETTING_KEY }
    });

    let defaultCity = null;
    if (defaultCitySetting?.value) {
      // Get the city details
      defaultCity = await prisma.city.findUnique({
        where: { id: defaultCitySetting.value }
      });
      
      if (defaultCity) {
        return defaultCity;
      }
    }
    
    // Fallback to first city alphabetically if no default is set
    defaultCity = await prisma.city.findFirst({
      orderBy: { name: 'asc' }
    });

    return defaultCity;
  } catch (error) {
    console.error('Error fetching default city:', error);
    return null;
  }
}

/**
 * Set a city as the default city
 * @param cityId The ID of the city to set as default
 * @returns The updated city or null if not found
 */
export async function setDefaultCity(cityId: string) {
  try {
    // Verify the city exists
    const city = await prisma.city.findUnique({
      where: { id: cityId }
    });

    if (!city) {
      return null;
    }

    // Update or create the default city setting
    await prisma.systemSettings.upsert({
      where: { key: DEFAULT_CITY_SETTING_KEY },
      update: { value: cityId },
      create: {
        key: DEFAULT_CITY_SETTING_KEY,
        value: cityId
      }
    });

    return city;
  } catch (error) {
    console.error('Error setting default city:', error);
    return null;
  }
} 