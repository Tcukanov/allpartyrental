"use client";

import React from 'react';
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
  Spinner,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Collapse,
  useDisclosure,
  Stack,
  Skeleton
} from '@chakra-ui/react';
import { StarIcon, CheckIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaCalendarAlt, FaUser, FaPhoneAlt, FaEnvelope, FaGlobe } from 'react-icons/fa';
import { FiClock, FiCalendar, FiDollarSign, FiMapPin } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from 'next-auth/react';
import ServiceRequestButton from '@/components/services/ServiceRequestButton';
import { getSession } from 'next-auth/react';

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

export default function ServiceDetailPage({ params }) {
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();
  const { isOpen, onToggle } = useDisclosure();
  
  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [similarServices, setSimilarServices] = useState([]);
  const [fetchError, setFetchError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  
  // For client components, use React.use() to unwrap the params Promise
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  
  // Set user role from session
  useEffect(() => {
    if (session?.user) {
      setUserRole(session.user.role);
    } else {
      setUserRole(null);
    }
  }, [session]);
  
  // Fetch service data from database or use fallback
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setIsLoading(true);
        let data = null;
        
        // Try to fetch from API
        const response = await fetch(`/api/services/${id}`);
        
        // If API fails, use fallback data
        if (!response.ok) {
          // Check if we have fallback data for this ID
          if (id === '6') {
            console.log('Using fallback data for service ID 6');
            setService(fallbackService);
            setSimilarServices(fallbackSimilarServices);
            
            // Set isOwner to false for fallback data
            setIsOwner(false);
          } else if (fallbackSimilarServices.find(s => s.id === id)) {
            // If we have this ID in our fallback similar services
            const fallbackService = fallbackSimilarServices.find(s => s.id === id);
            setService({
              ...fallbackService,
              category: { id: 'category-7', name: 'Bounce Houses', slug: 'bounce-houses' },
              city: { id: 'city-1', name: 'New York', slug: 'new-york', state: 'NY' },
              features: ['Setup and takedown included', 'Sanitized before each use', 'Easy to set up and take down'],
              availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            });
            
            // Use other services as similar
            setSimilarServices(fallbackSimilarServices.filter(s => s.id !== id));
            
            // Set isOwner to false for fallback data
            setIsOwner(false);
          } else {
            throw new Error('Service not found');
          }
        } else {
          // If API succeeds, use the data
          data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error?.message || 'Failed to load service');
          }
          
          setService(data.data);
          
          // Check if user is the owner of this service
          if (session?.user && session.user.id === data.data.providerId) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
          }
          
          // Fetch similar services (same category)
          await fetchSimilarServices(data.data.categoryId, data.data.id);
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        setFetchError(true);
        toast({
          title: 'Error',
          description: 'Failed to load the service details. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchServiceData();
    }
  }, [id, session, toast]);
  
  // Function to fetch similar services based on category
  const fetchSimilarServices = async (categoryId, currentServiceId) => {
    try {
      if (!categoryId) return;
      
      const response = await fetch(`/api/services/public?categoryId=${categoryId}&limit=4`);
      
      if (!response.ok) {
        console.error('Failed to fetch similar services:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Filter out the current service and limit to 3 services
        const filtered = data.data
          .filter(service => service.id !== currentServiceId)
          .slice(0, 3);
          
        setSimilarServices(filtered);
      }
    } catch (error) {
      console.error('Error fetching similar services:', error);
    }
  };
  
  // Function to extract filter values from service metadata
  const extractFilterValues = (service) => {
    if (!service || !service.metadata) return {};
    
    try {
      if (typeof service.metadata === 'string') {
        const metadata = JSON.parse(service.metadata);
        return metadata.filterValues || {};
      }
      
      return {};
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return {};
    }
  };
  
  // Function to get a more readable display for filter values
  const getFilterDisplay = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return value;
  };
  
  // Handle booking request
  const handleSendRequest = async (e) => {
    e.preventDefault();
    
    try {
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to request this service",
          status: "error",
          duration: 3000,
          isClosable: true
        });
        router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/services/${id}`)}`);
        return;
      }

      setIsSubmitting(true);
      
      // Format the message using the form input or default message
      const messageToSend = requestMessage || `I'm interested in booking ${service.name}. Can we discuss details?`;
      
      console.log("Sending service request:", {
        serviceId: service.id,
        message: messageToSend,
        requestDate: requestDate || undefined
      });
      
      const response = await fetch('/api/provider/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceId: service.id,
          message: messageToSend,
          requestDate: requestDate || undefined
        })
      });
      
      const result = await response.json();
      console.log("Service request response:", result);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to send request');
      }
      
      toast({
        title: "Request sent!",
        description: "We've notified the provider. Check your messages for their response.",
        status: "success",
        duration: 5000,
        isClosable: true
      });
      
      // Navigate to the chats page with the created chat
      if (result.data && result.data.chat && result.data.chat.id) {
        console.log("Redirecting to chat:", `/chats/${result.data.chat.id}`);
        
        // Small delay to ensure toast is shown before navigation
        setTimeout(() => {
          router.push(`/chats/${result.data.chat.id}`);
        }, 500);
      } else {
        console.error('Chat ID not found in response', result);
        toast({
          title: "Navigation error",
          description: "Chat created but couldn't navigate to it. Please check your messages.",
          status: "warning",
          duration: 5000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Error sending service request:', error);
      toast({
        title: "Request failed",
        description: error.message || "Failed to send request. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Set SEO metadata
  useEffect(() => {
    if (service) {
      // Get location
      const locationName = service.city?.name || 
                          (service.provider?.provider?.businessCity ? 
                            service.provider.provider.businessCity : 
                            'Any Location');

      // Set page title
      document.title = `${service.name} in ${locationName} | Party Marketplace`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = `${service.name} in ${locationName}. ${service.description.substring(0, 150)}...`;
      
      // Add canonical link for SEO
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = `${window.location.origin}/services/${id}`;
    }
  }, [service, id]);
  
  if (isLoading) {
    return (
      <Container maxW="container.lg" py={10}>
        <Stack spacing={8}>
          <Skeleton height="300px" />
          <Skeleton height="40px" />
          <Skeleton height="20px" />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </SimpleGrid>
          <Skeleton height="200px" />
        </Stack>
        </Container>
    );
  }
  
  if (fetchError || !service) {
    return (
      <Container maxW="container.lg" py={10} textAlign="center">
        <Heading>Service not found</Heading>
        <Text mt={4}>The service you're looking for doesn't exist or has been removed.</Text>
        </Container>
    );
  }
  
  return (
    <Container maxW="container.lg" py={10}>
      <Box mb={8}>
        {service.photos && service.photos.length > 0 ? (
                <Image 
                  src={service.photos[selectedImage]} 
                  alt={service.name} 
                  w="100%" 
            h={{ base: "200px", md: "400px" }}
                  objectFit="cover"
            borderRadius="md"
                  fallback={
                    <Box
                      bg="gray.200"
                      w="100%"
                      h={{ base: "200px", md: "400px" }}
                      borderRadius="md" 
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="gray.500">No image available</Text>
                    </Box>
                  }
          />
        ) : (
          <Box
            bg="gray.200"
            w="100%"
            h={{ base: "200px", md: "400px" }}
            borderRadius="md" 
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="gray.500">No image available</Text>
              </Box>
        )}
              
        {/* Thumbnail gallery */}
        {service.photos && service.photos.length > 1 && (
          <SimpleGrid columns={Math.min(service.photos.length, 5)} spacing={2} mt={2}>
                {service.photos.map((photo, index) => (
                  <Box 
                    key={index} 
                cursor="pointer" 
                borderWidth={selectedImage === index ? "2px" : "0px"}
                borderColor="blue.500"
                    borderRadius="md" 
                    onClick={() => setSelectedImage(index)}
                  >
                    <Image 
                      src={photo} 
                  alt={`${service.name} ${index + 1}`}
                  height="60px"
                  width="100%"
                      objectFit="cover"
                  borderRadius="md"
                    />
                  </Box>
                ))}
          </SimpleGrid>
        )}
            </Box>
            
      <Stack spacing={6}>
        <Flex justify="space-between" align="flex-start" wrap="wrap">
          <Box flex="1" mr={4} mb={4}>
            <Heading as="h1" size="xl" mb={2}>
              {service.name}
                        </Heading>
            
            <Flex align="center" mb={2}>
              <Icon as={FaUser} mr={2} color="blue.500" />
              <Text fontWeight="medium">
                {service.provider?.name || 'Service Provider'}
              </Text>
            </Flex>
            
            <Flex wrap="wrap" mb={4}>
              {service.category && (
                <Badge colorScheme="blue" mr={2} mb={2}>
                  {service.category.name}
                </Badge>
              )}
              {service.tags && service.tags.map(tag => (
                <Badge key={tag} colorScheme="gray" mr={2} mb={2}>
                  {tag}
                    </Badge>
                  ))}
                </Flex>
              </Box>
          
          <Box width={{ base: "100%", md: "auto" }} mb={4}>
            <Stack spacing={4} bg="" p={6} borderRadius="md" width={{ base: "100%", md: "300px" }} boxShadow="sm">
              <Box mb={2}>
                <Flex justifyContent="center" alignItems="center">
                  <Box
                    bg="brand.50"
                    px={4} 
                    py={3} 
                    borderRadius="lg"
                    width="100%"
                    textAlign="center"
                  >
                    <Heading size="lg" color="brand.600">${Number(service.price).toFixed(2)}</Heading>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      {service.priceType === 'HOURLY' ? 'per hour' : service.priceType === 'DAILY' ? 'per day' : 'flat rate'}
                    </Text>
                  </Box>
                </Flex>
              </Box>
                    
              {service.city && (
                <Flex align="center">
                  <Icon as={FiMapPin} mr={2} color="red.500" />
                  <Text>{service.city.name}</Text>
                </Flex>
              )}
              
              {!service.city && service.provider?.provider?.businessCity && (
                <Flex align="center">
                  <Icon as={FiMapPin} mr={2} color="red.500" />
                  <Text>{service.provider.provider.businessCity}{service.provider.provider.businessState ? `, ${service.provider.provider.businessState}` : ''}</Text>
                </Flex>
              )}
              
              {service.availability && (
                <Flex align="center">
                  <Icon as={FiCalendar} mr={2} color="purple.500" />
                  <Text>{service.availability}</Text>
                </Flex>
              )}
              
              {service.duration && (
                <Flex align="center">
                  <Icon as={FiClock} mr={2} color="orange.500" />
                  <Text>{service.duration}</Text>
                      </Flex>
                    )}
                    
              {!isOwner && session && session.user.role === 'CLIENT' && (
                <ServiceRequestButton 
                  service={{
                    ...service,
                    providerId: service.provider?.id
                  }} 
                />
              )}
              
              {isOwner && (
                <Button colorScheme="teal" width="full">
                  Edit Service
                    </Button>
              )}
              
              {!session && (
                <Button colorScheme="blue" width="full" as="a" href={`/api/auth/signin?callbackUrl=${encodeURIComponent(`/services/${id}`)}`}>
                  Login to Request
                </Button>
              )}
            </Stack>
                        </Box>
                      </Flex>

        <Divider />
        
        <Box>
          <Heading as="h2" size="md" mb={4}>
            Description
          </Heading>
          <Text whiteSpace="pre-wrap">{service.description}</Text>
        </Box>
        
        {/* Service Specifications */}
        <Box>
          <Heading as="h2" size="md" mb={4}>
            Specifications
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {/* Colors */}
            {service.colors && service.colors.length > 0 && (
              <Box p={4} borderWidth="1px" borderRadius="md">
                <Heading as="h3" size="sm" mb={3}>
                  Available Colors
                </Heading>
                <Flex wrap="wrap" gap={2}>
                  {service.colors.map((color, index) => (
                    <Badge 
                      key={index} 
                      px={2} 
                      py={1} 
                      borderRadius="full"
                      bg={`${color.toLowerCase()}.100`}
                      color={`${color.toLowerCase()}.800`}
                    >
                      {color}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}
            
            {/* Category Filters */}
            {service.metadata && (
              <>
                {Object.entries(extractFilterValues(service)).map(([filterId, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;
                  
                  // Create a formatted filter name from the ID
                  const filterName = filterId.split('-').map(
                    word => word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ');
                  
                  return (
                    <Box key={filterId} p={4} borderWidth="1px" borderRadius="md">
                      <Heading as="h3" size="sm" mb={3}>
                        {filterName}
                      </Heading>
                      <Text>
                        {getFilterDisplay(value)}
                      </Text>
                    </Box>
                  );
                })}
              </>
            )}
          </SimpleGrid>
        </Box>
        
        {service.features && service.features.length > 0 && (
          <Box>
            <Heading as="h2" size="md" mb={4}>
              What's Included
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {service.features.map((feature, index) => (
                <Flex key={index} align="center">
                  <Box as="span" w={2} h={2} bg="blue.500" borderRadius="full" mr={2}></Box>
                  <Text>{feature}</Text>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        )}
                  
                  <Divider />
                  
            {service.provider && (
          <Box>
            <Heading as="h2" size="md" mb={4}>
              About the Provider
            </Heading>
            <Flex align="center" mb={4}>
              {service.provider.profile?.avatar ? (
                <Image 
                  src={service.provider.profile.avatar} 
                  alt={service.provider.name} 
                  boxSize="80px"
                  borderRadius="full" 
                  mr={4}
                  fallback={
                    <Box
                      bg="blue.100"
                      color="blue.500"
                      borderRadius="full"
                      boxSize="80px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="2xl"
                      fontWeight="bold"
                      mr={4}
                    >
                      {service.provider.name?.charAt(0) || "?"}
                    </Box>
                  }
                />
              ) : (
                <Box
                  bg="blue.100"
                  color="blue.500"
                  borderRadius="full"
                  boxSize="80px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  fontWeight="bold"
                  mr={4}
                >
                  {service.provider.name?.charAt(0) || "?"}
                </Box>
              )}
              <Box>
                <Heading size="md" mb={1}>
                  {service.provider.profile?.contactPerson || service.provider.name}
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  {service.provider.name}
                </Text>
                <HStack spacing={2} mb={1}>
                  {service.provider.isVerified && (
                    <Badge colorScheme="green">Verified</Badge>
                  )}
                  {service.provider.isPro && (
                    <Badge colorScheme="purple">Pro</Badge>
                  )}
                </HStack>
                {service.provider.since && (
                  <Text fontSize="sm" color="gray.600">Member since {service.provider.since}</Text>
                )}
              </Box>
            </Flex>
            
            {service.provider.rating && (
              <Flex align="center" mb={2}>
                <Flex align="center" mr={2}>
                  {Array(5).fill('').map((_, i) => (
                    <StarIcon
                      key={i}
                      color={i < Math.floor(service.provider.rating) ? 'yellow.400' : 'gray.300'}
                      mr={0.5}
                    />
                  ))}
                </Flex>
                <Text fontWeight="medium">{service.provider.rating}</Text>
                {service.provider.reviewCount && (
                  <Text ml={1} color="gray.600">({service.provider.reviewCount} reviews)</Text>
                        )}
                      </Flex>
                    )}
                    
            {/* Google Business Rating */}
            {service.provider && (
              <Box mb={3} bg="gray.50" p={2} borderRadius="md">
                <Flex align="center">
                  <Image src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_74x24dp.png" h="20px" mr={2} alt="Google" />
                  
                  {service.provider.profile?.googleBusinessUrl && service.provider.profile?.googleBusinessRating ? (
                    <>
                      <Flex align="center" mr={2}>
                        {Array(5).fill('').map((_, i) => (
                          <StarIcon
                            key={i}
                            color={i < Math.floor(service.provider.profile.googleBusinessRating) ? 'yellow.400' : 'gray.300'}
                            mr={0.5}
                            boxSize={3}
                          />
                        ))}
                      </Flex>
                      <Text fontWeight="medium" fontSize="sm">{service.provider.profile.googleBusinessRating}</Text>
                      {service.provider.profile.googleBusinessReviews && (
                        <Text fontSize="xs" ml={1} color="gray.600">({service.provider.profile.googleBusinessReviews} Google reviews)</Text>
                      )}
                    </>
                  ) : (
                    <Text fontSize="sm" color="gray.600">Rating: N/A</Text>
                  )}
                </Flex>
              </Box>
            )}
            
            <Flex gap={2} mt={2}>
              <Button 
                as={Link} 
                href={`/providers/${service.provider.id}`}
                colorScheme="blue" 
                variant="outline"
                leftIcon={<FaUser />}
                w="full"
              >
                View Provider Profile
              </Button>
            </Flex>
                        </Box>
        )}
        
        {service.policies && (
          <Box>
            <Heading as="h2" size="md" mb={4}>
              Policies and Requirements
            </Heading>
            <Text whiteSpace="pre-wrap">{service.policies}</Text>
              </Box>
            )}
      </Stack>
      </Container>
  );
}