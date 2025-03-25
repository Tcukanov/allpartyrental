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
  useDisclosure
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: string;
  createdAt: string;
}

export default function ProviderServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

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
      fetchServices();
    }
  }, [session, status, router]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/provider/services');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data || []);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load services',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
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
      case 'PENDING':
        return <Badge colorScheme="yellow">Pending</Badge>;
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

      {error && (
        <Box mb={6} p={4} bg="red.100" color="red.800" borderRadius="md">
          <Text>{error}</Text>
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
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">{service.name}</Heading>
                  <Text color="gray.500" fontSize="sm">
                    Category: {service.category}
                  </Text>
                  <Text noOfLines={3}>{service.description}</Text>
                  <Text fontWeight="bold">
                    ${service.price.toFixed(2)}
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
  );
} 