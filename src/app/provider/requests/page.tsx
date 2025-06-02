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
import { OfferStatus, TransactionStatus } from '@prisma/client';
import { getOfferStatusConfig, getTransactionStatusConfig, offerRequiresAction, transactionRequiresAction } from '@/utils/statusConfig';
import ProviderLayout from '../components/ProviderLayout';

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
  transaction?: {
    id: string;
    status: string;
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
      
      // Add cache-busting query parameter to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/provider/requests?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
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
        console.log('Fetched offers successfully:', data.data?.length || 0, 'offers');
        console.log('Full API response:', JSON.stringify(data, null, 2));
        
        // Log detailed status of each offer for debugging
        if (data.data && data.data.length > 0) {
          console.log('Offer statuses:', data.data.map(offer => ({
            id: offer.id,
            status: offer.status,
            transactionStatus: offer.transaction?.status || 'NONE',
            clientName: offer.client?.name,
            serviceName: offer.service?.name
          })));
          
          // Check for missing required fields
          const invalidOffers = data.data.filter(offer => 
            !offer.client || !offer.client.name || 
            !offer.service || !offer.service.name ||
            !offer.partyService || !offer.partyService.party || !offer.partyService.party.name
          );
          
          if (invalidOffers.length > 0) {
            console.error('Found offers with missing required fields:', invalidOffers.map(offer => ({
              id: offer.id,
              hasClient: !!offer.client,
              clientName: offer.client?.name,
              hasService: !!offer.service,
              serviceName: offer.service?.name,
              hasPartyService: !!offer.partyService,
              hasParty: !!offer.partyService?.party,
              partyName: offer.partyService?.party?.name
            })));
          }
          
          console.log('Setting offers state with:', data.data.length, 'offers');
          setOffers(data.data);
          console.log('Offers state set. Current offers length should be:', data.data.length);
        } else {
          console.log('No offers in response data');
          setOffers([]);
        }
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
      console.log(`Attempting to approve offer: ${offerId}`);
      
      const response = await fetch(`/api/provider/requests/${offerId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Log full response for debugging
      console.log(`Approve response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`Approve response body: ${responseText}`);
      
      // Try to parse as JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${data?.error?.message || 'Unknown error'}`);
      }
      
      if (data.success) {
        console.log(`Successfully approved offer: ${offerId}`);
        
        // Close the dialog first
        onClose();
        
        // Show success toast
        toast({
          title: 'Success',
          description: 'Offer approved successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Important: Immediately refresh offers from the server
        // Don't rely on state updates which may not trigger a re-render
        fetchOffers();
      } else {
        throw new Error(data.error?.message || 'Failed to approve offer');
      }
    } catch (err) {
      console.error('Error approving offer:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve offer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Clean up state
      setSelectedOffer(null);
      setActionType(null);
    }
  };

  const handleReject = async (offerId: string) => {
    try {
      console.log(`Attempting to reject offer: ${offerId}`);
      
      const response = await fetch(`/api/provider/requests/${offerId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Log full response for debugging
      console.log(`Reject response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`Reject response body: ${responseText}`);
      
      // Try to parse as JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${data?.error?.message || 'Unknown error'}`);
      }
      
      if (data.success) {
        console.log(`Successfully rejected offer: ${offerId}`);
        
        // Close the dialog first
        onClose();
        
        // Show success toast
        toast({
          title: 'Success',
          description: 'Offer rejected successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Important: Immediately refresh offers from the server
        // Don't rely on state updates which may not trigger a re-render
        fetchOffers();
      } else {
        throw new Error(data.error?.message || 'Failed to reject offer');
      }
    } catch (err) {
      console.error('Error rejecting offer:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject offer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Clean up state
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

  const getStatusBadge = (offer: Offer) => {
    // Always prioritize the offer status as that's what the provider is most concerned with
    const offerConfig = getOfferStatusConfig(offer.status);
    const offerBadge = <Badge colorScheme={offerConfig.color}>{offerConfig.label}</Badge>;
    
    // For pending offers, just show pending
    if (offer.status === 'PENDING') {
      return offerBadge;
    }
    
    // For approved offers, we might also want to show transaction status
    if (offer.status === 'APPROVED' && offer.transaction?.status) {
      const txConfig = getTransactionStatusConfig(offer.transaction.status);
      return (
        <Flex gap={2} align="center">
          <Badge colorScheme={offerConfig.color}>{offerConfig.label}</Badge>
          <Text fontSize="xs">→</Text>
          <Badge colorScheme={txConfig.color}>{txConfig.label}</Badge>
        </Flex>
      );
    }
    
    // For rejected or cancelled, just show that status
    return offerBadge;
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
    <ProviderLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl">Service Requests</Heading>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <Box p={4} bg="gray.100" borderRadius="md">
              <Text fontSize="sm">
                Debug: offers.length = {offers.length}, loading = {loading.toString()}, error = {error || 'none'}
              </Text>
              {offers.length > 0 && (
                <Text fontSize="sm" mt={2}>
                  First offer: {JSON.stringify({
                    id: offers[0]?.id,
                    status: offers[0]?.status,
                    clientName: offers[0]?.client?.name
                  })}
                </Text>
              )}
            </Box>
          )}
          
          {offers.length === 0 ? (
            <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
              <Text>No service requests found.</Text>
              <Text fontSize="sm" color="gray.500" mt={2}>
                Debug: API returned {offers.length} offers. Loading: {loading.toString()}
              </Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Client</Th>
                  <Th>Service</Th>
                  <Th>Party</Th>
                  <Th>Price</Th>
                  <Th width="180px">Status</Th>
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
                    <Td>{getStatusBadge(offer)}</Td>
                    <Td>{formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}</Td>
                    <Td>
                      <Flex gap={2}>
                        {/* Show approve and reject buttons only for pending offers */}
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
                        {/* Show chat button for all offers except REJECTED and CANCELLED */}
                        {offer.status !== 'REJECTED' && offer.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            colorScheme="blue"
                            leftIcon={<Icon as={ChatIcon} />}
                            onClick={() => handleCreateChat(offer)}
                          >
                            Chat
                          </Button>
                        )}
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
    </ProviderLayout>
  );
} 