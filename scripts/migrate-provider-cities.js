#!/usr/bin/env node

/**
 * This script migrates placeholder services used for tracking provider service locations
 * to the new ProviderCity model.
 * 
 * It identifies all placeholder services with cityId set and creates corresponding
 * ProviderCity records.
 */

const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function migratePlaceholderServices() {
  console.log('Starting migration of provider service locations...');
  
  try {
    // Find all providers
    const providers = await prisma.provider.findMany({
      select: { id: true, userId: true, businessName: true },
    });
    
    console.log(`Found ${providers.length} providers`);
    
    const results = {
      totalProviders: providers.length,
      processedProviders: 0,
      totalPlaceholderServices: 0,
      migratedRelationships: 0,
      errors: []
    };
    
    // Process each provider
    for (const provider of providers) {
      try {
        console.log(`\nProcessing provider: ${provider.businessName} (ID: ${provider.id})`);
        
        // Find all placeholder services for this provider's user
        const placeholderServices = await prisma.service.findMany({
          where: {
            providerId: provider.userId,
            status: 'INACTIVE',
            OR: [
              { name: { startsWith: 'LOCATION_PLACEHOLDER_' } },
              { name: { startsWith: 'Placeholder Service for' } },
            ],
            cityId: { not: null },
          },
          select: { id: true, cityId: true, name: true },
        });
        
        console.log(`  Found ${placeholderServices.length} placeholder services`);
        results.totalPlaceholderServices += placeholderServices.length;
        
        // Process each placeholder service
        for (const service of placeholderServices) {
          try {
            if (!service.cityId) {
              console.log(`  Skipping service ${service.id} with null cityId`);
              continue;
            }
            
            // Get city details for better logging
            const city = await prisma.city.findUnique({
              where: { id: service.cityId },
              select: { name: true, state: true }
            });
            
            const cityName = city ? `${city.name}, ${city.state}` : service.cityId;
            
            // Check if relationship already exists
            const existingRelation = await prisma.providerCity.findUnique({
              where: {
                providerId_cityId: {
                  providerId: provider.id,
                  cityId: service.cityId
                }
              }
            });
            
            // If relation doesn't exist, create it
            if (!existingRelation) {
              const newRelation = await prisma.providerCity.create({
                data: {
                  id: randomUUID(),
                  providerId: provider.id,
                  cityId: service.cityId,
                }
              });
              
              results.migratedRelationships++;
              console.log(`  Created relationship for city ${cityName} (ID: ${newRelation.id})`);
            } else {
              console.log(`  Relationship already exists for city ${cityName}`);
            }
          } catch (serviceError) {
            console.error(`  Error processing service ${service.id}:`, serviceError);
            results.errors.push(`Error processing service ${service.id}: ${serviceError.message}`);
          }
        }
      } catch (providerError) {
        console.error(`Error processing provider ${provider.id}:`, providerError);
        results.errors.push(`Error processing provider ${provider.id}: ${providerError.message}`);
      }
      
      results.processedProviders++;
    }
    
    // Print summary
    console.log('\n=== Migration Summary ===');
    console.log(`Providers processed: ${results.processedProviders}/${results.totalProviders}`);
    console.log(`Placeholder services found: ${results.totalPlaceholderServices}`);
    console.log(`Provider-city relationships created: ${results.migratedRelationships}`);
    console.log(`Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n=== Errors ===');
      results.errors.forEach(error => console.log(` - ${error}`));
    }
    
    return results;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the migration
migratePlaceholderServices()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 