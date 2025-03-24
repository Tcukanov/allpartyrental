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
  useToast,
  Spinner
} from '@chakra-ui/react';
import { StarIcon, CheckIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaCalendarAlt, FaUser, FaPhoneAlt, FaEnvelope, FaGlobe, FaClock } from 'react-icons/fa';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

// Fallback service data in case API isn't ready
const fallbackService = {
  id: '6',
  name: 'Combo Bounce House',
  provider: {
    id: 'provider-2',
    name: 'Party Rentals',
    email: 'info@partyrentals.example.com',
    profile: {
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      phone: '(212) 555-5678',
      website: 'https://partyrentals.example.com',
      isProStatus: true
    },
    isPro: true,
    isVerified: true,
    rating: 4.7,
    reviewCount: 85,
    since: '2019'
  },
  category: {
    id: 'category-7',
    name: 'Bounce Houses',
    slug: 'bounce-houses'
  },
  city: {
    id: 'city-1',
    name: 'New York',
    slug: 'new-york',
    state: 'NY'
  },
  description: 'Combo bounce house with slide and obstacles. Perfect for active kids who love to climb, bounce, and slide. Includes professional setup and takedown.',
  price: 299.99,
  photos: [
    'https://images.unsplash.com/photo-1663486630748-d6cb7fda0fe8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    'https://images.unsplash.com/photo-1560486983-bdd71948121e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1467&q=80',
    'https://images.unsplash.com/photo-1626264146553-9ab43ad0546e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  ],
  features: [
    'Setup and takedown included',
    'Accommodates up to 8 children',
    'Includes slide and obstacles',
    'Safety-certified construction',
    'Perfect for ages 3-12',
    "Requires 18' x 18' space"

  ],
  availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
};

// Fallback similar services
const fallbackSimilarServices = [
  {
    id: '4',
    name: 'Standard Bounce House',
    provider: 'Jump Around',
    rating: 4.9,
    price: 199.99,
    photos: ['https://images.unsplash.com/photo-1573982680571-f6e9a8a5850b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80']
  },
  {
    id: '5',
    name: 'Water Slide',
    provider: 'Jump Around',
    rating: 4.8,
    price: 249.99,
    photos: ['https://images.unsplash.com/photo-1558181409-4fa124ccbda4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80']
  },
  {
    id: '7',
    name: 'Princess Castle Bounce House',
    provider: 'Royal Rentals',
    rating: 4.9,
    price: 249.99,
    photos: ['https://images.unsplash.com/photo-1560486983-bdd71948121e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1467&q=80']
  }
];

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  
  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [similarServices, setSimilarServices] = useState([]);
  const [fetchError, setFetchError] = useState(false);
  
  // Fetch service data from database or use fallback
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch from API
        const response = await fetch(`/api/services/${params.id}`);
        
        // If API fails, use fallback data
        if (!response.ok) {
          // Check if we have fallback data for this ID
          if (params.id === '6') {
            console.log('Using fallback data for service ID 6');
            setService(fallbackService);
            setSimilarServices(fallbackSimilarServices);
          } else if (fallbackSimilarServices.find(s => s.id === params.id)) {
            // If we have this ID in our fallback similar services
            const fallbackService = fallbackSimilarServices.find(s => s.id === params.id);
            setService({
              ...fallbackService,
              category: { id: 'category-7', name: 'Bounce Houses', slug: 'bounce-houses' },
              city: { id: 'city-1', name: 'New York', slug: 'new-york', state: 'NY' },
              features: ['Setup and takedown included', 'Sanitized before each use', 'Easy to set up and take down'],
              availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            });
            
            // Use other services as similar
            setSimilarServices(fallbackSimilarServices.filter(s => s.id !== params.id));
          } else {
            throw new Error('Service not found');
          }
        } else {
          // If API succeeds, use the data
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error?.message || 'Failed to load service');
          }
          
          setService(data.data);
          
          // Try to fetch similar services
          try {
            const similarResponse = await fetch(`/api/services?categoryId=${data.data.categoryId}&limit=3&exclude=${params.id}`);
            if (similarResponse.ok) {
              const similarData = await similarResponse.json();
              if (similarData.success) {
                setSimilarServices(similarData.data);
              } else {
                // Use fallback similar services if API fails
                setSimilarServices(fallbackSimilarServices.filter(s => s.id !== params.id));
              }
            } else {
              // Use fallback similar services if API fails
              setSimilarServices(fallbackSimilarServices.filter(s => s.id !== params.id));
            }
          } catch (error) {
            console.error('Error fetching similar services:', error);
            // Use fallback similar services if API fails
            setSimilarServices(fallbackSimilarServices.filter(s => s.id !== params.id));
          }
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        setFetchError(true);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load service details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params.id) {
      fetchServiceData();
    }
  }, [params.id, toast]);
  
  // Handle booking request
  const handleBookNow = () => {
    router.push(`/client/create-party?service=${service.id}`);
  };
  
  // Set SEO metadata
  useEffect(() => {
    if (service) {
      // Set page title
      document.title = `${service.name} in ${service.city.name} | Party Marketplace`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = `${service.name} in ${service.city.name}. ${service.description.substring(0, 150)}...`;
      
      // Add canonical link for SEO
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = `${window.location.origin}/services/${params.id}`;
    }
  }, [service, params.id]);
  
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
  
  if (fetchError || !service) {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <Flex direction="column" justify="center" align="center" h="60vh">
            <Heading size="lg" mb={4}>Service Not Found</Heading>
            <Text mb={6}>The service you're looking for doesn't exist or has been removed.</Text>
            <Button colorScheme="brand" onClick={() => router.push('/services')}>
              Browse All Services
            </Button>
          </Flex>
        </Container>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        {/* Breadcrumbs */}
        <Breadcrumb separator={<ChevronRightIcon color="gray.500" />} mb={4}>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/services">Services</BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href={`/services/categories/${service.category.slug}`}>
              {service.category.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href={`/services/categories/${service.category.slug}/${service.city.slug}`}>
              {service.category.name} in {service.city.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">{service.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        {/* Service Details */}
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* Left Column - Service Info */}
          <GridItem>
            {/* Image Gallery */}
            <Box mb={6}>
              <Box 
                position="relative" 
                borderRadius="lg" 
                overflow="hidden" 
                height={{ base: "300px", md: "400px" }}
                mb={4}
              >
                <Image 
                  src={service.photos[selectedImage]} 
                  alt={service.name} 
                  w="100%" 
                  h="100%" 
                  objectFit="cover"
                />
              </Box>
              
              <Flex gap={2} overflowX="auto" pb={2}>
                {service.photos.map((photo, index) => (
                  <Box 
                    key={index} 
                    borderWidth="2px" 
                    borderColor={selectedImage === index ? "brand.500" : "transparent"} 
                    borderRadius="md" 
                    overflow="hidden" 
                    cursor="pointer"
                    onClick={() => setSelectedImage(index)}
                    flexShrink={0}
                    transition="border-color 0.2s"
                    _hover={{ borderColor: "brand.200" }}
                  >
                    <Image 
                      src={photo} 
                      alt={`${service.name} - Image ${index + 1}`} 
                      width="100px" 
                      height="75px" 
                      objectFit="cover"
                    />
                  </Box>
                ))}
              </Flex>
            </Box>
            
            {/* Service Description */}
            <Box mb={8}>
              <Heading as="h2" size="lg" mb={4}>Description</Heading>
              <Text mb={4}>{service.description}</Text>
              
              {service.longDescription && (
                <Box mt={6}>
                  {service.longDescription.split('\n\n').map((paragraph, index) => {
                    // Handle Markdown-style headings
                    if (paragraph.startsWith('# ')) {
                      return (
                        <Heading as="h2" size="md" mt={6} mb={3} key={index}>
                          {paragraph.substring(2)}
                        </Heading>
                      );
                    } else if (paragraph.startsWith('## ')) {
                      return (
                        <Heading as="h3" size="sm" mt={5} mb={2} key={index}>
                          {paragraph.substring(3)}
                        </Heading>
                      );
                    } else {
                      return (
                        <Text mb={4} key={index}>
                          {paragraph}
                        </Text>
                      );
                    }
                  })}
                </Box>
              )}
            </Box>
            
            {/* Features */}
            {service.features && service.features.length > 0 && (
              <Box mb={8}>
                <Heading as="h2" size="lg" mb={4}>Features</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {service.features.map((feature, index) => (
                    <HStack key={index} alignItems="center">
                      <CheckIcon color="green.500" />
                      <Text>{feature}</Text>
                    </HStack>
                  ))}
                </SimpleGrid>
              </Box>
            )}
            
            {/* Availability */}
            {service.availability && service.availability.length > 0 && (
              <Box mb={8}>
                <Heading as="h2" size="lg" mb={4}>Availability</Heading>
                <Flex wrap="wrap" gap={2}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <Badge 
                      key={day} 
                      py={2} 
                      px={4}
                      borderRadius="full"
                      colorScheme={service.availability.includes(day) ? "green" : "gray"}
                    >
                      {day}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}
            
            {/* Reviews */}
            {service.reviews && service.reviews.length > 0 && (
              <Box mb={8}>
                <Heading as="h2" size="lg" mb={4}>Customer Reviews</Heading>
                
                <VStack spacing={4} align="stretch">
                  {service.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardBody>
                        <VStack align="start" spacing={2}>
                          <Flex justify="space-between" w="100%">
                            <HStack>
                              <Heading size="sm">{review.userName}</Heading>
                              <Text color="gray.500" fontSize="sm">{review.date}</Text>
                            </HStack>
                            <HStack>
                              {Array(5).fill('').map((_, i) => (
                                <StarIcon
                                  key={i}
                                  color={i < review.rating ? 'yellow.400' : 'gray.300'}
                                />
                              ))}
                            </HStack>
                          </Flex>
                          <Text>{review.content}</Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </Box>
            )}
          </GridItem>
          
          {/* Right Column - Booking & Provider */}
          <GridItem>
            {/* Price Card */}
            <Card mb={6}>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="xl" color="brand.600">${parseFloat(service.price).toFixed(2)}</Heading>
                  <Button colorScheme="brand" size="lg" onClick={handleBookNow}>
                    Book Now
                  </Button>
                  
                  <Divider />
                  
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Icon as={FaMapMarkerAlt} color="brand.500" />
                      <Text>{service.city.name}, {service.city.state}</Text>
                    </HStack>
                    {service.availability && (
                      <HStack>
                        <Icon as={FaCalendarAlt} color="brand.500" />
                        <Text>Available {service.availability.length} days/week</Text>
                      </HStack>
                    )}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
            
            {/* Provider Card */}
            {service.provider && (
              <Card mb={6}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Flex align="center">
                      <Image 
                        src={service.provider.profile?.avatar || 'https://via.placeholder.com/60'} 
                        alt={service.provider.name} 
                        borderRadius="full" 
                        boxSize="60px" 
                        mr={4}
                      />
                      <Box>
                        <Heading size="md">{service.provider.name}</Heading>
                        {service.provider.rating && (
                          <HStack>
                            <HStack>
                              <StarIcon color="yellow.400" />
                              <Text>{service.provider.rating}</Text>
                            </HStack>
                            {service.provider.reviewCount && (
                              <Text color="gray.500">({service.provider.reviewCount} reviews)</Text>
                            )}
                          </HStack>
                        )}
                      </Box>
                    </Flex>
                    
                    {(service.provider.isVerified || service.provider.isPro || service.provider.since) && (
                      <Flex wrap="wrap" gap={2}>
                        {service.provider.isVerified && (
                          <Badge colorScheme="green">Verified</Badge>
                        )}
                        {service.provider.isPro && (
                          <Badge colorScheme="purple">PRO</Badge>
                        )}
                        {service.provider.since && (
                          <Badge>Member since {service.provider.since}</Badge>
                        )}
                      </Flex>
                    )}
                    
                    <Divider />
                    
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Icon as={FaUser} color="brand.500" />
                        <Text fontWeight="bold">Contact Information</Text>
                      </HStack>
                      {service.provider.profile?.phone && (
                        <HStack>
                          <Icon as={FaPhoneAlt} color="brand.500" />
                          <Text>{service.provider.profile.phone}</Text>
                        </HStack>
                      )}
                      <HStack>
                        <Icon as={FaEnvelope} color="brand.500" />
                        <Text>{service.provider.email}</Text>
                      </HStack>
                      {service.provider.profile?.website && (
                        <HStack>
                          <Icon as={FaGlobe} color="brand.500" />
                          <Text>{service.provider.profile.website}</Text>
                        </HStack>
                      )}
                    </VStack>
                    
                    <Button 
                      variant="outline" 
                      colorScheme="brand" 
                      w="100%"
                      as={Link}
                      href={`/providers/${service.provider.id}`}
                    >
                      View Profile
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}
            
            {/* Similar Services */}
            {similarServices.length > 0 && (
              <Box>
                <Heading as="h3" size="md" mb={4}>Similar Services</Heading>
                <VStack spacing={4} align="stretch">
                  {similarServices.map((similarService) => (
                    <Card key={similarService.id} 
                      as={Link} 
                      href={`/services/${similarService.id}`}
                      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <Flex>
                        <Image 
                          src={(similarService.photos && similarService.photos[0]) || 'https://via.placeholder.com/80'} 
                          alt={similarService.name} 
                          w="80px" 
                          h="80px" 
                          objectFit="cover"
                          borderLeftRadius="md"
                        />
                        <Box p={3} flex="1">
                          <Heading size="sm" mb={1}>{similarService.name}</Heading>
                          <HStack justify="space-between">
                            <Text fontWeight="bold" color="brand.600">
                              ${parseFloat(similarService.price).toFixed(2)}
                            </Text>
                            {similarService.rating && (
                              <HStack>
                                <StarIcon color="yellow.400" boxSize="12px" />
                                <Text fontSize="sm">{similarService.rating}</Text>
                              </HStack>
                            )}
                          </HStack>
                        </Box>
                      </Flex>
                    </Card>
                  ))}
                </VStack>
              </Box>
            )}
          </GridItem>
        </Grid>
      </Container>
    </MainLayout>
  );
}