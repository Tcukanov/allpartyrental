'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stack,
  Badge,
  Spinner,
  useToast,
  HStack,
  VStack,
  Divider,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  Select,
  Alert,
  AlertIcon,
  Image,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { CalendarIcon, TimeIcon, EditIcon, InfoIcon } from '@chakra-ui/icons';

// Types for the party data
interface Party {
  id: string;
  name: string;
  date: string;
  startTime: string;
  duration: number;
  guestCount: number;
  city: {
    id: string;
    name: string;
  };
  client: {
    name: string;
    profile?: {
      avatar?: string;
    };
  };
  partyServices: PartyService[];
}

interface PartyService {
  id: string;
  serviceId: string;
  service: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  offers: any[];
}

// Types for the filters
interface FilterState {
  categoryId: string;
  cityId: string;
}

export default function AvailablePartiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    categoryId: '',
    cityId: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedPartyService, setSelectedPartyService] = useState<any>(null);
  const [offerDetails, setOfferDetails] = useState({
    price: '',
    description: '',
    photos: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session && session.user?.role !== 'PROVIDER') {
      router.push('/');
      toast({
        title: 'Access Denied',
        description: 'Only providers can access this page',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [session, status, router, toast]);

  // Fetch categories and cities
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }

        // Fetch cities
        const citiesResponse = await fetch('/api/cities');
        if (!citiesResponse.ok) {
          throw new Error('Failed to fetch cities');
        }
        const citiesData = await citiesResponse.json();
        if (citiesData.success) {
          setCities(citiesData.data);
        }
      } catch (err) {
        console.error('Error fetching filters:', err);
        toast({
          title: 'Error',
          description: 'Failed to load filters',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    if (session) {
      fetchFilters();
    }
  }, [session, toast]);

  // Fetch available parties
  const fetchParties = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      
      let url = '/api/provider/available-parties';
      const params = new URLSearchParams();
      
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      
      if (filters.cityId) {
        params.append('cityId', filters.cityId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch parties');
      }
      
      const data = await response.json();
      if (data.success) {
        setParties(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to load parties');
      }
    } catch (err) {
      console.error('Error fetching parties:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load available parties',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch parties on mount and when filters change
  useEffect(() => {
    if (session) {
      fetchParties();
    }
  }, [session, filters]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Open modal to make an offer
  const handleMakeOffer = (partyService: any) => {
    setSelectedPartyService(partyService);
    setOfferDetails({
      price: '',
      description: '',
      photos: [],
    });
    onOpen();
  };

  // Handle offer form input changes
  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOfferDetails(prev => ({ ...prev, [name]: value }));
  };

  // Submit an offer
  const handleSubmitOffer = async () => {
    if (!selectedPartyService) return;
    
    // Validate inputs
    if (!offerDetails.price.trim() || !offerDetails.description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide price and description for your offer',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/provider/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partyServiceId: selectedPartyService.id,
          price: parseFloat(offerDetails.price),
          description: offerDetails.description,
          photos: offerDetails.photos,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to submit offer');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Offer Submitted',
        description: 'Your offer has been submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Close modal and refresh parties
      onClose();
      fetchParties();
    } catch (err) {
      console.error('Error submitting offer:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit offer',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Available Parties</Heading>
          <Text color="gray.600" mt={2}>
            Browse open party requests that match your services
          </Text>
        </Box>

        {/* Filters */}
        <Card>
          <CardBody>
            <HStack spacing={6}>
              <FormControl>
                <FormLabel>Filter by Category</FormLabel>
                <Select
                  name="categoryId"
                  value={filters.categoryId}
                  onChange={handleFilterChange}
                  placeholder="All Categories"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Filter by City</FormLabel>
                <Select
                  name="cityId"
                  value={filters.cityId}
                  onChange={handleFilterChange}
                  placeholder="All Cities"
                >
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>
          </CardBody>
        </Card>

        {/* Party Listings */}
        {parties.length === 0 ? (
          <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
            <Text>No available parties match your services. Please check back later or adjust your filters.</Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {parties.map(party => (
              <Card key={party.id} overflow="hidden" variant="outline">
                <CardHeader bg="gray.50" pb={0}>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">{party.name}</Heading>
                    <Avatar 
                      size="sm" 
                      name={party.client.name} 
                      src={party.client.profile?.avatar} 
                    />
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    by {party.client.name}
                  </Text>
                </CardHeader>
                
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack>
                      <CalendarIcon />
                      <Text>{formatDate(party.date)}</Text>
                      <TimeIcon />
                      <Text>{party.startTime}</Text>
                    </HStack>
                    
                    <HStack>
                      <Text fontWeight="bold">Location:</Text>
                      <Text>{party.city.name}</Text>
                    </HStack>
                    
                    <HStack>
                      <Text fontWeight="bold">Guests:</Text>
                      <Text>{party.guestCount} people</Text>
                    </HStack>
                    
                    <HStack>
                      <Text fontWeight="bold">Duration:</Text>
                      <Text>{party.duration} hours</Text>
                    </HStack>
                    
                    <Divider />
                    
                    <Box>
                      <Heading size="sm" mb={2}>Required Services:</Heading>
                      <VStack align="start" spacing={2}>
                        {party.partyServices.map(service => (
                          <Flex key={service.id} width="100%" justify="space-between" align="center">
                            <Box>
                              <Badge colorScheme="blue" mb={1}>
                                {service.service.category.name}
                              </Badge>
                              <Text fontWeight="medium">{service.service.name}</Text>
                            </Box>
                            <Button 
                              size="sm" 
                              colorScheme="brand" 
                              onClick={() => handleMakeOffer(service)}
                            >
                              Make Offer
                            </Button>
                          </Flex>
                        ))}
                      </VStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Make Offer Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Make an Offer</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedPartyService && (
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  You are making an offer for {selectedPartyService.service.name} service
                </Alert>
                
                <FormControl isRequired>
                  <FormLabel>Your Price</FormLabel>
                  <Input
                    name="price"
                    type="number"
                    placeholder="Enter your price"
                    value={offerDetails.price}
                    onChange={handleOfferChange}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    placeholder="Describe your offer and what's included"
                    value={offerDetails.description}
                    onChange={handleOfferChange}
                    rows={4}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handleSubmitOffer}
              isLoading={submitting}
              loadingText="Submitting"
            >
              Submit Offer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 