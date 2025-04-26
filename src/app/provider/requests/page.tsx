'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { ChatIcon, CalendarIcon } from '@chakra-ui/icons';
import { formatDistanceToNow } from 'date-fns';
import { OfferStatus } from '@prisma/client';

interface Offer {
  id: string;
  clientId: string;
  serviceId: string;
  partyServiceId: string;
  status: OfferStatus;
  price: number;
  description: string;
  client: {
    name: string;
    email: string;
  };
  service: {
    name: string;
    description: string;
    price: number;
  };
  partyService: {
    party: {
      id: string;
      name: string;
      date: string;
      startTime: string;
    }
  };
  createdAt: string;
}

export default function ProviderRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Check if user is authenticated and a provider
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
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
        fetchOffers();
      }
    }
  }, [session, status, router, toast]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      
      // First, try a simple data endpoint to check authentication
      try {
        const simpleResponse = await fetch('/api/health');
        const simpleData = await simpleResponse.json();
        
        // Log success for debugging
        console.log('Health check:', simpleData);
      } catch (healthError) {
        console.error('Health check failed:', healthError);
        // Continue with main request even if health check fails
      }
      
      const response = await fetch('/api/provider/requests');
      
      if (!response.ok) {
        throw new Error(`Error fetching requests: ${response.status} ${response.statusText}`);
      }
      
      // Try to parse response as text first for debugging
      const responseText = await response.text();
      
      // Check if response looks like HTML
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Received HTML instead of JSON:', responseText.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. You may need to log in again.');
      }
      
      // Parse the text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response:', responseText.substring(0, 200));
        throw new Error('Failed to parse server response as JSON');
      }
      
      if (data.success) {
        setOffers(data.data || []);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch offers');
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load offers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (offerId: string) => {
    try {
      const response = await fetch(`/api/provider/requests/${offerId}/approve`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the offer status in the local state
        setOffers(offers.map(offer => 
          offer.id === offerId ? { ...offer, status: 'APPROVED' } : offer
        ));
        
        toast({
          title: 'Success',
          description: 'Offer approved successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error?.message || 'Failed to approve offer');
      }
    } catch (err) {
      console.error('Error approving offer:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve offer',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onClose();
      setSelectedOffer(null);
      setActionType(null);
    }
  };

  const handleReject = async (offerId: string) => {
    try {
      const response = await fetch(`/api/provider/requests/${offerId}/reject`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the offer status in the local state
        setOffers(offers.map(offer => 
          offer.id === offerId ? { ...offer, status: 'REJECTED' } : offer
        ));
        
        toast({
          title: 'Success',
          description: 'Offer rejected successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error?.message || 'Failed to reject offer');
      }
    } catch (err) {
      console.error('Error rejecting offer:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject offer',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onClose();
      setSelectedOffer(null);
      setActionType(null);
    }
  };

  const confirmAction = (offerId: string, action: 'approve' | 'reject') => {
    setSelectedOffer(offerId);
    setActionType(action);
    onOpen();
  };

  const handleCreateChat = async (offer: Offer) => {
    try {
      // Show loading toast
      const loadingToastId = toast({
        title: "Creating chat",
        description: "Setting up a new conversation...",
        status: "loading",
        duration: null,
        isClosable: false,
      });
      
      const offerId = offer.id;
      
      // Create chat via API
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId }),
      });
      
      const data = await response.json();
      console.log("Chat creation response:", data);
      
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

  const getStatusBadge = (status: OfferStatus) => {
    const colorScheme = {
      PENDING: 'yellow',
      APPROVED: 'green',
      REJECTED: 'red',
      CANCELLED: 'gray'
    }[status];

    return (
      <Badge colorScheme={colorScheme}>
        {status}
      </Badge>
    );
  };

  if (loading) {
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

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Service Requests</Heading>
        
        {offers.length === 0 ? (
          <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
            <Text>No service requests found.</Text>
          </Box>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Client</Th>
                <Th>Service</Th>
                <Th>Party</Th>
                <Th>Price</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {offers.map((offer) => (
                <Tr key={offer.id}>
                  <Td>{offer.client.name}</Td>
                  <Td>{offer.service.name}</Td>
                  <Td>
                    <Button 
                      size="sm"
                      colorScheme="blue"
                      variant="solid"
                      rightIcon={<Icon as={CalendarIcon} />}
                      onClick={() => router.push(`/provider/party/${offer.partyService.party.id}`)}
                    >
                      {offer.partyService.party.name}
                    </Button>
                  </Td>
                  <Td>${offer.price}</Td>
                  <Td>{getStatusBadge(offer.status)}</Td>
                  <Td>{formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}</Td>
                  <Td>
                    <Flex gap={2}>
                      {offer.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => confirmAction(offer.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => confirmAction(offer.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        colorScheme="blue"
                        leftIcon={<Icon as={ChatIcon} />}
                        onClick={() => handleCreateChat(offer)}
                      >
                        Chat
                      </Button>
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </VStack>

      <AlertDialog 
        isOpen={isOpen} 
        onClose={onClose}
        leastDestructiveRef={cancelRef}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>
              {actionType === 'approve' ? 'Approve Offer' : 'Reject Offer'}
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to {actionType} this offer?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
              <Button
                colorScheme={actionType === 'approve' ? 'green' : 'red'}
                onClick={() => {
                  if (actionType === 'approve' && selectedOffer) {
                    handleApprove(selectedOffer);
                  } else if (actionType === 'reject' && selectedOffer) {
                    handleReject(selectedOffer);
                  }
                }}
                ml={3}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
} 