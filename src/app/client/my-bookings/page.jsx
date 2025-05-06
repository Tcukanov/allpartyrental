"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  SimpleGrid, 
  Card, 
  CardBody, 
  Flex, 
  Avatar, 
  Badge, 
  Button, 
  Divider, 
  HStack, 
  Icon, 
  Spinner, 
  useToast,
  Image
} from '@chakra-ui/react';
import { CalendarIcon, CheckCircleIcon, ChatIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { FaCalendarAlt, FaUser, FaMoneyBillWave, FaMapMarkerAlt } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { MdHistory } from 'react-icons/md';
import { Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';

export default function MyBookingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [approvedServices, setApprovedServices] = useState([]);
  const [error, setError] = useState(null);
  const [completedParties, setCompletedParties] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedParty, setSelectedParty] = useState(null);
  
  // Get booking ID from query params
  const bookingId = searchParams.get('id');
  
  // Fetch a specific booking if ID is provided in URL
  useEffect(() => {
    const fetchSelectedBooking = async () => {
      if (!bookingId || sessionStatus !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        
        console.log('Fetching booking with ID:', bookingId);
        const response = await fetch(`/api/parties/${bookingId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch booking:', response.status, errorText);
          throw new Error(`Failed to fetch booking: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Fetched booking data:', data.data);
          setSelectedParty(data.data);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch booking details');
        }
      } catch (error) {
        console.error('Fetch booking error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load booking details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSelectedBooking();
  }, [bookingId, sessionStatus, toast]);
  
  useEffect(() => {
    const fetchApprovedServices = async () => {
      if (sessionStatus !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        
        // Fetch all parties for the client
        const partiesResponse = await fetch('/api/parties');
        
        if (!partiesResponse.ok) {
          throw new Error(`Error: ${partiesResponse.status}`);
        }
        
        const partiesData = await partiesResponse.json();
        
        if (!partiesData.success) {
          throw new Error(partiesData.error?.message || 'Failed to fetch parties');
        }
        
        // Filter out parties and get approved services
        const approved = [];
        partiesData.data.forEach(party => {
          party.partyServices.forEach(service => {
            // Find any approved offers for this service
            const approvedOffer = service.offers.find(offer => offer.status === 'APPROVED');
            
            if (approvedOffer) {
              approved.push({
                id: approvedOffer.id,
                serviceId: service.service.id,
                serviceName: service.service.name,
                serviceDescription: service.service.description,
                servicePhoto: service.service.photos && service.service.photos.length > 0 
                  ? service.service.photos[0] 
                  : null,
                price: approvedOffer.price,
                provider: approvedOffer.provider,
                partyId: party.id,
                partyName: party.name,
                partyDate: party.date,
                partyLocation: party.city?.name || 'Location not specified',
                chat: approvedOffer.chat,
                status: service.status,
                transaction: approvedOffer.transaction,
                createdAt: approvedOffer.createdAt
              });
            }
          });
        });
        
        // Sort by date (most recent first)
        approved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setApprovedServices(approved);
      } catch (err) {
        console.error('Error fetching approved services:', err);
        setError(err.message || 'Failed to load approved services');
        toast({
          title: 'Error',
          description: err.message || 'Failed to load approved services',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApprovedServices();
  }, [sessionStatus, toast]);
  
  useEffect(() => {
    const fetchCompletedParties = async () => {
      if (sessionStatus !== 'authenticated') return;
      
      try {
        setLoadingHistory(true);
        
        const response = await fetch('/api/parties');
        const data = await response.json();
        
        if (data.success) {
          // Filter for completed parties
          const completed = data.data.filter(
            party => party.status === 'COMPLETED'
          );
          
          // Fetch detailed info for each completed party
          const completedWithDetails = await Promise.all(
            completed.map(async (party) => {
              const detailResponse = await fetch(`/api/parties/${party.id}`);
              const detailData = await detailResponse.json();
              
              if (detailData.success) {
                return detailData.data;
              }
              return party;
            })
          );
          
          setCompletedParties(completedWithDetails);
        } else {
          throw new Error(data.error.message || 'Failed to fetch parties');
        }
      } catch (error) {
        console.error('Fetch completed parties error:', error);
        toast({
          title: 'Error',
          description: 'An error occurred while loading the party history. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchCompletedParties();
  }, [sessionStatus, toast]);
  
  const handleOpenChat = (chatId, offerId) => {
    if (chatId) {
      router.push(`/chats/${chatId}`);
    } else if (offerId) {
      // If chat doesn't exist but we have the offer ID, create a new chat
      toast({
        title: 'Creating new chat...',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      
      // Create a new chat for this offer
      fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: offerId
        }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.chat && data.chat.id) {
          // Navigate to the new chat
          router.push(`/chats/${data.chat.id}`);
        } else {
          throw new Error(data.error || 'Failed to create chat');
        }
      })
      .catch(error => {
        console.error('Chat creation error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create chat',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    } else {
      toast({
        title: 'Chat Unavailable',
        description: 'No chat has been created for this service yet, and offer information is missing.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleViewParty = (partyId) => {
    if (partyId) {
      router.push(`/client/my-bookings?id=${partyId}`);
    } else {
      toast({
        title: 'Booking Not Found',
        description: 'Cannot find booking details.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Format date for display
  const formatPartyDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Handle back button from specific booking view
  const handleBackToBookings = () => {
    setSelectedParty(null);
    router.push('/client/my-bookings');
  };
  
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" h="60vh">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Container>
    );
  }
  
  if (!session) {
    router.push('/auth/signin');
    return null;
  }
  
  // Show single booking details when ID is provided
  if (selectedParty) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Flex align="center">
            <Button 
              leftIcon={<ArrowBackIcon />} 
              variant="ghost" 
              onClick={handleBackToBookings}
              mr={4}
            >
              Back to Bookings
            </Button>
            <Heading as="h1" size="xl">{selectedParty.name}</Heading>
          </Flex>
          
          <Card>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={CalendarIcon} color="brand.500" />
                    <Text fontWeight="bold">Event Details</Text>
                  </HStack>
                  <Badge colorScheme={
                    selectedParty.status === 'COMPLETED' ? 'green' : 
                    selectedParty.status === 'IN_PROGRESS' ? 'orange' : 
                    selectedParty.status === 'CANCELLED' ? 'red' : 
                    selectedParty.status === 'DRAFT' ? 'gray' : 'blue'
                  }>
                    {selectedParty.status === 'DRAFT' ? 'PENDING' : 
                     selectedParty.status === 'PUBLISHED' ? 'CONFIRMED' : selectedParty.status}
                  </Badge>
                </Flex>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text color="gray.600">Date</Text>
                    <Text fontWeight="medium">{formatPartyDate(selectedParty.date)}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.600">Time</Text>
                    <Text fontWeight="medium">{selectedParty.startTime || 'Not specified'}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.600">Location</Text>
                    <Text fontWeight="medium">{selectedParty.city?.name || 'Not specified'}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.600">Guest Count</Text>
                    <Text fontWeight="medium">{selectedParty.guestCount || 'Not specified'}</Text>
                  </Box>
                </SimpleGrid>
                
                {selectedParty.description && (
                  <Box>
                    <Text color="gray.600">Description</Text>
                    <Text>{selectedParty.description}</Text>
                  </Box>
                )}
                
                <Divider />
                
                <Box>
                  <Text fontWeight="bold" mb={4}>Booked Services</Text>
                  {selectedParty.partyServices && selectedParty.partyServices.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {selectedParty.partyServices.map(service => {
                        // Find approved offers for this service
                        const approvedOffer = service.offers?.find(offer => offer.status === 'APPROVED');
                        
                        return (
                          <Card key={service.id} variant="outline">
                            <CardBody>
                              <VStack align="stretch" spacing={3}>
                                <Flex justify="space-between" align="center">
                                  <HStack>
                                    <Text fontWeight="bold">{service.service.name}</Text>
                                    <Badge colorScheme={
                                      service.status === 'COMPLETED' ? 'green' : 
                                      service.status === 'IN_PROGRESS' ? 'orange' : 
                                      service.status === 'CANCELLED' ? 'red' : 'blue'
                                    }>
                                      {service.status}
                                    </Badge>
                                  </HStack>
                                  {approvedOffer && (
                                    <Text fontWeight="medium" color="green.500">
                                      ${Number(approvedOffer.price).toFixed(2)}
                                    </Text>
                                  )}
                                </Flex>
                                
                                <Text fontSize="sm">
                                  {service.service.description || 'No description available'}
                                </Text>
                                
                                {approvedOffer && approvedOffer.provider && (
                                  <HStack>
                                    <Icon as={FaUser} color="brand.500" />
                                    <Text fontSize="sm">
                                      Provider: {approvedOffer.provider.name}
                                    </Text>
                                    
                                    <Button 
                                      size="xs" 
                                      leftIcon={<ChatIcon />}
                                      ml={4}
                                      onClick={() => handleOpenChat(approvedOffer.chat?.id, approvedOffer.id)}
                                    >
                                      Contact
                                    </Button>
                                  </HStack>
                                )}
                              </VStack>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
                      <Text>No services have been booked for this event yet.</Text>
                    </Box>
                  )}
                </Box>
                
                <Divider />
                
                <Flex justify="space-between">
                  <Button variant="outline" onClick={handleBackToBookings}>
                    Back to All Bookings
                  </Button>
                  <Button 
                    colorScheme="brand" 
                    onClick={() => router.push(`/services`)}
                  >
                    Browse More Services
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading as="h1" size="xl">My Bookings</Heading>
          <Button 
            colorScheme="brand" 
            size="md" 
            leftIcon={<FaCalendarAlt />}
            onClick={() => router.push('/services')}
          >
            Browse Services
          </Button>
        </Flex>
        
        {error && (
          <Box p={4} bg="red.50" color="red.500" borderRadius="md">
            {error}
          </Box>
        )}
        
        {!error && approvedServices.length === 0 ? (
          <Card p={8} textAlign="center">
            <VStack spacing={4}>
              <Icon as={FaCalendarAlt} w={12} h={12} color="gray.300" />
              <Heading size="md">No Bookings Yet</Heading>
              <Text color="gray.600">
                You haven't made any service bookings yet. Browse our services to get started.
              </Text>
              <Button
                mt={4}
                colorScheme="brand"
                leftIcon={<FaCalendarAlt />}
                onClick={() => router.push('/services')}
              >
                Browse Services
              </Button>
            </VStack>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {approvedServices.map(service => (
              <Card key={service.id} borderWidth="1px" boxShadow="sm">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Flex justify="space-between" align="center">
                      <HStack spacing={4}>
                        {service.servicePhoto ? (
                          <Image
                            src={service.servicePhoto}
                            alt={service.serviceName}
                            boxSize="60px"
                            objectFit="cover"
                            borderRadius="md"
                            fallback={
                              <Box boxSize="60px" bg="gray.200" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                                <Icon as={FaCalendarAlt} color="gray.400" />
                              </Box>
                            }
                          />
                        ) : (
                          <Box boxSize="60px" bg="gray.200" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FaCalendarAlt} color="gray.400" />
                          </Box>
                        )}
                        <VStack align="start" spacing={0}>
                          <Heading size="sm">{service.serviceName}</Heading>
                          <Text fontSize="xs" color="gray.500">Booking ID: {service.id.substring(0, 8)}</Text>
                        </VStack>
                      </HStack>
                      <Badge colorScheme={
                        service.status === 'COMPLETED' ? 'green' : 
                        service.status === 'IN_PROGRESS' ? 'orange' : 
                        service.status === 'CANCELLED' ? 'red' : 'blue'
                      }>
                        {service.status}
                      </Badge>
                    </Flex>
                    
                    <Box>
                      <Text fontSize="sm" noOfLines={2} color="gray.600">
                        {service.serviceDescription || "No description available"}
                      </Text>
                    </Box>
                    
                    <Divider />
                    
                    <VStack spacing={2} align="stretch">
                      <HStack spacing={2}>
                        <Icon as={FaCalendarAlt} color="brand.500" />
                        <Text fontSize="sm">{formatPartyDate(service.partyDate)}</Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <Icon as={FaMapMarkerAlt} color="brand.500" />
                        <Text fontSize="sm">{service.partyLocation}</Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <Icon as={FaUser} color="brand.500" />
                        <Text fontSize="sm">{service.provider?.name || "Provider details unavailable"}</Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <Icon as={FaMoneyBillWave} color="brand.500" />
                        <Text fontSize="sm" fontWeight="bold">${Number(service.price).toFixed(2)}</Text>
                      </HStack>
                    </VStack>
                    
                    <Flex justify="space-between" mt={2}>
                      <Button 
                        size="sm" 
                        leftIcon={<ChatIcon />}
                        onClick={() => handleOpenChat(service.chat?.id, service.id)}
                      >
                        Contact Provider
                      </Button>
                      
                      <Button 
                        size="sm" 
                        colorScheme="brand" 
                        onClick={() => handleViewParty(service.partyId)}
                      >
                        View Details
                      </Button>
                    </Flex>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
        
        {/* Booking History */}
        <Box mt={8}>
          <Heading as="h2" size="lg" mb={4}>
            <Flex align="center">
              <Icon as={MdHistory} mr={2} />
              Booking History
            </Flex>
          </Heading>
          
          {loadingHistory ? (
            <Flex justify="center" py={8}>
              <Spinner size="lg" color="brand.500" />
            </Flex>
          ) : completedParties.length === 0 ? (
            <Card p={6} bg="gray.50">
              <Text textAlign="center" color="gray.600">No completed bookings found in your history.</Text>
            </Card>
          ) : (
            <Accordion allowMultiple>
              {completedParties.map(party => (
                <AccordionItem key={party.id}>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <Flex align="center">
                        <Text fontWeight="bold">{party.name}</Text>
                        <Text ml={4} color="gray.500">
                          {formatPartyDate(party.date)}
                        </Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack align="stretch" spacing={4}>
                      <HStack>
                        <Icon as={FaMapMarkerAlt} color="gray.500" />
                        <Text>{party.city?.name || "Location not specified"}</Text>
                      </HStack>
                      
                      <HStack>
                        <Icon as={TimeIcon} color="gray.500" />
                        <Text>{party.startTime || "Time not specified"}</Text>
                      </HStack>
                      
                      {party.description && (
                        <Box>
                          <Text fontWeight="bold">Description:</Text>
                          <Text>{party.description}</Text>
                        </Box>
                      )}
                      
                      {party.partyServices && party.partyServices.length > 0 && (
                        <Box>
                          <Text fontWeight="bold" mb={2}>Services:</Text>
                          <VStack align="stretch" spacing={2}>
                            {party.partyServices.map(service => (
                              <Card key={service.id} size="sm" variant="outline">
                                <CardBody>
                                  <Flex justify="space-between" align="center">
                                    <Text>{service.service.name}</Text>
                                    <Badge colorScheme={
                                      service.status === 'COMPLETED' ? 'green' : 
                                      service.status === 'IN_PROGRESS' ? 'orange' : 
                                      service.status === 'CANCELLED' ? 'red' : 'blue'
                                    }>
                                      {service.status}
                                    </Badge>
                                  </Flex>
                                </CardBody>
                              </Card>
                            ))}
                          </VStack>
                        </Box>
                      )}
                      
                      <Button
                        size="sm"
                        colorScheme="brand"
                        variant="outline"
                        onClick={() => handleViewParty(party.id)}
                      >
                        View Complete Details
                      </Button>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </Box>
      </VStack>
    </Container>
  );
} 