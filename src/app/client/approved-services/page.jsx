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
import { CalendarIcon, CheckCircleIcon, ChatIcon } from '@chakra-ui/icons';
import { FaCalendarAlt, FaUser, FaMoneyBillWave, FaMapMarkerAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { MdHistory } from 'react-icons/md';
import { Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';

export default function ApprovedServicesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [approvedServices, setApprovedServices] = useState([]);
  const [error, setError] = useState(null);
  const [completedParties, setCompletedParties] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
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
      router.push(`/client/my-party?id=${partyId}`);
    } else {
      toast({
        title: 'Party Not Found',
        description: 'Cannot find party details.',
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
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Approved Services</Heading>
          <Text color="gray.600" mt={2}>
            View all services that have been approved for your parties
          </Text>
        </Box>
        
        {error && (
          <Box p={4} bg="red.50" color="red.500" borderRadius="md">
            <Text>{error}</Text>
          </Box>
        )}
        
        {approvedServices.length === 0 ? (
          <Card>
            <CardBody>
              <VStack spacing={4} py={10} align="center">
                <Icon as={CheckCircleIcon} boxSize={12} color="gray.300" />
                <Heading as="h3" size="md">No Approved Services</Heading>
                <Text color="gray.500" textAlign="center">
                  You don't have any approved services yet. Create a party and request services to get started.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {approvedServices.map((item) => (
              <Card key={item.id} boxShadow="md" position="relative" overflow="hidden">
                <Box position="absolute" top={0} right={0} p={2}>
                  <Badge colorScheme="green" fontSize="sm" px={2} py={1} borderRadius="full">
                    <HStack spacing={1}>
                      <CheckCircleIcon />
                      <Text>Approved</Text>
                    </HStack>
                  </Badge>
                </Box>
                
                {item.servicePhoto && (
                  <Image 
                    src={item.servicePhoto} 
                    alt={item.serviceName}
                    height="150px"
                    objectFit="cover"
                  />
                )}
                
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading as="h3" size="md">{item.serviceName}</Heading>
                    
                    <HStack spacing={4}>
                      <Avatar 
                        size="sm" 
                        name={item.provider.name} 
                        src={item.provider.profile?.avatar} 
                      />
                      <Text fontWeight="medium">{item.provider.name}</Text>
                    </HStack>
                    
                    <Box>
                      <HStack spacing={2} mb={1}>
                        <Icon as={FaMoneyBillWave} color="green.500" />
                        <Text fontWeight="bold">${Number(item.price).toFixed(2)}</Text>
                      </HStack>
                      
                      <HStack spacing={2} mb={1}>
                        <Icon as={FaCalendarAlt} color="blue.500" />
                        <Text>{format(new Date(item.partyDate), 'MMMM d, yyyy')}</Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <Icon as={FaMapMarkerAlt} color="red.500" />
                        <Text>{item.partyLocation}</Text>
                      </HStack>
                    </Box>
                    
                    <Text fontWeight="medium" fontSize="sm" color="gray.700">
                      For party: {item.partyName}
                    </Text>
                    
                    <Divider />
                    
                    <HStack spacing={3} justify="space-between">
                      <Button 
                        size="sm" 
                        leftIcon={<ChatIcon />} 
                        onClick={() => handleOpenChat(item.chat?.id, item.id)}
                      >
                        Message
                      </Button>
                      
                      <Button 
                        size="sm" 
                        colorScheme="brand" 
                        onClick={() => handleViewParty(item.partyId)}
                      >
                        View Party
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
        
        {/* Party History Section */}
        <Box mt={12}>
          <Heading as="h2" size="lg" mb={4}>Party History</Heading>
          <Text color="gray.600" mb={6}>
            View your past events and completed parties
          </Text>
          
          {loadingHistory ? (
            <Flex justify="center" py={8}>
              <VStack spacing={4}>
                <Spinner size="xl" color="brand.500" />
                <Text>Loading your party history...</Text>
              </VStack>
            </Flex>
          ) : completedParties.length === 0 ? (
            <Box p={8} textAlign="center" borderWidth="1px" borderRadius="lg">
              <Heading size="md" mb={4}>No completed parties yet</Heading>
              <Text mb={6}>You don't have any completed parties in your history.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {completedParties.map((party) => (
                <Card key={party.id} borderWidth="1px">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Flex justify="space-between" align="center">
                        <Heading size="md">{party.name}</Heading>
                        <Badge colorScheme="green" px={2} py={1}>
                          Completed
                        </Badge>
                      </Flex>
                      
                      <HStack spacing={4}>
                        <HStack>
                          <Icon as={CalendarIcon} color="brand.500" />
                          <Text>{formatPartyDate(party.date)}</Text>
                        </HStack>
                        <HStack>
                          <Icon as={TimeIcon} color="brand.500" />
                          <Text>{party.startTime} ({party.duration}h)</Text>
                        </HStack>
                      </HStack>
                      
                      <Divider />
                      
                      <Accordion allowToggle>
                        <AccordionItem border="none">
                          <AccordionButton px={0}>
                            <Box flex="1" textAlign="left" fontWeight="medium">
                              Services & Providers
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4} px={0}>
                            <VStack spacing={3} align="stretch">
                              {party.partyServices && party.partyServices.map((service) => {
                                // Find approved offer for this service
                                const approvedOffer = service.offers && service.offers.find(
                                  offer => offer.status === 'APPROVED'
                                );
                                
                                return (
                                  <Box 
                                    key={service.id} 
                                    p={3} 
                                    borderWidth="1px" 
                                    borderRadius="md"
                                  >
                                    <HStack justify="space-between" mb={2}>
                                      <Text fontWeight="bold">
                                        {service.service?.name || 'Service'}
                                      </Text>
                                      <Badge colorScheme="green">
                                        <HStack spacing={1}>
                                          <CheckCircleIcon />
                                          <Text>Completed</Text>
                                        </HStack>
                                      </Badge>
                                    </HStack>
                                    
                                    {approvedOffer && (
                                      <HStack spacing={3} mt={2}>
                                        <Avatar 
                                          size="sm" 
                                          src={approvedOffer.provider?.profile?.avatar} 
                                          name={approvedOffer.provider?.name} 
                                        />
                                        <Text>{approvedOffer.provider?.name}</Text>
                                      </HStack>
                                    )}
                                  </Box>
                                );
                              })}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                      
                      <Divider />
                      
                      <Button
                        variant="outline"
                        colorScheme="brand"
                        onClick={() => router.push(`/client/my-party?id=${party.id}`)}
                      >
                        View Details
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </VStack>
    </Container>
  );
} 