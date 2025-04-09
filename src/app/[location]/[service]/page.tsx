import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma/client';
import { Box, Container, Heading, Text, SimpleGrid, Card, CardBody, Image, VStack, HStack, Badge, Button } from '@chakra-ui/react';
import { Service, User, Profile } from '@prisma/client';

type ServiceWithProvider = Service & {
  provider: User & {
    profile: Profile | null;
  };
};

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { location: string; service: string } }): Promise<Metadata> {
  // Use React.use() to unwrap the params
  const unwrappedParams = React.use(params);
  const { location, service } = unwrappedParams;
  
  try {
    // Find the city by slug
    const city = await prisma.city.findUnique({
      where: { slug: location.toLowerCase() },
    });

    // Find the service category by slug
    const category = await prisma.serviceCategory.findUnique({
      where: { slug: service.toLowerCase() },
    });

    if (!city || !category) {
      return {
        title: 'Not Found',
        description: 'This page could not be found.'
      };
    }

    return {
      title: `${category.name} in ${city.name} | All Party Rent`,
      description: `Find the best ${category.name} services in ${city.name} - All Party Rent helps you find quality party ${category.name.toLowerCase()} services in your area.`
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'There was an error loading this page.'
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
  // Use React.use() to unwrap the params
  const unwrappedParams = React.use(params);
  const { location, service } = unwrappedParams;
  
  // Reserved paths that should not be handled by this route
  const reservedPaths = ['api', 'auth', 'admin', 'client', 'provider', 'services'];
  
  // Handle cases where the route was incorrectly matched to API routes
  if (location === 'api' || location === 'socket') {
    console.error(`API/Socket route incorrectly routed to location/service page: ${location}/${service}`);
    return notFound();
  }
  
  // If it's a system path, return 404
  if (reservedPaths.includes(location.toLowerCase()) ||
      reservedPaths.includes(service.toLowerCase()) ||
      location.includes('/') ||
      service.includes('/')) {
    console.error(`Reserved or invalid path used as location/service slug: location=${location}, service=${service}`);
    return notFound();
  }
  
  // If either parameter is empty, return 404
  if (!location || !service ||
      location.trim() === '' || service.trim() === '') {
    console.error(`Invalid params: location=${location}, service=${service}`);
    return notFound();
  }
  
  // Extract slugs for city and service
  const locationSlug = location.toLowerCase();
  const serviceSlug = service.toLowerCase();

  // Check if slugs contain special characters (only allow alphanumeric, dash, underscore)
  const validSlugPattern = /^[a-z0-9-_]+$/;
  if (!validSlugPattern.test(locationSlug) || !validSlugPattern.test(serviceSlug)) {
    console.error(`Invalid slug format: location=${locationSlug}, service=${serviceSlug}`);
    notFound();
  }

  try {
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
                    src={Array.isArray(service.photos) && service.photos.length > 0 ? service.photos[0] : ''}
                    alt={service.name}
                    height="200px"
                    objectFit="cover"
                    fallback={
                      <Box
                        height="200px"
                        bg="gray.200"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="gray.500">No image available</Text>
                      </Box>
                    }
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
    );
  } catch (error) {
    console.error('Error fetching services:', error);
    return (
      <Container maxW="container.xl" py={8}>
        <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
          <Text fontSize="lg" color="red.500">
            An error occurred while loading the services. Please try again later.
          </Text>
        </Box>
      </Container>
    );
  }
} 