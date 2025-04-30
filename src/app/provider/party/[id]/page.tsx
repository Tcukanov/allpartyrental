'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Badge,
  Button,
  Divider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  SimpleGrid,
  Spinner,
  useToast,
  Icon,
  VStack,
  HStack,
  Avatar,
  Image,
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon, ChatIcon, AtSignIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';
import { FaMapMarkerAlt, FaHome } from 'react-icons/fa';
import { getStatusBadge } from '@/utils/statusHelpers';

interface PartyDetails {
  id: string;
  name: string;
  date: string;
  startTime: string;
  duration: number;
  guestCount: number;
  status: string;
  city: {
    name: string;
    state: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    calculatedAddress?: string;
    profile?: {
      avatar?: string;
      phone?: string;
      address?: string;
    };
  };
  partyServices: Array<{
    id: string;
    service: {
      id: string;
      name: string;
      description: string;
      providerId: string;
      photos: string[];
    };
    specificOptions?: any;
    offers: Array<{
      id: string;
      providerId: string;
      status: string;
      price: number;
      description: string;
      chat?: {
        id: string;
      };
    }>;
  }>;
}

export default function ProviderPartyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const unwrappedParams = use(params);
  const partyId = unwrappedParams.id;

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [party, setParty] = useState<PartyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated and a provider
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (sessionStatus === 'authenticated') {
      if (session?.user?.role !== 'PROVIDER') {
        router.push('/');
        toast({
          title: 'Access Denied',
          description: 'Only service providers can access this page',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        fetchPartyDetails(partyId);
      }
    }
  }, [sessionStatus, session, router, partyId, toast]);

  const fetchPartyDetails = async (partyId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/parties/${partyId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching party: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Received party data:', JSON.stringify(data.data));
        console.log('Client profile data:', JSON.stringify(data.data.client?.profile));
        console.log('Client address (direct):', data.data.client?.address);
        console.log('Client address (from profile):', data.data.client?.profile?.address);
        
        // Create a modified party object with a proper address field
        const partyWithAddress = {
          ...data.data,
          client: {
            ...data.data.client,
            // Explicitly handle address field
            calculatedAddress: data.data.client?.profile?.address || data.data.client?.address || null
          }
        };
        
        setParty(partyWithAddress);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch party details');
      }
    } catch (err) {
      console.error('Fetch party error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load party details',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChat = async (offerId: string) => {
    try {
      // Show loading toast
      const loadingToastId = toast({
        title: "Creating chat",
        description: "Setting up a new conversation...",
        status: "loading",
        duration: null,
        isClosable: false,
      });
      
      // Create chat via API
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId }),
      });
      
      const data = await response.json();
      
      // Close loading toast
      toast.close(loadingToastId);
      
      if (data.chat && data.chat.id) {
        // Success - navigate to chat
        toast({
          title: "Chat created",
          description: "Successfully created a new conversation.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Navigate to chat
        router.push(`/chats/${data.chat.id}`);
      } else {
        throw new Error(data.error?.message || 'Failed to create chat');
      }
    } catch (err) {
      console.error('Error creating chat:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create chat',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleNavigateToChat = (chatId: string) => {
    router.push(`/chats/${chatId}`);
  };

  if (isLoading) {
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
        <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
          <Text color="red.500">{error}</Text>
        </Box>
      </Container>
    );
  }

  if (!party) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
          <Text>Party not found or you don't have permission to view it.</Text>
        </Box>
      </Container>
    );
  }

  // Format the date
  const formattedDate = party.date ? format(new Date(party.date), 'MMMM dd, yyyy') : 'Date TBD';

  // Filter party services to only show those relevant to this provider
  const relevantServices = party.partyServices.filter(
    ps => ps.service.providerId === session?.user?.id
  );
  
  // Hardcoded address for testing (remove in production)
  const getAddressString = () => {
    // First try to use the calculated address
    if (party.client?.calculatedAddress) {
      return party.client.calculatedAddress;
    }
    
    // Then try to use the client's profile address
    if (party.client?.profile?.address) {
      return party.client.profile.address;
    }
    
    // Then try to use direct address
    if (party.client?.address) {
      return party.client.address;
    }
    
    // If all else fails, return the address from service booking if available
    const bookingData = party.partyServices.find(ps => ps.specificOptions && ps.specificOptions.address);
    if (bookingData && bookingData.specificOptions && bookingData.specificOptions.address) {
      return bookingData.specificOptions.address;
    }
    
    // If still not found, for testing only:
    return "203w 58th brooklyn"; // Hardcoded test address
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading as="h1" size="xl">Party Details</Heading>
          {getStatusBadge(party.status)}
        </Flex>

        <Card>
          <CardHeader>
            <Heading size="md">{party.name}</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
              <Box>
                <Flex align="center" mb={2}>
                  <Icon as={CalendarIcon} mr={2} />
                  <Text fontWeight="bold">Date:</Text>
                  <Text ml={2}>{formattedDate}</Text>
                </Flex>
                <Flex align="center" mb={2}>
                  <Icon as={TimeIcon} mr={2} />
                  <Text fontWeight="bold">Time:</Text>
                  <Text ml={2}>{party.startTime}</Text>
                </Flex>
                <Text mb={2}>
                  <Text as="span" fontWeight="bold">Duration:</Text> {party.duration} hours
                </Text>
                <Text mb={2}>
                  <Text as="span" fontWeight="bold">Guest Count:</Text> {party.guestCount} people
                </Text>
                <Flex align="center" mb={2}>
                  <Icon as={FaMapMarkerAlt} mr={2} />
                  <Text fontWeight="bold">Location:</Text>
                  <Text ml={2}>{party.city.name}, {party.city.state}</Text>
                </Flex>
                <Flex align="center" mb={2}>
                  <Icon as={FaHome} mr={2} />
                  <Text fontWeight="bold">Address:</Text>
                  <Text ml={2}>{getAddressString()}</Text>
                </Flex>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Client Information:</Text>
                <HStack mb={3}>
                  <Avatar 
                    size="sm" 
                    name={party.client.name} 
                    src={party.client.profile?.avatar || ''}
                  />
                  <VStack align="start" spacing={0}>
                    <Text>{party.client.name}</Text>
                    {party.client.email && (
                      <Flex align="center">
                        <Icon as={EmailIcon} fontSize="xs" mr={1} />
                        <Text fontSize="sm">{party.client.email}</Text>
                      </Flex>
                    )}
                    {party.client.profile?.phone && (
                      <Flex align="center">
                        <Icon as={PhoneIcon} fontSize="xs" mr={1} />
                        <Text fontSize="sm">{party.client.profile.phone}</Text>
                      </Flex>
                    )}
                  </VStack>
                </HStack>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        <Heading as="h2" size="md" mt={8}>Your Services for this Party</Heading>
        
        {relevantServices.length === 0 ? (
          <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
            <Text>You don't have any services associated with this party.</Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            {relevantServices.map((service) => {
              // Find the offer made by this provider
              const myOffer = service.offers.find(o => o.providerId === session?.user?.id);
              
              return (
                <Card key={service.id}>
                  <CardHeader>
                    <Heading size="sm">{service.service.name}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text mb={3}>{service.service.description}</Text>
                    
                    {/* Display service photos */}
                    {service.service.photos && service.service.photos.length > 0 && (
                      <Box mb={3}>
                        <Text fontWeight="bold" mb={2}>Service Images:</Text>
                        <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2}>
                          {service.service.photos.map((photo, index) => (
                            <Image
                              key={index}
                              src={photo}
                              alt={`${service.service.name} photo ${index + 1}`}
                              height="120px"
                              objectFit="cover"
                              borderRadius="md"
                              fallbackSrc="https://via.placeholder.com/150"
                            />
                          ))}
                        </SimpleGrid>
                      </Box>
                    )}
                    
                    {service.specificOptions && (
                      <Box mb={3}>
                        <Text fontWeight="bold">Special Requirements:</Text>
                        {typeof service.specificOptions === 'object' ? (
                          <VStack align="start" spacing={2} mt={2}>
                            {service.specificOptions.addons && service.specificOptions.addons.length > 0 ? (
                              <>
                                <Text fontWeight="medium">Add-ons:</Text>
                                {service.specificOptions.addons.map((addon: any, index: number) => (
                                  <HStack key={addon.id || index} pl={4}>
                                    <Text>• {addon.title}</Text>
                                    {addon.price && <Text ml={2} fontWeight="semibold">${addon.price}</Text>}
                                  </HStack>
                                ))}
                              </>
                            ) : null}
                            {Object.entries(service.specificOptions)
                              .filter(([key]) => key !== 'addons')
                              .map(([key, value]) => (
                                <Text key={key}>
                                  <Text as="span" fontWeight="medium" textTransform="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</Text>{' '}
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </Text>
                              ))}
                          </VStack>
                        ) : (
                          <Text>{service.specificOptions}</Text>
                        )}
                      </Box>
                    )}
                    
                    {myOffer && (
                      <Box mt={4}>
                        <Text fontWeight="bold">Your Offer:</Text>
                        <HStack>
                          <Text>Status:</Text>
                          {getStatusBadge(myOffer.status)}
                        </HStack>
                        <Text>Price: ${myOffer.price}</Text>
                        <Text>Description: {myOffer.description}</Text>
                      </Box>
                    )}
                  </CardBody>
                  <CardFooter>
                    {myOffer ? (
                      <Button 
                        leftIcon={<ChatIcon />} 
                        colorScheme="blue"
                        onClick={() => myOffer.chat ? 
                          handleNavigateToChat(myOffer.chat.id) : 
                          handleCreateChat(myOffer.id)
                        }
                      >
                        {myOffer.chat ? 'Open Chat' : 'Create Chat'}
                      </Button>
                    ) : (
                      <Text color="gray.500">No offer made</Text>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
        
        <Button 
          mt={8} 
          colorScheme="gray" 
          onClick={() => router.back()}
        >
          Back
        </Button>
      </VStack>
    </Container>
  );
} 