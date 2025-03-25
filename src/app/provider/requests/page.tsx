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
  useDisclosure
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';

interface Request {
  id: string;
  clientId: string;
  serviceId: string;
  status: string;
  client: {
    name: string;
    email: string;
  };
  service: {
    name: string;
    description: string;
    price: number;
  };
  message: string;
  createdAt: string;
}

export default function ProviderRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Check if user is authenticated and a provider
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'PROVIDER') {
      router.push('/');
      toast({
        title: 'Access Denied',
        description: 'Only providers can access this page',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      fetchRequests();
    }
  }, [session, status, router]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/provider/requests');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data || []);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load requests',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/provider/requests/${requestId}/approve`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the request status in the local state
        setRequests(requests.map(req => 
          req.id === requestId ? { ...req, status: 'APPROVED' } : req
        ));
        
        toast({
          title: 'Success',
          description: 'Request approved successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error?.message || 'Failed to approve request');
      }
    } catch (err) {
      console.error('Error approving request:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve request',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onClose();
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(`/api/provider/requests/${requestId}/reject`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the request status in the local state
        setRequests(requests.map(req => 
          req.id === requestId ? { ...req, status: 'REJECTED' } : req
        ));
        
        toast({
          title: 'Success',
          description: 'Request rejected successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error?.message || 'Failed to reject request');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject request',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onClose();
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const confirmAction = (requestId: string, action: 'approve' | 'reject') => {
    setSelectedRequest(requestId);
    setActionType(action);
    onOpen();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return <Badge colorScheme="yellow">Pending</Badge>;
      case 'APPROVED':
        return <Badge colorScheme="green">Approved</Badge>;
      case 'REJECTED':
        return <Badge colorScheme="red">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" size="xl" mb={6}>Service Requests</Heading>
      
      {error && (
        <Box mb={6} p={4} bg="red.100" color="red.800" borderRadius="md">
          <Text>{error}</Text>
        </Box>
      )}

      {requests.length === 0 ? (
        <Box p={8} textAlign="center" bg="gray.50" borderRadius="md">
          <Text fontSize="lg">You don't have any service requests yet</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Service</Th>
                <Th>Client</Th>
                <Th>Message</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {requests.map((request) => (
                <Tr key={request.id}>
                  <Td>
                    <Text fontWeight="bold">{request.service.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      ${request.service.price.toFixed(2)}
                    </Text>
                  </Td>
                  <Td>
                    <Text>{request.client.name}</Text>
                    <Text fontSize="sm" color="gray.500">{request.client.email}</Text>
                  </Td>
                  <Td maxW="200px">
                    <Text noOfLines={2}>{request.message}</Text>
                  </Td>
                  <Td>{getStatusBadge(request.status)}</Td>
                  <Td>
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </Td>
                  <Td>
                    {request.status === 'PENDING' && (
                      <Flex>
                        <Button
                          size="sm"
                          colorScheme="green"
                          mr={2}
                          onClick={() => confirmAction(request.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => confirmAction(request.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </Flex>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={undefined}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? You {actionType === 'approve' ? 'will provide this service to the client' : 'cannot undo this action afterwards'}.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme={actionType === 'approve' ? 'green' : 'red'}
                onClick={() => {
                  if (selectedRequest) {
                    if (actionType === 'approve') {
                      handleApprove(selectedRequest);
                    } else if (actionType === 'reject') {
                      handleReject(selectedRequest);
                    }
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