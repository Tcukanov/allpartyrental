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

                <Box>
                  <Text fontWeight="bold" mb={4}>Services</Text>
                  <VStack spacing={3} align="stretch">
                    {party.partyServices.map(service => (
                      <Flex key={service.id} justify="space-between" align="center">
                        <Text>{service.service.name}</Text>
                        <Badge colorScheme={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </Flex>
                    ))}
                      </VStack>
                </Box>
                  
                  <Divider />
                  
                <Flex justify="space-between">
                  <Button variant="outline" onClick={() => router.push('/client/dashboard')}>
                    Back to Dashboard
                  </Button>
                  <Button colorScheme="brand" onClick={() => router.push(`/client/edit-party?id=${party.id}`)}>
                    Edit Party
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
                </VStack>
      </Container>
    </MainLayout>
  );
}