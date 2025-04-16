// Import PrismaClient
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// NYC boroughs data
const nycBoroughs = [
  { name: 'Manhattan', slug: 'manhattan', state: 'NY' },
  { name: 'Brooklyn', slug: 'brooklyn', state: 'NY' },
  { name: 'Queens', slug: 'queens', state: 'NY' },
  { name: 'The Bronx', slug: 'bronx', state: 'NY' },
  { name: 'Staten Island', slug: 'staten-island', state: 'NY' },
];

async function main() {
  try {
    console.log('🔄 Starting NYC boroughs setup...');

    // Check for existing NYC city to prevent conflicts
    const existingNYC = await prisma.city.findFirst({
      where: {
        name: 'NYC',
      },
    });

    if (existingNYC) {
      console.log('👉 Found existing NYC city, will delete it and replace with boroughs...');
      
      // Update any services or parties using NYC to use Manhattan instead
      console.log('👉 Updating services that used NYC to use Manhattan...');
      await prisma.service.updateMany({
        where: {
          cityId: existingNYC.id,
        },
        data: {
          // We'll update this after creating Manhattan
          // Just marking the services for now
        }
      });
      
      console.log('👉 Updating parties that used NYC to use Manhattan...');
      await prisma.party.updateMany({
        where: {
          cityId: existingNYC.id,
        },
        data: {
          // We'll update this after creating Manhattan
          // Just marking the parties for now
        }
      });
    }

    // Create all boroughs and keep track of their IDs
    const boroughIds = {};
    
    for (const borough of nycBoroughs) {
      // Check if borough already exists
      const existingBorough = await prisma.city.findFirst({
        where: {
          name: borough.name,
        },
      });

      if (existingBorough) {
        console.log(`✅ Borough ${borough.name} already exists with ID: ${existingBorough.id}`);
        boroughIds[borough.name] = existingBorough.id;
      } else {
        // Create borough
        console.log(`👉 Creating borough: ${borough.name}`);
        const newBorough = await prisma.city.create({
          data: borough,
        });
        console.log(`✅ Created borough ${borough.name} with ID: ${newBorough.id}`);
        boroughIds[borough.name] = newBorough.id;
      }
    }

    // If NYC existed, update services and parties to use Manhattan
    if (existingNYC) {
      console.log('👉 Updating services that used NYC to use Manhattan...');
      const updatedServices = await prisma.service.updateMany({
        where: {
          cityId: existingNYC.id,
        },
        data: {
          cityId: boroughIds['Manhattan'],
        }
      });
      console.log(`✅ Updated ${updatedServices.count} services to use Manhattan`);
      
      console.log('👉 Updating parties that used NYC to use Manhattan...');
      const updatedParties = await prisma.party.updateMany({
        where: {
          cityId: existingNYC.id,
        },
        data: {
          cityId: boroughIds['Manhattan'],
        }
      });
      console.log(`✅ Updated ${updatedParties.count} parties to use Manhattan`);
      
      // Now we can delete NYC
      console.log('👉 Deleting NYC city...');
      await prisma.city.delete({
        where: {
          id: existingNYC.id,
        },
      });
      console.log('✅ Deleted NYC city');
    }

    console.log('🎉 NYC boroughs setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up NYC boroughs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 