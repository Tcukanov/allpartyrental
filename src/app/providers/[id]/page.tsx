import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma/client';
import MainLayout from '@/components/layout/MainLayout';
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

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const provider = await prisma.user.findUnique({
      where: { id: params.id },
      include: { profile: true }
    });

    if (!provider) {
      return {
        title: 'Provider Not Found',
        description: 'The requested provider could not be found.',
      };
    }

    return {
      title: `${provider.name} | Party Service Provider`,
      description: provider.profile?.description || `Find and book party services from ${provider.name}.`,
      openGraph: {
        title: `${provider.name} | Party Service Provider`,
        description: provider.profile?.description || `Find and book party services from ${provider.name}.`,
        type: 'profile',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Provider Profile',
      description: 'View provider details and services.',
    };
  }
}

export default async function ProviderProfilePage({ params }: { params: { id: string } }) {
  try {
    const provider = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        profile: true,
        services: {
          include: {
            category: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!provider) {
      notFound();
    }

    return (
      <MainLayout>
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
                  {provider.profile?.website && (
                    <Button
                      as="a"
                      href={provider.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      variant="outline"
                    >
                      Visit Website
                    </Button>
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
                <Tab>About</Tab>
                <Tab>Contact</Tab>
              </TabList>

              <TabPanels>
                {/* Services Tab */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {provider.services.map((service) => (
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
                              <Text color="gray.600">{service.category.name}</Text>
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

                {/* About Tab */}
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Heading size="md" mb={2}>About {provider.name}</Heading>
                      <Text>{provider.profile?.description || 'No description available.'}</Text>
                    </Box>

                    <Box>
                      <Heading size="md" mb={2}>Experience</Heading>
                      <Text>Member since {new Date(provider.createdAt).toLocaleDateString()}</Text>
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Contact Tab */}
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    {provider.profile?.phone && (
                      <Box>
                        <Heading size="md" mb={2}>Phone</Heading>
                        <Text>{provider.profile.phone}</Text>
                      </Box>
                    )}
                    <Box>
                      <Heading size="md" mb={2}>Email</Heading>
                      <Text>{provider.email}</Text>
                    </Box>
                    {provider.profile?.address && (
                      <Box>
                        <Heading size="md" mb={2}>Address</Heading>
                        <Text>{provider.profile.address}</Text>
                      </Box>
                    )}
                    {provider.profile?.website && (
                      <Box>
                        <Heading size="md" mb={2}>Website</Heading>
                        <Button
                          as="a"
                          href={provider.profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          colorScheme="brand"
                        >
                          Visit Website
                        </Button>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </MainLayout>
    );
  } catch (error) {
    console.error('Error fetching provider:', error);
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
            <Text fontSize="lg" color="red.500">
              An error occurred while loading the provider profile. Please try again later.
            </Text>
          </Box>
        </Container>
      </MainLayout>
    );
  }
} 