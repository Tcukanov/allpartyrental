import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma/client';
import MainLayout from '@/components/layout/MainLayout';
import { Box, Container, Heading, Text, SimpleGrid, Card, CardBody, Image, VStack, HStack, Badge, Button } from '@chakra-ui/react';
import { Service, User, Profile } from '@prisma/client';

type ServiceWithProvider = Service & {
  provider: User & {
    profile: Profile | null;
  };
};

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { location: string; service: string } }): Promise<Metadata> {
  try {
    // Find the city and category from the database
    const city = await prisma.city.findFirst({
      where: { slug: params.location.toLowerCase() },
      select: { name: true }
    });

    const category = await prisma.serviceCategory.findFirst({
      where: { slug: params.service.toLowerCase() },
      select: { name: true }
    });

    if (!city || !category) {
      return {
        title: 'Page Not Found',
        description: 'The requested page could not be found.',
      };
    }

    return {
      title: `${category.name} Rental in ${city.name} | All Party Rental`,
      description: `Find the best ${category.name.toLowerCase()} rental services in ${city.name}. Compare prices, read reviews, and book your party equipment today!`,
      openGraph: {
        title: `${category.name} Rental in ${city.name} | All Party Rental`,
        description: `Find the best ${category.name.toLowerCase()} rental services in ${city.name}. Compare prices, read reviews, and book your party equipment today!`,
        type: 'website',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'All Party Rental',
      description: 'Find and book party services in your area.',
    };
  }
}

// Generate static paths for all location-service combinations
export async function generateStaticParams() {
  try {
    // Fetch all cities and categories from the database
    const cities = await prisma.city.findMany({
      select: { slug: true }
    });

    const categories = await prisma.serviceCategory.findMany({
      select: { slug: true }
    });

    // Generate paths for all combinations
    const paths = cities.flatMap(city =>
      categories.map(category => ({
        location: city.slug,
        service: category.slug,
      }))
    );

    return paths;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function LocationServicePage({ params }: { params: { location: string; service: string } }) {
  try {
    // Make sure we're not trying to render an API route or other reserved paths as a location page
    const reservedPaths = ['api', 'client', 'provider', 'admin', '_next', 'next', 'static', 'auth', 'socket', 'public'];
    
    if (reservedPaths.includes(params.location.toLowerCase()) || 
        reservedPaths.includes(params.service.toLowerCase()) ||
        params.location.includes('/') || 
        params.service.includes('/')) {
      console.error(`Reserved or invalid path used as location/service slug: location=${params.location}, service=${params.service}`);
      notFound();
    }

    // Validate params to ensure they're not empty or invalid
    if (!params.location || !params.service || 
        params.location.trim() === '' || params.service.trim() === '') {
      console.error(`Invalid params: location=${params.location}, service=${params.service}`);
      notFound();
    }

    // Convert slugs to lowercase for consistent matching
    const locationSlug = params.location.toLowerCase();
    const serviceSlug = params.service.toLowerCase();

    // Check if slugs contain special characters (only allow alphanumeric, dash, underscore)
    const validSlugPattern = /^[a-z0-9-_]+$/;
    if (!validSlugPattern.test(locationSlug) || !validSlugPattern.test(serviceSlug)) {
      console.error(`Invalid slug format: location=${locationSlug}, service=${serviceSlug}`);
      notFound();
    }

    // Find the city first
    const city = await prisma.city.findFirst({
      where: {
        slug: locationSlug,
      },
    });

    if (!city) {
      console.error(`City not found for slug: ${locationSlug}`);
      notFound();
    }

    // Find the service category
    const category = await prisma.serviceCategory.findFirst({
      where: {
        slug: serviceSlug,
      },
    });

    if (!category) {
      console.error(`Service category not found for slug: ${serviceSlug}`);
      notFound();
    }

    // Fetch services for this location and category
    const services = await prisma.service.findMany({
      where: {
        cityId: city.id,
        categoryId: category.id,
        status: 'ACTIVE',
      },
      include: {
        provider: {
          include: {
            profile: true
          }
        }
      }
    });

    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <Box>
              <Heading as="h1" size="2xl" mb={4}>
                {category.name} Rental in {city.name}
              </Heading>
              <Text fontSize="xl" color="gray.600">
                Find and compare the best {category.name.toLowerCase()} rental services in {city.name}. 
                Read reviews, compare prices, and book your party equipment today!
              </Text>
            </Box>

            {services.length === 0 ? (
              <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
                <Text fontSize="lg">No providers found for {category.name} in {city.name}.</Text>
                <Text mt={2} color="gray.600">
                  Try searching for a different location or service.
                </Text>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {services.map((service) => (
                  <Card key={service.id} overflow="hidden">
                    <Image
                      src={Array.isArray(service.photos) ? service.photos[0] : '/images/placeholder.jpg'}
                      alt={service.name}
                      height="200px"
                      objectFit="cover"
                    />
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Box>
                          <Heading size="md">{service.name}</Heading>
                          <Text color="gray.600">{service.provider.profile?.address || city.name}</Text>
                        </Box>

                        <Box>
                          <Text fontWeight="bold">Description:</Text>
                          <Text noOfLines={2}>{service.description}</Text>
                        </Box>

                        <Box>
                          <Text fontWeight="bold">Price:</Text>
                          <Text fontSize="xl" color="brand.500">
                            ${Number(service.price).toFixed(2)}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontWeight="bold">Provider:</Text>
                          <Text>{service.provider.name}</Text>
                          {service.provider.profile?.isProStatus && (
                            <Badge colorScheme="yellow" mt={1}>Pro Provider</Badge>
                          )}
                        </Box>

                        <Button colorScheme="brand" as="a" href={`/services/${service.id}`}>
                          View Details
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </VStack>
        </Container>
      </MainLayout>
    );
  } catch (error) {
    console.error('Error fetching services:', error);
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
            <Text fontSize="lg" color="red.500">
              An error occurred while loading the services. Please try again later.
            </Text>
          </Box>
        </Container>
      </MainLayout>
    );
  }
} 