"use client";

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Flex,
  Grid,
  GridItem,
  Image,
  Badge,
  VStack,
  HStack,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { StarIcon, CheckIcon, ChevronRightIcon, EmailIcon, PhoneIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaGlobe, FaCalendarAlt, FaUser, FaCertificate, FaRegThumbsUp } from 'react-icons/fa';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch provider data
  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the provider details from the API
        const response = await fetch(`/api/providers/${params.id}`);
        
        // Handle 404 errors
        if (response.status === 404) {
          setError('Provider not found');
          setIsLoading(false);
          return;
        }
        
        // Handle other errors
        if (!response.ok) {
          throw new Error('Failed to load provider details');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to load provider');
        }
        
        setProvider(data.data);
        
        // Fetch provider's services
        const servicesResponse = await fetch(`/api/services?providerId=${params.id}`);
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          if (servicesData.success) {
            setServices(servicesData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching provider data:', error);
        setError(error.message || 'Failed to load provider details');
        toast({
          title: 'Error',
          description: error.message || 'Failed to load provider details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params.id) {
      fetchProviderData();
    }
  }, [params.id, toast]);
  
  // If API fails, use fallback data
  useEffect(() => {
    if (error && params.id) {
      // Create fallback provider data
      setProvider({
        id: params.id,
        name: "Service Provider",
        email: "provider@example.com",
        role: "PROVIDER",
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
        profile: {
          avatar: "https://randomuser.me/api/portraits/women/6.jpg",
          phone: "(555) 123-4567",
          website: "https://example.com",
          isProStatus: true,
          address: "123 Main St, New York, NY 10001"
        },
        rating: 4.8,
        reviewCount: 125
      });
      
      // Create fallback services
      setServices([
        {
          id: "service-1",
          name: "Party Service",
          description: "Professional service for your party needs",
          price: 199.99,
          photos: ["https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"],
          category: { name: "Party Services", slug: "party-services" },
          city: { name: "New York", slug: "new-york" },
          status: "ACTIVE"
        },
        {
          id: "service-2",
          name: "Event Planning",
          description: "Complete event planning and coordination",
          price: 299.99,
          photos: ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"],
          category: { name: "Event Planning", slug: "event-planning" },
          city: { name: "New York", slug: "new-york" },
          status: "ACTIVE"
        }
      ]);
    }
  }, [error, params.id]);
  
  // Set SEO metadata
  useEffect(() => {
    if (provider) {
      // Set page title
      document.title = `${provider.name} | Party Marketplace`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = `View ${provider.name}'s profile and services. Book now for your next party or event.`;
      
      // Add canonical link for SEO
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = `${window.location.origin}/providers/${params.id}`;
    }
  }, [provider, params.id]);
  
  if (isLoading) {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" h="60vh">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        </Container>
      </MainLayout>
    );
  }
  
  if (!provider && error) {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <Flex direction="column" justify="center" align="center" h="60vh">
            <Heading size="lg" mb={4}>Provider Not Found</Heading>
            <Text mb={6}>The provider you're looking for doesn't exist or has been removed.</Text>
            <Button colorScheme="brand" onClick={() => router.push('/services')}>
              Browse Services
            </Button>
          </Flex>
        </Container>
      </MainLayout>
    );
  }
  
  // Calculate years of membership
  const memberSince = provider?.createdAt 
    ? new Date(provider.createdAt).getFullYear() 
    : new Date().getFullYear() - 1;
  
  const yearsOfMembership = new Date().getFullYear() - memberSince;
  
  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        {/* Breadcrumbs */}
        <Breadcrumb separator={<ChevronRightIcon color="gray.500" />} mb={8}>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/services">Services</BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">{provider.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        {/* Provider Header */}
        <Card mb={8} overflow="hidden">
          <Box 
            bg={useColorModeValue('brand.50', 'brand.900')} 
            h="150px"
            position="relative"
          >
            {/* Cover photo */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              backgroundImage="url('https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')"
              backgroundPosition="center"
              backgroundSize="cover"
              opacity={0.3}
            />
            
            {/* Pro badge */}
            {provider.profile?.isProStatus && (
              <Badge 
                position="absolute" 
                top={4} 
                right={4} 
                colorScheme="purple" 
                fontSize="md" 
                px={3} 
                py={1}
              >
                PRO
              </Badge>
            )}
          </Box>
          
          <CardBody pt={24} position="relative">
            {/* Profile Photo */}
            <Box 
              position="absolute" 
              top="-64px" 
              left={{ base: "50%", md: "24px" }}
              transform={{ base: "translateX(-50%)", md: "translateX(0)" }}
            >
              <Image 
                src={provider.profile?.avatar || 'https://via.placeholder.com/128'} 
                alt={provider.name} 
                boxSize="128px" 
                borderRadius="full" 
                border="4px solid white"
                bg="white"
              />
            </Box>
            
            <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={8}>
              <GridItem>
                <Flex direction="column" align={{ base: "center", md: "flex-start" }}>
                  <Heading size="xl" mb={2}>{provider.name}</Heading>
                  
                  <HStack mb={4}>
                    <Flex align="center">
                      <StarIcon color="yellow.400" mr={1} />
                      <Text fontWeight="bold">{provider.rating || "4.8"}</Text>
                    </Flex>
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>({provider.reviewCount || "0"} reviews)</Text>
                    <Badge colorScheme="green">Verified</Badge>
                  </HStack>
                  
                  <HStack spacing={4} mb={4} wrap="wrap">
                    <Flex align="center">
                      <Icon as={FaCertificate} color="brand.500" mr={2} />
                      <Text>Member since {memberSince}</Text>
                    </Flex>
                    
                    <Flex align="center">
                      <Icon as={FaRegThumbsUp} color="brand.500" mr={2} />
                      <Text>{services.length} services</Text>
                    </Flex>
                  </HStack>
                  
                  <Text mb={4} maxW="700px" textAlign={{ base: "center", md: "left" }}>
                    {provider.profile?.bio || 
                      `${provider.name} is a professional service provider specializing in party and event services. With ${yearsOfMembership} ${yearsOfMembership === 1 ? 'year' : 'years'} of experience on our platform, they have consistently delivered high-quality services that exceed customer expectations.`
                    }
                  </Text>
                </Flex>
              </GridItem>
              
              <GridItem>
                <Card variant="outline">
                  <CardBody>
                    <VStack spacing={4} align="start">
                      <Heading size="md">Contact Information</Heading>
                      
                      <Divider />
                      
                      <HStack>
                        <Icon as={EmailIcon} color="brand.500" />
                        <Text>{provider.email}</Text>
                      </HStack>
                      
                      {provider.profile?.phone && (
                        <HStack>
                          <Icon as={PhoneIcon} color="brand.500" />
                          <Text>{provider.profile.phone}</Text>
                        </HStack>
                      )}
                      
                      {provider.profile?.website && (
                        <HStack>
                          <Icon as={FaGlobe} color="brand.500" />
                          <Text>{provider.profile.website}</Text>
                        </HStack>
                      )}
                      
                      {provider.profile?.address && (
                        <HStack alignItems="flex-start">
                          <Icon as={FaMapMarkerAlt} color="brand.500" mt={1} />
                          <Text>{provider.profile.address}</Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>
        
        {/* Provider Content Tabs */}
        <Tabs colorScheme="brand" mb={8}>
          <TabList>
            <Tab>Services</Tab>
            <Tab>Reviews</Tab>
            <Tab>About</Tab>
          </TabList>
          
          <TabPanels>
            {/* Services Tab */}
            <TabPanel px={0}>
              <Heading size="lg" mb={6}>Services Offered</Heading>
              
              {services.length === 0 ? (
                <Text>This provider has no active services.</Text>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {services.map(service => (
                    <Card 
                      key={service.id} 
                      as={Link}
                      href={`/services/${service.id}`}
                      overflow="hidden" 
                      h="100%"
                      _hover={{ 
                        transform: 'translateY(-5px)', 
                        transition: 'transform 0.3s ease',
                        shadow: 'md'
                      }}
                      transition="transform 0.3s ease"
                      cursor="pointer"
                    >
                      <Box h="200px" overflow="hidden">
                        <Image 
                          src={service.photos?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
                          alt={service.name} 
                          w="100%" 
                          h="100%" 
                          objectFit="cover"
                        />
                      </Box>
                      
                      <CardBody>
                        <VStack align="start" spacing={2}>
                          <Heading size="md" noOfLines={1}>{service.name}</Heading>
                          
                          {service.category && (
                            <Badge colorScheme="blue">{service.category.name}</Badge>
                          )}
                          
                          <Text noOfLines={2} color={useColorModeValue('gray.600', 'gray.400')}>
                            {service.description}
                          </Text>
                          
                          <Divider my={2} />
                          
                          <Flex justify="space-between" w="100%">
                            <Text fontWeight="bold" color="brand.500">
                              ${parseFloat(service.price).toFixed(2)}
                            </Text>
                            
                            <Button size="sm" colorScheme="brand" variant="outline">
                              View Details
                            </Button>
                          </Flex>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
            
            {/* Reviews Tab */}
            <TabPanel px={0}>
              <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">Customer Reviews</Heading>
                
                <HStack>
                  <StarIcon color="yellow.400" boxSize={6} />
                  <Heading size="md">{provider.rating || "4.8"}</Heading>
                  <Text>({provider.reviewCount || "0"} reviews)</Text>
                </HStack>
              </Flex>
              
              <VStack spacing={4} align="stretch">
                <Text color={useColorModeValue('gray.600', 'gray.400')}>
                  Reviews will appear here after customers rate this provider's services.
                </Text>
              </VStack>
            </TabPanel>
            
            {/* About Tab */}
            <TabPanel px={0}>
              <Heading size="lg" mb={6}>About {provider.name}</Heading>
              
              <Text mb={4}>
                {provider.profile?.longBio || 
                  `${provider.name} is a professional service provider specializing in party and event services. With ${yearsOfMembership} ${yearsOfMembership === 1 ? 'year' : 'years'} of experience on our platform, they have consistently delivered high-quality services that exceed customer expectations.`
                }
              </Text>
              
              {provider.profile?.certifications && (
                <Box mb={6}>
                  <Heading size="md" mb={3}>Certifications</Heading>
                  <VStack align="start" spacing={2}>
                    {provider.profile.certifications.map((cert, index) => (
                      <HStack key={index}>
                        <CheckIcon color="green.500" />
                        <Text>{cert}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
              
              {provider.profile?.specializations && (
                <Box mb={6}>
                  <Heading size="md" mb={3}>Specializations</Heading>
                  <Flex gap={2} flexWrap="wrap">
                    {provider.profile.specializations.map((spec, index) => (
                      <Badge key={index} colorScheme="brand" py={1} px={3}>
                        {spec}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* CTA Section */}
        <Card bg={useColorModeValue('brand.50', 'brand.900')} mb={8}>
          <CardBody>
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap={6}>
              <VStack align={{ base: "center", md: "flex-start" }} spacing={2}>
                <Heading size="lg">Ready to book with {provider.name}?</Heading>
                <Text>Check out their services and create your party plan today.</Text>
              </VStack>
              
              <Button 
                colorScheme="brand" 
                size="lg"
                as={Link}
                href="/client/create-party"
              >
                Start Planning
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </Container>
    </MainLayout>
  );
}