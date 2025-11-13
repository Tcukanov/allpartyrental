"use client";

import React from 'react';
import { useEffect, useState, use } from 'react';
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
  const [categoryFilters, setCategoryFilters] = useState({});
  const [serviceAddons, setServiceAddons] = useState([]);
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);
  
  // Unwrap params using React.use() as required by Next.js 15
  const { id } = use(params);
  
  // Set user role from session
  useEffect(() => {
    if (session?.user) {
      setUserRole(session.user.role);
    } else {
      setUserRole(null);
    }
  }, [session]);
  
  // Load PayPal SDK for messaging
  useEffect(() => {
    // Check if PayPal SDK is already loaded
    if (window.paypal?.Messages) {
      console.log('✅ PayPal SDK already loaded, rendering messages');
      try {
        window.paypal.Messages().render();
      } catch (error) {
        console.error('Error rendering PayPal Messages:', error);
      }
      return;
    }

    // Load PayPal SDK if not present
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&components=messages`;
    script.setAttribute('data-partner-attribution-id', 'NYCKIDSPARTYENT_SP_PPCP');
    script.async = true;

    script.onload = () => {
      console.log('✅ PayPal SDK loaded, rendering messages');
      if (window.paypal?.Messages) {
        try {
          window.paypal.Messages().render();
        } catch (error) {
          console.error('Error rendering PayPal Messages:', error);
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load PayPal SDK for messaging');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector(`script[src*="paypal"][src*="components=messages"]`);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

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
          
          // Track view count (don't wait for response)
          fetch(`/api/services/${data.data.id}/view`, {
            method: 'POST',
          }).catch(err => console.error('Failed to track view:', err));
          
          // Fetch service add-ons
          await fetchServiceAddons(data.data.id);
          
          // Fetch category filters if there's metadata
          if (data.data?.metadata && data.data.categoryId) {
            await fetchCategoryFilters(data.data.categoryId);
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
  
  // Function to fetch category filters
  const fetchCategoryFilters = async (categoryId) => {
    try {
      const response = await fetch(`/api/categories/filters?categoryId=${categoryId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch category filters:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Convert array to object with id as key for easy lookup
        const filtersObject = {};
        data.data.forEach(filter => {
          filtersObject[filter.id] = filter;
        });
        
        setCategoryFilters(filtersObject);
        console.log('Category filters loaded:', filtersObject);
        
        // Check for specific filter types
        const colorFilter = Object.values(filtersObject).find(f => 
          f.type?.toLowerCase() === 'color' || 
          f.name?.toLowerCase().includes('color')
        );
        const sizeFilter = Object.values(filtersObject).find(f => 
          f.type?.toLowerCase() === 'size' || 
          f.name?.toLowerCase().includes('size') ||
          f.name?.toLowerCase().includes('space')
        );
        const capacityFilter = Object.values(filtersObject).find(f => 
          f.type?.toLowerCase() === 'capacity' || 
          f.name?.toLowerCase().includes('capacity')
        );
        
        console.log('Color filter:', colorFilter);
        console.log('Size filter:', sizeFilter);
        console.log('Capacity filter:', capacityFilter);
      }
    } catch (error) {
      console.error('Error fetching category filters:', error);
    }
  };
  
  // Function to extract filter values from service metadata
  const extractFilterValues = (service) => {
    if (!service || !service.metadata) return {};
    
    try {
      let result = {};
      if (typeof service.metadata === 'string') {
        const metadata = JSON.parse(service.metadata);
        result = metadata.filterValues || {};
      }
      
      console.log('Extracted filter values:', result);
      return result;
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
  
  // Helper function to find a filter by type
  const findFilterByType = (type) => {
    if (!categoryFilters) return null;
    
    // Try different matching strategies
    let filter = Object.values(categoryFilters).find(f => 
      f.type?.toLowerCase() === type.toLowerCase()
    );
    
    // If not found, try by name
    if (!filter) {
      filter = Object.values(categoryFilters).find(f => 
        f.name?.toLowerCase().includes(type.toLowerCase())
      );
    }
    
    // If still not found, try by ID
    if (!filter) {
      filter = Object.values(categoryFilters).find(f => 
        f.id?.toLowerCase().includes(type.toLowerCase())
      );
    }
    
    console.log(`Finding ${type} filter:`, filter);
    return filter;
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
        // Use relative path so it works on both localhost and production
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/services/${id}`)}`);
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
  
  // Add an effect to debug service and filter data when both are loaded
  useEffect(() => {
    if (service && Object.keys(categoryFilters).length > 0) {
      console.log('Service metadata:', service.metadata);
      console.log('All category filters:', categoryFilters);
      
      // Extract and log filter values
      const filterValues = extractFilterValues(service);
      console.log('Filter values:', filterValues);
      
      // Check for specific filters
      const colorFilter = findFilterByType('color');
      const sizeFilter = findFilterByType('size');
      const capacityFilter = findFilterByType('capacity');
      
      console.log('Color filter with icon?', colorFilter?.iconUrl ? 'YES' : 'NO');
      console.log('Size filter with icon?', sizeFilter?.iconUrl ? 'YES' : 'NO');
      console.log('Capacity filter with icon?', capacityFilter?.iconUrl ? 'YES' : 'NO');
    }
  }, [service, categoryFilters]);
  
  const fetchServiceAddons = async (serviceId) => {
    setIsLoadingAddons(true);
    try {
      const response = await fetch(`/api/services/${serviceId}/addons`);
      
      if (!response.ok) {
        console.error('Failed to fetch service add-ons:', response.status);
        setServiceAddons([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setServiceAddons(data.data);
        console.log(`Loaded ${data.data.length} add-ons for service`);
      } else {
        setServiceAddons([]);
      }
    } catch (error) {
      console.error('Error fetching service add-ons:', error);
      setServiceAddons([]);
    } finally {
      setIsLoadingAddons(false);
    }
  };
  
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
            
            {/* Specifications right after category */}
            <Box mb={4}>
         
              <Box p={4} borderRadius="md">
                <Grid alignItems="center" flexWrap="wrap" gap={4}>
                  <Flex alignItems="center">
                    {(() => {
                      // Try all possible ways to get the color icon
                      const iconUrl = service.metadata?.colorIcon || 
                                     findFilterByType('color')?.iconUrl || 
                                     Object.values(categoryFilters).find(f => f.name?.toLowerCase().includes('color'))?.iconUrl;
                      
                      return iconUrl ? <Image src={iconUrl} alt="Color" boxSize="20px" mr={2} /> : null;
                    })()}
                    <Text fontSize="md" fontWeight="bold">Available Colors:</Text>
                    <Text fontSize="md" mr={4}>{service.colors && service.colors.length > 0 ? service.colors.join(', ') : 'Grey'}</Text>
                  </Flex>
                  
                  <Flex alignItems="center">
                    {(() => {
                      // Try all possible ways to get the size/space icon
                      const iconUrl = service.metadata?.spaceIcon || 
                                     service.metadata?.sizeIcon || 
                                     findFilterByType('size')?.iconUrl || 
                                     findFilterByType('space')?.iconUrl || 
                                     Object.values(categoryFilters).find(f => f.name?.toLowerCase().includes('size') || f.name?.toLowerCase().includes('space'))?.iconUrl;
                      
                      return iconUrl ? <Image src={iconUrl} alt="Space" boxSize="20px" mr={2} /> : null;
                    })()}
                    <Text fontSize="md" fontWeight="bold">Space Required:</Text>
                    <Text fontSize="md" mr={4}>{service.metadata?.spaceRequired || service.metadata?.space || 'Small (under 100 sq ft)'}</Text>
                  </Flex>
                  
                  <Flex alignItems="center">
                    {(() => {
                      // Try all possible ways to get the capacity icon
                      const iconUrl = service.metadata?.capacityIcon || 
                                     findFilterByType('capacity')?.iconUrl || 
                                     Object.values(categoryFilters).find(f => f.name?.toLowerCase().includes('capacity') || f.name?.toLowerCase().includes('people'))?.iconUrl;
                      
                      return iconUrl ? <Image src={iconUrl} alt="Capacity" boxSize="20px" mr={2} /> : null;
                    })()}
                    <Text fontSize="md" fontWeight="bold">Max Capacity:</Text>
                    <Text fontSize="md">{service.metadata?.maxCapacity || service.metadata?.capacity || '1-5 children'}</Text>
                  </Flex>
                </Grid>
              </Box>
            </Box>
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
              
              {/* PayPal Messaging - Shows financing options */}
              <Box mt={2} mb={2}>
                <div 
                  data-pp-message 
                  data-pp-amount={Number(service.price).toFixed(2)}
                  data-pp-style-layout="text"
                  data-pp-style-text-color="black"
                  data-pp-style-text-size="12"
                ></div>
              </Box>
                    
              {!isOwner && session && session.user.role === 'CLIENT' && (
                <Button 
                  colorScheme="blue" 
                  size="lg"
                  width="full"
                  as={Link}
                  href={`/book/${service.id}`}
                >
                  Book Now
                </Button>
              )}
              
              {isOwner && (
                <Button colorScheme="teal" width="full">
                  Edit Service
                    </Button>
              )}
              
              {!session && (
                <Button colorScheme="blue" width="full" as="a" href={`/auth/signin?callbackUrl=${encodeURIComponent(`/book/${id}`)}`}>
                  Sign in to Book
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
        
        {/* Add-ons Section */}
        {serviceAddons && serviceAddons.length > 0 && (
          <Box mt={6}>
            <Heading as="h2" size="md" mb={4}>
              Available Add-ons
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {serviceAddons.map((addon) => (
                <Flex 
                  key={addon.id} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  p={4}
                  align="center"
                >
                  {addon.thumbnail && (
                    <Image 
                      src={addon.thumbnail} 
                      alt={addon.title}
                      boxSize="60px"
                      borderRadius="md"
                      mr={4}
                      objectFit="cover"
                    />
                  )}
                  <Box flex="1">
                    <Flex justify="space-between" mb={1}>
                      <Heading as="h3" size="sm">{addon.title}</Heading>
                      <Text fontWeight="bold" color="green.500">
                        ${Number(addon.price).toFixed(2)}
                      </Text>
                    </Flex>
                    {addon.description && (
                      <Text fontSize="sm" color="gray.600">
                        {addon.description}
                      </Text>
                    )}
                    {addon.isRequired && (
                      <Badge colorScheme="red" mt={2}>Required</Badge>
                    )}
                  </Box>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        )}
        
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
                href={`/providers/${service.provider.user?.id || service.provider.userId || service.provider.id}`}
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