"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  Flex, 
  Button, 
  VStack, 
  HStack, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Divider, 
  Badge, 
  Image, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  useToast,
  Avatar,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  EditIcon, 
  CheckIcon, 
  CloseIcon, 
  ChatIcon, 
  CalendarIcon, 
  TimeIcon, 
  StarIcon 
} from '@chakra-ui/icons';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import ChatComponent from '@/components/chat/ChatComponent';
import PaymentComponent from '@/components/payment/PaymentComponent';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function MyPartyPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [party, setParty] = useState(null);
  const [activeOffer, setActiveOffer] = useState(null);
  
  // Modal states
  const { 
    isOpen: isOfferModalOpen, 
    onOpen: onOfferModalOpen, 
    onClose: onOfferModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isChatModalOpen, 
    onOpen: onChatModalOpen, 
    onClose: onChatModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isPaymentModalOpen, 
    onOpen: onPaymentModalOpen, 
    onClose: onPaymentModalClose 
  } = useDisclosure();
  
  // Get party ID from query params or use the first active party
  const partyId = searchParams.get('id');
  
  // Fetch party data
  useEffect(() => {
    const fetchPartyData = async () => {
      if (sessionStatus !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        
        // If partyId is specified, fetch that party
        if (partyId) {
          const response = await fetch(`/api/parties/${partyId}`);
          const data = await response.json();
          
          if (data.success) {
            setParty(data.data);
          } else {
            throw new Error(data.error.message || 'Failed to fetch party details');
          }
        } else {
          // Otherwise, fetch all parties and use the first active one
          const response = await fetch('/api/parties');
          const data = await response.json();
          
          if (data.success) {
            const parties = data.data;
            
            if (parties.length === 0) {
              // No parties found, redirect to create party
              router.push('/client/create-party');
              return;
            }
            
            // Find the first party that's not in DRAFT or COMPLETED status
            const activeParty = parties.find(p => 
              p.status !== 'DRAFT' && p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
            ) || parties[0];
            
            // Fetch detailed info for this party
            const detailResponse = await fetch(`/api/parties/${activeParty.id}`);
            const detailData = await detailResponse.json();
            
            if (detailData.success) {
              setParty(detailData.data);
            } else {
              throw new Error(detailData.error.message || 'Failed to fetch party details');
            }
          } else {
            throw new Error(data.error.message || 'Failed to fetch parties');
          }
        }
      } catch (error) {
        console.error('Fetch party error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load party details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPartyData();
  }, [partyId, sessionStatus, router, toast]);
  
  // Handle offer approval
  const handleApproveOffer = async (offerId) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/approve`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Offer Approved',
          description: 'The offer has been approved. Please proceed to payment.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Update party data by refetching
        const partyResponse = await fetch(`/api/parties/${party.id}`);
        const partyData = await partyResponse.json();
        
        if (partyData.success) {
          setParty(partyData.data);
          
          // Find the approved offer for payment
          const approvedOffer = partyData.data.partyServices
            .flatMap(service => service.offers)
            .find(o => o.id === offerId);
          
          if (approvedOffer && approvedOffer.transaction) {
            setActiveOffer(approvedOffer);
            onPaymentModalOpen();
          }
        }
      } else {
        throw new Error(data.error.message || 'Failed to approve offer');
      }
    } catch (error) {
      console.error('Approve offer error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve offer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle offer rejection
  const handleRejectOffer = async (offerId) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/reject`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Offer Rejected',
          description: 'The offer has been rejected.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        
        // Update party data by refetching
        const partyResponse = await fetch(`/api/parties/${party.id}`);
        const partyData = await partyResponse.json();
        
        if (partyData.success) {
          setParty(partyData.data);
        }
      } else {
        throw new Error(data.error.message || 'Failed to reject offer');
      }
    } catch (error) {
      console.error('Reject offer error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject offer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle opening chat modal
  const handleOpenChat = (offer) => {
    setActiveOffer(offer);
    onChatModalOpen();
  };
  
  // Handle viewing offer details
  const handleViewOffer = (offer) => {
    setActiveOffer(offer);
    onOfferModalOpen();
  };
  
  // Handle service provider arrival confirmation
  const handleConfirmArrival = async (transactionId) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/confirm`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Arrival Confirmed',
          description: 'You have confirmed the service provider\'s arrival. Payment will be released after 12 hours.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Update party data by refetching
        const partyResponse = await fetch(`/api/parties/${party.id}`);
        const partyData = await partyResponse.json();
        
        if (partyData.success) {
          setParty(partyData.data);
        }
      } else {
        throw new Error(data.error.message || 'Failed to confirm arrival');
      }
    } catch (error) {
      console.error('Confirm arrival error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to confirm arrival',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle filing a dispute
  const handleFileDispute = async (transactionId) => {
    // This would typically open a form modal to collect dispute details
    // For simplicity, we're just showing a toast
    toast({
      title: 'Dispute Filing',
      description: 'This would open a form to file a dispute.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };
  
  // Count approved offers
  const countApprovedOffers = () => {
    if (!party) return 0;
    
    return party.partyServices.reduce((count, service) => {
      const approvedOffer = service.offers.find(offer => offer.status === 'APPROVED');
      return approvedOffer ? count + 1 : count;
    }, 0);
  };
  
  // Check if all services have approved offers
  const allServicesApproved = () => {
    if (!party) return false;
    
    return party.partyServices.every(service => {
      return service.offers.some(offer => offer.status === 'APPROVED');
    });
  };
  
  // Format party status for display
  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'PUBLISHED': return 'blue';
      case 'IN_PROGRESS': return 'orange';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };
  
  if (sessionStatus === 'loading' || isLoading) {
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
  
  if (!session) {
    router.push('/auth/signin');
    return null;
  }
  
  if (!party) {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={4} align="center" justify="center" h="60vh">
            <Heading size="lg">No Active Party</Heading>
            <Text>You don't have any active parties.</Text>
            <Button 
              colorScheme="brand" 
              leftIcon={<EditIcon />}
              onClick={() => router.push('/client/create-party')}
            >
              Create a Party
            </Button>
          </VStack>
        </Container>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Heading size="xl">{party.name}</Heading>
              <HStack mt={2}>
                <Badge colorScheme={getStatusColor(party.status)} fontSize="md" px={2} py={1}>
                  {party.status.replace('_', ' ')}
                </Badge>
                <Text color="gray.600">
                  <CalendarIcon mr={1} />
                  {format(new Date(party.date), 'MMMM d, yyyy')}
                </Text>
                <Text color="gray.600">
                  <TimeIcon mr={1} />
                  {party.startTime}
                </Text>
              </HStack>
            </Box>
            
            <HStack>
              <Button 
                leftIcon={<EditIcon />}
                variant="outline"
                onClick={() => router.push(`/client/create-party?edit=${party.id}`)}
                isDisabled={party.status !== 'DRAFT'}
              >
                Edit Party
              </Button>
            </HStack>
          </Flex>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mt={4}>
            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">Location</Text>
                  <Text>{party.city?.name}</Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">Duration</Text>
                  <Text>{party.duration} hours</Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">Guests</Text>
                  <Text>{party.guestCount} people</Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>
        
        <Box mb={8}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="lg">Services & Offers</Heading>
            
            <HStack>
              <Badge colorScheme="blue">
                {countApprovedOffers()} of {party.partyServices.length} services confirmed
              </Badge>
              
              {allServicesApproved() && (
                <Badge colorScheme="green">All Set!</Badge>
              )}
            </HStack>
          </Flex>
          
          <Accordion allowMultiple defaultIndex={[0]}>
            {party.partyServices.map((service, serviceIndex) => {
              const hasApprovedOffer = service.offers.some(offer => offer.status === 'APPROVED');
              
              return (
                <AccordionItem key={service.id}>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Text fontWeight="bold">{service.service.name}</Text>
                        {hasApprovedOffer ? (
                          <Badge colorScheme="green">Confirmed</Badge>
                        ) : (
                          <Badge colorScheme="blue">
                            {service.offers.length} offer{service.offers.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  
                  <AccordionPanel pb={4}>
                    {service.offers.length === 0 ? (
                      <Box p={4} borderWidth="1px" borderRadius="md" textAlign="center">
                        <Text color="gray.600">No offers yet. Providers will respond soon.</Text>
                      </Box>
                    ) : (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {service.offers.map((offer, offerIndex) => (
                          <Card key={offer.id} borderWidth="1px" variant="outline">
                            <CardHeader pb={0}>
                              <Flex justify="space-between" align="center">
                                <HStack>
                                  <Avatar 
                                    size="sm" 
                                    name={offer.provider.name} 
                                    src={offer.provider.profile?.avatar} 
                                  />
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="bold">{offer.provider.name}</Text>
                                    <Badge colorScheme={
                                      offer.status === 'APPROVED' ? 'green' :
                                      offer.status === 'REJECTED' ? 'red' :
                                      'gray'
                                    }>
                                      {offer.status}
                                    </Badge>
                                  </VStack>
                                </HStack>
                                
                                <Text fontWeight="bold" fontSize="lg" color="brand.600">
                                  ${Number(offer.price).toFixed(2)}
                                </Text>
                              </Flex>
                            </CardHeader>
                            
                            <CardBody>
                              <Text noOfLines={2}>{offer.description}</Text>
                              
                              {offer.photos && offer.photos.length > 0 && (
                                <Box mt={2} h="100px" overflow="hidden" borderRadius="md">
                                  <Image 
                                    src={offer.photos[0]} 
                                    alt={`${offer.provider.name}'s offer`} 
                                    objectFit="cover"
                                    w="100%"
                                    h="100%"
                                  />
                                </Box>
                              )}
                            </CardBody>
                            
                            <CardFooter pt={0}>
                              <Flex width="100%" justify="space-between">
                                <Button 
                                  leftIcon={<ChatIcon />} 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenChat(offer)}
                                >
                                  Chat
                                </Button>
                                
                                <HStack>
                                  {offer.status === 'PENDING' && (
                                    <>
                                      <Button 
                                        leftIcon={<CloseIcon />} 
                                        colorScheme="red" 
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRejectOffer(offer.id)}
                                      >
                                        Reject
                                      </Button>
                                      
                                      <Button 
                                        leftIcon={<CheckIcon />} 
                                        colorScheme="green" 
                                        size="sm"
                                        onClick={() => handleApproveOffer(offer.id)}
                                      >
                                        Approve
                                      </Button>
                                    </>
                                  )}
                                  
                                  {offer.status === 'APPROVED' && offer.transaction?.status === 'PENDING' && (
                                    <Button 
                                      colorScheme="brand" 
                                      size="sm"
                                      onClick={() => {
                                        setActiveOffer(offer);
                                        onPaymentModalOpen();
                                      }}
                                    >
                                      Pay Now
                                    </Button>
                                  )}
                                  
                                  {offer.status === 'APPROVED' && 
                                   offer.transaction?.status === 'ESCROW' && (
                                    <Button 
                                      colorScheme="green" 
                                      size="sm"
                                      onClick={() => handleConfirmArrival(offer.transaction.id)}
                                    >
                                      Confirm Delivery
                                    </Button>
                                  )}
                                </HStack>
                              </Flex>
                            </CardFooter>
                          </Card>
                        ))}
                      </SimpleGrid>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Box>
        
        {/* Offer Details Modal */}
        <Modal isOpen={isOfferModalOpen} onClose={onOfferModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Offer Details</ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              {activeOffer && (
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center">
                    <HStack>
                      <Avatar 
                        size="md" 
                        name={activeOffer.provider.name} 
                        src={activeOffer.provider.profile?.avatar} 
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="lg">{activeOffer.provider.name}</Text>
                        <Badge colorScheme={
                          activeOffer.status === 'APPROVED' ? 'green' :
                          activeOffer.status === 'REJECTED' ? 'red' :
                          'gray'
                        }>
                          {activeOffer.status}
                        </Badge>
                      </VStack>
                    </HStack>
                    
                    <Text fontWeight="bold" fontSize="xl" color="brand.600">
                      ${Number(activeOffer.price).toFixed(2)}
                    </Text>
                  </Flex>
                  
                  <Divider />
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Description</Text>
                    <Text>{activeOffer.description}</Text>
                  </Box>
                  
                  {activeOffer.photos && activeOffer.photos.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Photos</Text>
                      <SimpleGrid columns={2} spacing={2}>
                        {activeOffer.photos.map((photo, index) => (
                          <Box key={index} h="150px" overflow="hidden" borderRadius="md">
                            <Image 
                              src={photo} 
                              alt={`Photo ${index + 1}`} 
                              objectFit="cover"
                              w="100%"
                              h="100%"
                            />
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                </VStack>
              )}
            </ModalBody>
            
            <ModalFooter>
              <Button colorScheme="brand" mr={3} onClick={onOfferModalClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Chat Modal */}
        <Modal isOpen={isChatModalOpen} onClose={onChatModalClose} size="xl">
          <ModalOverlay />
          <ModalContent h="80vh">
            <ModalHeader>
              Chat with {activeOffer?.provider.name}
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody overflowY="hidden" display="flex" flexDirection="column">
              {activeOffer && activeOffer.chat && (
                <ChatComponent chatId={activeOffer.chat.id} offerId={activeOffer.id} />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
        
        {/* Payment Modal */}
        <Modal isOpen={isPaymentModalOpen} onClose={onPaymentModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Payment</ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              {activeOffer && activeOffer.transaction && (
                <Elements stripe={stripePromise}>
                  <PaymentComponent 
                    transaction={activeOffer.transaction} 
                    offer={activeOffer}
                    onSuccess={() => {
                      onPaymentModalClose();
                      // Refresh party data
                      fetch(`/api/parties/${party.id}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            setParty(data.data);
                          }
                        });
                    }}
                  />
                </Elements>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </MainLayout>
  );
}