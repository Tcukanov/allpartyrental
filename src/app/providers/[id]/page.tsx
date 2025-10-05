import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma/client';
import { Box, Container, Heading, Text, SimpleGrid, Card, CardBody, Image, VStack, HStack, Badge, Button, Tabs, TabList, TabPanels, Tab, TabPanel, Avatar, Divider } from '@chakra-ui/react';
import { Service, User, Profile } from '@prisma/client';

type ServiceWithCategory = Service & {
  category: {
    name: string;
    slug: string;
  };
};

type ProviderWithProfile = User & {
  profile: Profile | null;
  services: ServiceWithCategory[];
};

// Update for Next.js 15
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  // Unwrap the params promise
  const params = await props.params;
  const { id } = params;
  
  try {
    // Try to find the provider by ID
    const provider = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        profile: {
          select: {
            description: true
          }
        }
      }
    });

    if (!provider) {
      return {
        title: 'Provider Not Found',
        description: 'This provider does not exist.'
      };
    }

    return {
      title: `${provider.name} | Party Service Provider`,
      description: provider.profile?.description?.substring(0, 150) || 
        `${provider.name} offers party services. Check out their profile and services.`
    };
  } catch (error) {
    console.error('Error generating provider page metadata:', error);
    return {
      title: 'Provider Profile',
      description: 'View this provider\'s profile and services.'
    };
  }
}

export default async function ProviderProfilePage(props: { params: Promise<{ id: string }> }) {
  // Unwrap the params promise
  const params = await props.params;
  const { id } = params;
  
  try {
    // Get provider data using raw SQL to avoid TypeScript issues
    const providerResult = await prisma.$queryRaw`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u."createdAt" as user_created_at,
        pr.id as provider_id,
        pr."businessName" as business_name,
        pr.bio as provider_bio,
        pr."isVerified" as is_verified,
        pr.phone as provider_phone,
        pr.website as provider_website,
        p.id as profile_id,
        p.avatar as profile_avatar,
        p.phone as profile_phone,
        p.address as profile_address,
        p.website as profile_website,
        p."socialLinks" as social_links,
        p."isProStatus" as is_pro_status,
        p."googleBusinessRating" as google_business_rating,
        p."googleBusinessReviews" as google_business_reviews,
        p."googleBusinessUrl" as google_business_url,
        p.description as profile_description,
        p."contactPerson" as contact_person
      FROM "User" u
      LEFT JOIN "Provider" pr ON u.id = pr."userId"
      LEFT JOIN "Profile" p ON u.id = p."userId"
      WHERE u.id = ${id}
      LIMIT 1
    `;

    const provider = providerResult[0] as any;

    if (!provider) {
      notFound();
    }

    // Get active services for this provider using raw SQL
    // Services don't have cityId - they're associated with providers who have service areas
    const servicesResult = await prisma.$queryRaw`
      SELECT 
        s.*,
        sc.name as category_name,
        sc.slug as category_slug
      FROM "Service" s
      LEFT JOIN "ServiceCategory" sc ON s."categoryId" = sc.id
      LEFT JOIN "Provider" pr ON s."providerId" = pr.id
      WHERE pr."userId" = ${id} AND s.status = 'ACTIVE'
      ORDER BY s."createdAt" DESC
    `;

    const services = servicesResult as any[];

    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Provider Header */}
          <Box>
            <HStack spacing={6} align="start">
              <Avatar
                size="2xl"
                src={provider.profile?.avatar || undefined}
                name={provider.name}
              />
              <VStack align="start" spacing={2}>
                <Heading size="xl">{provider.name}</Heading>
                {provider.profile?.isProStatus && (
                  <Badge colorScheme="yellow">Pro Provider</Badge>
                )}
              </VStack>
            </HStack>
            {provider.profile?.description && (
              <Text mt={4} color="gray.600">
                {provider.profile.description}
              </Text>
            )}
          </Box>

          <Divider />

          {/* Provider Details */}
          <Tabs>
            <TabList>
              <Tab>Services</Tab>
            </TabList>

            <TabPanels>
              {/* Services Tab */}
              <TabPanel>
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
                            <Text color="gray.600">{service.category_name}</Text>
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

                          <Button colorScheme="brand" as="a" href={`/services/${service.id}`}>
                            View Details
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    );
  } catch (error: any) {
    // Re-throw notFound errors so Next.js can handle them properly
    if (error?.digest === 'NEXT_NOT_FOUND') {
      throw error;
    }
    
    console.error('Error fetching provider:', error);
    return (
      <Container maxW="container.xl" py={8}>
        <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
          <Text fontSize="lg" color="red.500">
            An error occurred while loading the provider profile. Please try again later.
          </Text>
        </Box>
      </Container>
    );
  }
} 