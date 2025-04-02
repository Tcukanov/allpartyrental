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
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stack,
  Badge,
  Spinner,
  useToast,
  HStack,
  VStack,
  Image,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Textarea,
  useDisclosure,
  Link,
  Grid,
  GridItem,
  Center,
  IconButton,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, ViewIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { FaCheck, FaTimes, FaUser, FaMoneyBillWave } from 'react-icons/fa';

interface Provider {
  id: string;
  name: string;
  email: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string | { name: string };
  status: string;
  createdAt: string;
  photos?: string[];
  provider: Provider;
}

// Helper function to safely format price
const formatPrice = (price: any): string => {
  if (!price) return '0.00';
  
  try {
    // Handle Decimal objects from Prisma
    if (typeof price === 'object' && price.toString) {
      return parseFloat(price.toString()).toFixed(2);
    }
    
    // Handle string or number values
    return parseFloat(String(price)).toFixed(2);
  } catch (error) {
    console.error('Error formatting price:', error);
    return '0.00';
  }
}

export default function ServiceApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { isOpen: isRejectModalOpen, onOpen: onRejectModalOpen, onClose: onRejectModalClose } = useDisclosure();

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/');
        toast({
          title: 'Access Denied',
          description: 'Only administrators can access this page',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        fetchPendingServices();
      }
    }
  }, [session, status, router, toast]);

  const fetchPendingServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/services/pending');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data || []);
      } else {
        throw new Error(data.error?.message || 'Failed to load services');
      }
    } catch (err) {
      console.error('Error fetching pending services:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load pending services',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (serviceId: string) => {
    try {
      setProcessingId(serviceId);
      const response = await fetch(`/api/admin/services/${serviceId}/approve`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Service Approved',
          description: 'The service has been approved and is now active',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Remove the approved service from the list
        setServices(services.filter(service => service.id !== serviceId));
      } else {
        throw new Error(data.error?.message || 'Failed to approve service');
      }
    } catch (err) {
      console.error('Error approving service:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve service',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (service: Service) => {
    setSelectedService(service);
    setRejectionReason('');
    onRejectModalOpen();
  };

  const handleReject = async () => {
    if (!selectedService) return;
    
    try {
      setProcessingId(selectedService.id);
      const response = await fetch(`/api/admin/services/${selectedService.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Service Rejected',
          description: 'The service has been rejected',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        
        // Remove the rejected service from the list
        setServices(services.filter(service => service.id !== selectedService.id));
        onRejectModalClose();
      } else {
        throw new Error(data.error?.message || 'Failed to reject service');
      }
    } catch (err) {
      console.error('Error rejecting service:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject service',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <Box mb={8}>
        <Heading as="h1" mb={2}>Service Approval</Heading>
        <Text color="gray.600">
          Review and approve or reject new service listings
        </Text>
        
        <HStack mt={4} spacing={4}>
          <Button 
            as={NextLink}
            href="/admin/dashboard"
            variant="outline"
          >
            Back to Dashboard
          </Button>
          
          <Button 
            onClick={fetchPendingServices}
            isLoading={loading}
          >
            Refresh
          </Button>
        </HStack>
      </Box>

      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {services.length === 0 ? (
        <Card>
          <CardBody>
            <Center py={8}>
              <Box textAlign="center">
                <Heading size="md" mb={4}>No Services Pending Approval</Heading>
                <Text color="gray.500">
                  All services have been reviewed. Check back later for new submissions.
                </Text>
              </Box>
            </Center>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {services.map((service) => (
            <Card key={service.id} overflow="hidden" variant="outline">
              <Box height="200px" bg="gray.100" position="relative">
                <Image
                  src={service.photos?.[0] || ''}
                  alt={service.name}
                  objectFit="cover"
                  width="100%"
                  height="100%"
                  fallback={
                    <Center height="100%" bg="gray.100">
                      <Text color="gray.500">No Image</Text>
                    </Center>
                  }
                />
                <Badge 
                  position="absolute" 
                  top="10px" 
                  right="10px" 
                  colorScheme="orange"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  Pending Review
                </Badge>
              </Box>
              
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">{service.name}</Heading>
                  
                  <Flex align="center">
                    <Box as={FaUser} color="gray.500" mr={2} />
                    <Text color="gray.600">{service.provider.name}</Text>
                  </Flex>
                  
                  <Flex align="center">
                    <Box as={FaMoneyBillWave} color="green.500" mr={2} />
                    <Text fontWeight="bold">${formatPrice(service.price)}</Text>
                  </Flex>
                  
                  <Badge width="fit-content" colorScheme="purple">
                    {typeof service.category === 'string' 
                      ? service.category 
                      : service.category?.name || 'Uncategorized'}
                  </Badge>
                  
                  <Text noOfLines={3}>{service.description}</Text>
                  
                  <Text fontSize="sm" color="gray.500">
                    Submitted on {new Date(service.createdAt).toLocaleDateString()}
                  </Text>
                </Stack>
              </CardBody>
              
              <Divider />
              
              <CardFooter>
                <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                  <GridItem>
                    <Button
                      colorScheme="green"
                      leftIcon={<FaCheck />}
                      width="100%"
                      onClick={() => handleApprove(service.id)}
                      isLoading={processingId === service.id}
                      loadingText="Approving"
                    >
                      Approve
                    </Button>
                  </GridItem>
                  <GridItem>
                    <Button
                      colorScheme="red"
                      leftIcon={<FaTimes />}
                      width="100%"
                      onClick={() => openRejectModal(service)}
                      isDisabled={processingId === service.id}
                    >
                      Reject
                    </Button>
                  </GridItem>
                </Grid>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}
      
      {/* Rejection Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={onRejectModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Service</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>
              You are about to reject <strong>{selectedService?.name}</strong>. Please provide a reason for rejection:
            </Text>
            <FormControl>
              <FormLabel>Reason for Rejection</FormLabel>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this service is being rejected"
                rows={4}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="red" 
              mr={3} 
              onClick={handleReject}
              isLoading={processingId === selectedService?.id}
              loadingText="Rejecting"
              isDisabled={!rejectionReason}
            >
              Reject Service
            </Button>
            <Button onClick={onRejectModalClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 