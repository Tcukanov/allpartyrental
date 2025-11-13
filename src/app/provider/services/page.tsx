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
  CardBody,
  CardFooter,
  Stack,
  Badge,
  Spinner,
  useToast,
  IconButton,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Image
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import ProviderLayout from '../components/ProviderLayout';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: { name?: string } | string;
  status: string;
  createdAt: string;
  photos?: string[];
}

export default function ProviderServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [paypalStatus, setPaypalStatus] = useState<{
    isConnected: boolean;
    canReceivePayments: boolean;
    merchantId?: string;
  } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'PROVIDER') {
      router.push('/');
      return;
    }

    fetchServices();
    fetchPaypalStatus();
  }, [session, status, router]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/provider/services');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load services',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaypalStatus = async () => {
    try {
      const response = await fetch('/api/provider/profile');
      if (response.ok) {
        const data = await response.json();
        const provider = data.provider;
        
        if (provider) {
          setPaypalStatus({
            isConnected: !!provider.paypalMerchantId,
            canReceivePayments: provider.paypalCanReceivePayments || false,
            merchantId: provider.paypalMerchantId
          });
        }
      }
    } catch (error) {
      console.error('Error fetching PayPal status:', error);
    }
  };

  const handleAddService = () => {
    router.push('/provider/services/create');
  };

  const handleEditService = (serviceId: string) => {
    router.push(`/provider/services/edit/${serviceId}`);
  };

  const confirmDeleteService = (serviceId: string) => {
    setServiceToDelete(serviceId);
    onOpen();
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    
    try {
      const response = await fetch(`/api/provider/services/${serviceToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setServices(services.filter(service => service.id !== serviceToDelete));
        toast({
          title: 'Success',
          description: 'Service deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error?.message || 'Failed to delete service');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete service',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onClose();
      setServiceToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge colorScheme="green">Active</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge colorScheme="orange">Pending Approval</Badge>;
      case 'INACTIVE':
        return <Badge colorScheme="red">Inactive</Badge>;
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
    <ProviderLayout>
      <Container maxW="container.xl" py={8}>
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Heading as="h1" size="xl">My Services</Heading>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="brand" 
            onClick={handleAddService}
          >
            Add New Service
          </Button>
        </Flex>

        <Box mb={6} p={4} bg="blue.50" color="blue.800" borderRadius="md">
          <Text fontWeight="medium">Service Approval Process</Text>
          <Text fontSize="sm">
            All new services and updates to active listings require admin approval before they become visible to clients. 
            Services with <Badge colorScheme="orange" size="sm">Pending Approval</Badge> status are under review. 
            Once approved, the status will change to <Badge colorScheme="green" size="sm">Active</Badge>.
          </Text>
        </Box>

        {/* PayPal Connection Warning */}
        {paypalStatus && !paypalStatus.canReceivePayments && (
          <Box mb={6} p={4} bg="orange.50" borderColor="orange.200" borderWidth="1px" borderRadius="md">
            <Flex align="center" justify="space-between" direction={{ base: 'column', md: 'row' }} gap={4}>
              <Box>
                <Heading size="sm" color="orange.800" mb={1}>
                  PayPal Connection Required
                </Heading>
                <Text color="orange.700" fontSize="sm">
                  {paypalStatus.isConnected
                    ? 'Your PayPal account is connected but payments are not enabled. Complete the setup to activate services.'
                    : 'Connect your PayPal account to create and activate services. This ensures you can receive payments from customers.'
                  }
                </Text>
              </Box>
              <Button
                colorScheme="orange"
                size="sm"
                onClick={() => router.push('/provider/dashboard/paypal')}
                flexShrink={0}
              >
                {paypalStatus.isConnected ? 'Complete Setup' : 'Connect PayPal'}
              </Button>
            </Flex>
          </Box>
        )}

        {services.length === 0 ? (
          <Box p={8} textAlign="center" bg="gray.50" borderRadius="md">
            <Text fontSize="lg" mb={4}>You don't have any services yet</Text>
            <Button 
              colorScheme="brand" 
              onClick={handleAddService}
            >
              Create Your First Service
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {services.map((service) => (
              <Card key={service.id} boxShadow="md" height="100%">
                {service.photos && service.photos.length > 0 ? (
                  <Image 
                    src={service.photos[0]} 
                    alt={service.name}
                    height="200px"
                    width="100%"
                    objectFit="cover"
                  />
                ) : (
                  <Box 
                    height="200px"
                    width="100%"
                    bg="gray.100" 
                    display="flex" 
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.500">No image</Text>
                  </Box>
                )}
                <CardBody>
                  <Stack spacing={3}>
                    <Heading size="md">{service.name}</Heading>
                    <Text color="gray.500" fontSize="sm">
                      Category: {typeof service.category === 'string' ? service.category : service.category?.name || 'Uncategorized'}
                    </Text>
                    <Text noOfLines={3}>{service.description}</Text>
                    <Text fontWeight="bold">
                      ${Number(service.price).toFixed(2)}
                    </Text>
                    <HStack>
                      {getStatusBadge(service.status)}
                      <Text fontSize="sm" color="gray.500">
                        Created: {new Date(service.createdAt).toLocaleDateString()}
                      </Text>
                    </HStack>
                  </Stack>
                </CardBody>
                <CardFooter pt={0}>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Edit service"
                      icon={<EditIcon />}
                      onClick={() => handleEditService(service.id)}
                      size="sm"
                      variant="ghost"
                    />
                    <IconButton
                      aria-label="Delete service"
                      icon={<DeleteIcon />}
                      onClick={() => confirmDeleteService(service.id)}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                    />
                  </HStack>
                </CardFooter>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm Deletion</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              Are you sure you want to delete this service? This action cannot be undone.
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteService}>
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </ProviderLayout>
  );
} 