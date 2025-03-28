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
import { useParams, useRouter } from 'next/navigation';
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
        
        // Check if current user is the service owner
        if (session) {
          setUserRole(session.user.role);
          setIsOwner(session.user.id === data.data.providerUserId);
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
  }, [params.id, toast, session]);
  
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
        router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/services/${service.id}`)}`);
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
        {service.imageUrl ? (
                <Image 
            src={service.imageUrl}
                  alt={service.name} 
                  w="100%" 
            h={{ base: "200px", md: "400px" }}
                  objectFit="cover"
            borderRadius="md"
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
            <Stack spacing={4} bg="gray.50" p={4} borderRadius="md" width={{ base: "100%", md: "300px" }}>
                    <Flex align="center">
                <Icon as={FiDollarSign} fontSize="xl" mr={2} color="green.500" />
                <Heading size="md">${service.price.toFixed(2)}</Heading>
                <Text fontSize="sm" ml={1} color="gray.600">
                  {service.priceType === 'HOURLY' ? '/ hour' : service.priceType === 'DAILY' ? '/ day' : ''}
                </Text>
                    </Flex>
                    
              {service.location && (
                <Flex align="center">
                  <Icon as={FiMapPin} mr={2} color="red.500" />
                  <Text>{service.location}</Text>
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
                    
              {!isOwner && userRole === 'CLIENT' && (
                <ServiceRequestButton service={service} />
              )}
              
              {isOwner && (
                <Button colorScheme="teal" width="full">
                  Edit Service
                    </Button>
              )}
              
              {!userRole && (
                <Button colorScheme="blue" width="full" as="a" href="/login">
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