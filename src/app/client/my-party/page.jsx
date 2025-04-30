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
  AccordionIcon,
  Icon
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
  StarIcon,
  CheckCircleIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import { format } from 'date-fns';
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
  const [isPublishing, setIsPublishing] = useState(false);
  
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
          console.log('Fetching party with ID:', partyId);
          const response = await fetch(`/api/parties/${partyId}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch party:', response.status, errorText);
            throw new Error(`Failed to fetch party: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success) {
            console.log('Fetched party data:', data.data);
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
  
  // Handle party publishing with OpenAI verification
  const handlePublishParty = async () => {
    if (!party) return;
    
    try {
      setIsPublishing(true);
      
      // Call the verify API endpoint which uses OpenAI
      const response = await fetch(`/api/parties/${party.id}/verify`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || data.error?.details || 'Failed to verify party');
      }
      
      if (data.success) {
        toast({
          title: 'Party Published',
          description: 'Your party has been verified and published successfully!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Update party data with the new status
        const updatedParty = await fetch(`/api/parties/${party.id}`);
        const updatedData = await updatedParty.json();
        
        if (updatedData.success) {
          setParty(updatedData.data);
        }
      } else {
        throw new Error(data.error?.message || 'Failed to publish party');
      }
    } catch (error) {
      console.error('Publish party error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish party. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPublishing(false);
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
  
  if (!party) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="center" pt={10}>
          <Heading>No Party Found</Heading>
          <Text>You don't have an active party. Would you like to create one?</Text>
          <Button 
            colorScheme="brand" 
            size="lg" 
            onClick={() => router.push('/client/create-party')}
          >
            Create a Party
          </Button>
        </VStack>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">{party.name}</Heading>
          <Text color="gray.600" mt={2}>
            Manage your party details and services
          </Text>
        </Box>
        
        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <HStack>
                  <Icon as={CalendarIcon} color="brand.500" />
                  <Text fontWeight="bold">Date & Time</Text>
                </HStack>
                <Badge colorScheme={getStatusColor(party.status)} fontSize="md" px={2} py={1}>
                  {party.status.replace('_', ' ')}
                </Badge>
              </Flex>
              
              <HStack spacing={4}>
                <Box>
                  <Text color="gray.600">Date</Text>
                  <Text fontWeight="medium">{format(new Date(party.date), 'MMMM d, yyyy')}</Text>
                </Box>
                <Box>
                  <Text color="gray.600">Time</Text>
                  <Text fontWeight="medium">{party.startTime}</Text>
                </Box>
                <Box>
                  <Text color="gray.600">Location</Text>
                  <Text fontWeight="medium">{party.city?.name}</Text>
                </Box>
              </HStack>
              
              <Divider />

              {/* Add detailed party information section */}
              <Box>
                <Text fontWeight="bold" mb={4}>Party Details</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text color="gray.600">Party Type</Text>
                    <Text fontWeight="medium">{party.type || "Not specified"}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.600">Number of Guests</Text>
                    <Text fontWeight="medium">{party.guestCount || "Not specified"}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.600">Budget</Text>
                    <Text fontWeight="medium">${party.budget?.toFixed(2) || "Not specified"}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.600">Theme</Text>
                    <Text fontWeight="medium">{party.theme || "Not specified"}</Text>
                  </Box>
                </SimpleGrid>
                
                {party.description && (
                  <Box mt={4}>
                    <Text color="gray.600">Description</Text>
                    <Text>{party.description}</Text>
                  </Box>
                )}
                
                {party.specialRequests && (
                  <Box mt={4}>
                    <Text color="gray.600">Special Requests</Text>
                    <Text>{party.specialRequests}</Text>
                  </Box>
                )}
              </Box>
              
              <Divider />

              <Box>
                <Text fontWeight="bold" mb={4}>Services</Text>
                <VStack spacing={3} align="stretch">
                  {party.partyServices.map(service => (
                    <Card key={service.id} variant="outline" p={0} mb={2}>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <Flex justify="space-between" align="center">
                            <HStack>
                              <Text fontWeight="bold">{service.service.name}</Text>
                              <Badge colorScheme={getStatusColor(service.status)}>
                                {service.status}
                              </Badge>
                            </HStack>
                            <Text fontWeight="medium" color="green.500">
                              ${Number(service.service.price).toFixed(2)}
                            </Text>
                          </Flex>
                          
                          <Text fontSize="sm" color="gray.600">
                            {service.service.description?.substring(0, 100)}
                            {service.service.description?.length > 100 ? "..." : ""}
                          </Text>
                          
                          {service.specificOptions && Object.keys(service.specificOptions).length > 0 && (
                            <Box p={2} bg="gray.50" borderRadius="md">
                              <Text fontSize="sm" fontWeight="medium" mb={1}>Specific Options:</Text>
                              <SimpleGrid columns={2} spacing={2} fontSize="sm">
                                {Object.entries(service.specificOptions).map(([key, value]) => (
                                  <Box key={key}>
                                    <Text as="span" fontWeight="medium">{key}: </Text>
                                    <Text as="span">{value.toString()}</Text>
                                  </Box>
                                ))}
                              </SimpleGrid>
                            </Box>
                          )}
                          
                          {service.offers && service.offers.length > 0 && (
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" mb={2}>Offers:</Text>
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                {service.offers.map((offer) => (
                                  <Card key={offer.id} variant="outline" size="sm" p={2}>
                                    <HStack justify="space-between">
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="sm">{offer.provider.name}</Text>
                                        <Text fontSize="xs" color="gray.500">
                                          Status: <Badge colorScheme={getStatusColor(offer.status)}>{offer.status}</Badge>
                                        </Text>
                                      </VStack>
                                      <Text fontWeight="bold" color="green.500">${Number(offer.amount).toFixed(2)}</Text>
                                    </HStack>
                                    <HStack mt={2} spacing={2}>
                                      <Button 
                                        size="xs" 
                                        leftIcon={<ChatIcon />} 
                                        onClick={() => handleOpenChat(offer)}
                                        isDisabled={!offer.chat}
                                      >
                                        Chat
                                      </Button>
                                      <Button 
                                        size="xs" 
                                        onClick={() => handleViewOffer(offer)}
                                      >
                                        Details
                                      </Button>
                                    </HStack>
                                  </Card>
                                ))}
                              </SimpleGrid>
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </Box>
              
              <Divider />
              
              {/* Transaction Details Section */}
              <Box>
                <Heading as="h3" size="md" mb={4}>
                  Transaction Details
                </Heading>
                
                {party.partyServices.some(service => 
                  service.offers && service.offers.some(offer => offer.transaction)
                ) ? (
                  <VStack spacing={4} align="stretch">
                    {party.partyServices.map(service => {
                      // Find approved offers with transactions
                      const approvedOffers = service.offers.filter(
                        offer => offer.status === 'APPROVED' && offer.transaction
                      );
                      
                      if (approvedOffers.length === 0) return null;
                      
                      return approvedOffers.map(offer => (
                        <Card key={offer.id} variant="outline">
                          <CardBody>
                            <VStack align="stretch" spacing={3}>
                              <HStack justify="space-between">
                                <Text fontWeight="bold">{service.service.name}</Text>
                                <Badge 
                                  colorScheme={
                                    offer.transaction.status === 'COMPLETED' ? 'green' :
                                    offer.transaction.status === 'ESCROW' ? 'blue' :
                                    offer.transaction.status === 'PENDING' ? 'yellow' :
                                    'gray'
                                  }
                                  px={2}
                                  py={1}
                                >
                                  {offer.transaction.status.replace('_', ' ')}
                                </Badge>
                              </HStack>
                              
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <Box>
                                  <Text color="gray.600" fontSize="sm">Payment Details</Text>
                                  <HStack mt={1}>
                                    <Text fontWeight="bold">Amount:</Text>
                                    <Text>${Number(offer.transaction.amount).toFixed(2)}</Text>
                                  </HStack>
                                  {offer.transaction.clientFeePercent && (
                                    <HStack mt={1}>
                                      <Text fontWeight="bold">Service Fee:</Text>
                                      <Text>
                                        {offer.transaction.clientFeePercent}% 
                                        (${(Number(offer.transaction.amount) * offer.transaction.clientFeePercent / 100).toFixed(2)})
                                      </Text>
                                    </HStack>
                                  )}
                                  <HStack mt={1}>
                                    <Text fontWeight="bold">Provider:</Text>
                                    <Text>{offer.provider.name}</Text>
                                  </HStack>
                                </Box>
                                
                                <Box>
                                  <Text color="gray.600" fontSize="sm">Status & Dates</Text>
                                  <HStack mt={1}>
                                    <Text fontWeight="bold">Created:</Text>
                                    <Text>{format(new Date(offer.transaction.createdAt), 'MMM d, yyyy h:mm a')}</Text>
                                  </HStack>
                                  {offer.transaction.escrowStartTime && (
                                    <HStack mt={1}>
                                      <Text fontWeight="bold">Escrow Start:</Text>
                                      <Text>{format(new Date(offer.transaction.escrowStartTime), 'MMM d, yyyy h:mm a')}</Text>
                                    </HStack>
                                  )}
                                  {offer.transaction.escrowEndTime && (
                                    <HStack mt={1}>
                                      <Text fontWeight="bold">Escrow End:</Text>
                                      <Text>{format(new Date(offer.transaction.escrowEndTime), 'MMM d, yyyy h:mm a')}</Text>
                                    </HStack>
                                  )}
                                </Box>
                              </SimpleGrid>
                              
                              {offer.transaction.status === 'ESCROW' && (
                                <HStack spacing={4} mt={2}>
                                  <Button 
                                    size="sm" 
                                    colorScheme="green" 
                                    leftIcon={<CheckIcon />}
                                    onClick={() => handleConfirmArrival(offer.transaction.id)}
                                  >
                                    Confirm Provider Arrived
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    colorScheme="red" 
                                    variant="outline"
                                    onClick={() => handleFileDispute(offer.transaction.id)}
                                  >
                                    File Dispute
                                  </Button>
                                </HStack>
                              )}
                              
                              {offer.transaction.status === 'PROVIDER_REVIEW' && (
                                <Box p={3} bg="yellow.50" borderRadius="md">
                                  <Text fontWeight="medium">This transaction is awaiting provider approval.</Text>
                                </Box>
                              )}
                              
                              {offer.transaction.status === 'COMPLETED' && (
                                <Box p={3} bg="green.50" borderRadius="md">
                                  <Text fontWeight="medium">
                                    This transaction has been completed. Funds have been released to the provider.
                                  </Text>
                                </Box>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      ));
                    })}
                  </VStack>
                ) : (
                  <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
                    <Text>No transactions have been created for this party yet.</Text>
                    <Text mt={2} fontSize="sm" color="gray.500">
                      Transactions are created when you approve service offers.
                    </Text>
                  </Box>
                )}
              </Box>
              
              <Divider />
              
              <Flex justify="space-between">
                <Button variant="outline" onClick={() => router.push('/client/dashboard')}>
                  Back to Dashboard
                </Button>
                <HStack>
                  {party.status === 'DRAFT' && (
                    <Button 
                      colorScheme="green" 
                      onClick={handlePublishParty}
                      isLoading={isPublishing}
                      loadingText="Publishing"
                    >
                      Publish Party
                    </Button>
                  )}
                  <Button colorScheme="brand" onClick={() => router.push(`/client/edit-party?id=${party.id}`)}>
                    Edit Party
                  </Button>
                </HStack>
              </Flex>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
      
      {/* Offer Modal */}
      <Modal isOpen={isOfferModalOpen} onClose={onOfferModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          {activeOffer && (
            <>
              <ModalHeader>Offer from {activeOffer.provider.name}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <Avatar 
                      size="md" 
                      name={activeOffer.provider.name} 
                      src={activeOffer.provider.profile?.avatar}
                    />
                    <Box>
                      <Heading size="md">{activeOffer.provider.name}</Heading>
                      <Text fontSize="sm" color="gray.600">Service Provider</Text>
                    </Box>
                  </HStack>
                  
                  <Divider />
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Service</Text>
                    <Text>{activeOffer.service?.name || 'Service information unavailable'}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Offer Price</Text>
                    <Text fontSize="xl" fontWeight="bold" color="green.500">
                      ${Number(activeOffer.price).toFixed(2)}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Description</Text>
                    <Text>{activeOffer.description}</Text>
                  </Box>
                  
                  {activeOffer.photos && activeOffer.photos.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Photos</Text>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                        {activeOffer.photos.map((photo, index) => (
                          <Image 
                            key={index}
                            src={photo}
                            alt={`Offer photo ${index+1}`}
                            borderRadius="md"
                            objectFit="cover"
                            height="150px"
                          />
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onOfferModalClose}>
                  Close
                </Button>
                {activeOffer.status === 'PENDING' && (
                  <>
                    <Button 
                      colorScheme="red" 
                      variant="outline" 
                      mr={3}
                      onClick={() => {
                        handleRejectOffer(activeOffer.id);
                        onOfferModalClose();
                      }}
                    >
                      Reject
                    </Button>
                    <Button 
                      colorScheme="green" 
                      onClick={() => {
                        handleApproveOffer(activeOffer.id);
                        onOfferModalClose();
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* Chat Modal */}
      <Modal isOpen={isChatModalOpen} onClose={onChatModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          {activeOffer && (
            <>
              <ModalHeader>Chat with {activeOffer.provider.name}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {activeOffer.chat ? (
                  <ChatComponent chatId={activeOffer.chat.id} />
                ) : (
                  <Text>No chat available for this offer.</Text>
                )}
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onChatModalClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={onPaymentModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          {activeOffer && activeOffer.transaction && (
            <>
              <ModalHeader>Payment for {activeOffer.service?.name || 'Service'}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Elements stripe={stripePromise}>
                  <PaymentComponent 
                    transaction={activeOffer.transaction}
                    onSuccess={() => {
                      onPaymentModalClose();
                      // Refresh party data
                      router.refresh();
                    }}
                  />
                </Elements>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onPaymentModalClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Container>
  );
}