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

export default function ApprovedServicesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [approvedServices, setApprovedServices] = useState([]);
  const [error, setError] = useState(null);
  
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
                <Button 
                  colorScheme="brand" 
                  onClick={() => router.push('/client/create-party')}
                >
                  Create a Party
                </Button>
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
                
                {item.servicePhoto ? (
                  <Image 
                    src={item.servicePhoto} 
                    alt={item.serviceName}
                    height="150px"
                    objectFit="cover"
                    fallback={
                      <Box
                        height="150px"
                        bg="gray.200"
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
                    height="150px"
                    bg="gray.200"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.500">No image available</Text>
                  </Box>
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
      </VStack>
    </Container>
  );
} 