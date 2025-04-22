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
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Switch,
  Checkbox,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
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
  category: string | { 
    id: string;
    name: string;
    slug?: string;
  };
  status: string;
  createdAt: string;
  photos?: string[];
  provider: Provider;
  colors: string[];
  availableDays: string[];
  availableHoursStart?: string;
  availableHoursEnd?: string;
  minRentalHours?: number;
  maxRentalHours?: number;
  city?: {
    id: string;
    name: string;
    state?: string;
  };
  metadata?: string;
  filterValues?: Record<string, any>;
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
  const { isOpen: isDetailsModalOpen, onOpen: onDetailsModalOpen, onClose: onDetailsModalClose } = useDisclosure();
  const [editedService, setEditedService] = useState<Service | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<any[]>([]);
  const [isFetchingFilters, setIsFetchingFilters] = useState(false);

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

  // Fetch cities for the dropdown
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch('/api/cities');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCities(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    }
    fetchCities();
  }, []);

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

  const fetchServiceFilters = async (serviceId: string) => {
    if (!serviceId) return;
    
    setIsFetchingFilters(true);
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/filters`);
      if (!response.ok) {
        throw new Error(`Failed to fetch filters: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched filter data:", data);
      
      if (data.success && data.data) {
        // Set filter values on the selected service
        if (selectedService) {
          selectedService.filterValues = data.data.filterValues;
          setSelectedService({...selectedService});
        }
        
        // Set category filters
        setCategoryFilters(data.data.categoryFilters || []);
      }
    } catch (error) {
      console.error("Error fetching service filters:", error);
      toast({
        title: "Error",
        description: "Failed to load filter values",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsFetchingFilters(false);
    }
  };

  const openDetailsModal = (service: Service) => {
    setSelectedService(service);
    setEditedService(null);
    setIsEditing(false);
    
    // Reset category filters
    setCategoryFilters([]);
    
    // Fetch filter values and category filters
    fetchServiceFilters(service.id);
    
    onDetailsModalOpen();
  };

  const handleEdit = () => {
    if (!selectedService) return;
    
    // Create a deep copy of selectedService to edit
    setEditedService(JSON.parse(JSON.stringify(selectedService)));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedService(null);
  };

  const handleSaveChanges = async () => {
    if (!editedService) return;
    
    setIsSaving(true);
    try {
      // Prepare the metadata
      let metadataToSave = editedService.metadata;
      if (editedService.filterValues) {
        try {
          metadataToSave = JSON.stringify({ filterValues: editedService.filterValues });
        } catch (e) {
          console.error('Error stringifying filterValues:', e);
        }
      }
      
      // Prepare the data to send
      const dataToSave = {
        ...editedService,
        metadata: metadataToSave,
        price: typeof editedService.price === 'string' 
          ? parseFloat(editedService.price) 
          : editedService.price
      };
      
      // Send the update request
      const response = await fetch(`/api/admin/services/${editedService.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Service Updated',
          description: 'The service has been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Update the service in the list and selected service
        setServices(services.map(service => 
          service.id === editedService.id ? data.service : service
        ));
        setSelectedService(data.service);
        setIsEditing(false);
      } else {
        throw new Error(data.error?.message || 'Failed to update service');
      }
    } catch (err) {
      console.error('Error updating service:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update service',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedService) return;
    
    const { name, value } = e.target;
    setEditedService({
      ...editedService,
      [name]: value,
    });
  };

  const handlePriceChange = (valueString: string) => {
    if (!editedService) return;
    
    setEditedService({
      ...editedService,
      price: parseFloat(valueString) || 0,
    });
  };

  const handleFilterValueChange = (filterId: string, value: any) => {
    if (!editedService || !editedService.filterValues) return;
    
    setEditedService({
      ...editedService,
      filterValues: {
        ...editedService.filterValues,
        [filterId]: value,
      },
    });
  };

  // Helper function to format filter keys into readable labels
  const formatFilterKey = (key: string): string => {
    // Check if key is an ID (like UUID or CUID)
    if (/^[a-f0-9]{24,32}$/i.test(key)) {
      return "Custom Field"; // This is likely an ID, so make a generic label
    }
    
    // Convert camelCase to spaces and capitalize
    return key
      .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim();
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

  const handleSaveFilters = async () => {
    if (!editedService || !editedService.filterValues) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/services/${editedService.id}/filters`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterValues: editedService.filterValues
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Filters Updated',
          description: 'The service specifications have been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Update the service with the new filter values
        if (selectedService) {
          selectedService.filterValues = data.data.filterValues;
          setSelectedService({...selectedService});
        }
      } else {
        throw new Error(data.error?.message || 'Failed to update filters');
      }
    } catch (err) {
      console.error('Error updating filters:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update filters',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
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

                  <Button 
                    size="sm" 
                    leftIcon={<ViewIcon />} 
                    onClick={() => openDetailsModal(service)}
                    variant="outline"
                    colorScheme="blue"
                  >
                    View Full Details
                  </Button>
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

      {/* Service Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={onDetailsModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>
            {isEditing ? 'Edit Service' : 'Service Details'}
            {!isEditing && (
              <Button 
                size="sm" 
                ml={4} 
                colorScheme="blue" 
                onClick={handleEdit}
              >
                Edit Service
              </Button>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedService && (
              <Tabs>
                <TabList>
                  <Tab>Basic Info</Tab>
                  <Tab>Specifications</Tab>
                  <Tab>Availability</Tab>
                  <Tab>Images</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    {isEditing && editedService ? (
                      <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                          <FormLabel>Service Name</FormLabel>
                          <Input
                            name="name"
                            value={editedService.name}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        
                        <FormControl isRequired>
                          <FormLabel>Price</FormLabel>
                          <NumberInput
                            min={0}
                            precision={2}
                            value={typeof editedService.price === 'number' 
                              ? editedService.price 
                              : parseFloat(editedService.price) || 0}
                            onChange={handlePriceChange}
                          >
                            <NumberInputField name="price" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Borough/City</FormLabel>
                          <Select
                            name="cityId"
                            value={editedService.city?.id || ''}
                            onChange={handleInputChange}
                          >
                            <option value="">Select City</option>
                            {cities.map(city => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        
                        <FormControl isRequired>
                          <FormLabel>Description</FormLabel>
                          <Textarea
                            name="description"
                            value={editedService.description}
                            onChange={handleInputChange}
                            rows={6}
                          />
                        </FormControl>
                      </VStack>
                    ) : (
                      <VStack spacing={6} align="stretch">
                        <Box>
                          <Heading size="sm" mb={2}>Basic Information</Heading>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <Box>
                              <Text fontWeight="bold">Name:</Text>
                              <Text>{selectedService.name}</Text>
                            </Box>
                            <Box>
                              <Text fontWeight="bold">Price:</Text>
                              <Text>${formatPrice(selectedService.price)}</Text>
                            </Box>
                            <Box>
                              <Text fontWeight="bold">Category:</Text>
                              <Text>
                                {typeof selectedService.category === 'string' 
                                  ? selectedService.category 
                                  : selectedService.category?.name || 'Uncategorized'}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontWeight="bold">Borough/City:</Text>
                              <Text>{selectedService.city?.name || 'Not specified'}</Text>
                            </Box>
                          </SimpleGrid>
                        </Box>
                        
                        <Box>
                          <Heading size="sm" mb={2}>Description</Heading>
                          <Text whiteSpace="pre-wrap">{selectedService.description}</Text>
                        </Box>
                        
                        <Box>
                          <Heading size="sm" mb={2}>Provider Information</Heading>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <Box>
                              <Text fontWeight="bold">Name:</Text>
                              <Text>{selectedService.provider.name}</Text>
                            </Box>
                            <Box>
                              <Text fontWeight="bold">Email:</Text>
                              <Text>{selectedService.provider.email}</Text>
                            </Box>
                          </SimpleGrid>
                        </Box>
                      </VStack>
                    )}
                  </TabPanel>
                  
                  <TabPanel>
                    {isEditing && editedService ? (
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm" mb={2}>Edit Specifications</Heading>
                        
                        {isFetchingFilters ? (
                          <Flex justify="center" py={4}>
                            <Spinner size="md" />
                            <Text ml={2}>Loading filter options...</Text>
                          </Flex>
                        ) : (
                          <>
                            {categoryFilters.length > 0 ? (
                              <>
                                {categoryFilters.map(filter => (
                                  <FormControl key={filter.id}>
                                    <FormLabel>
                                      {filter.name}
                                      {filter.isRequired && <Text as="span" color="red.500" ml={1}>*</Text>}
                                    </FormLabel>
                                    
                                    {filter.type === 'color' && (
                                      <SimpleGrid columns={{ base: 3, md: 4 }} spacing={2}>
                                        {filter.options.map(option => {
                                          const colorMap: Record<string, string> = {
                                            'Red': 'red.500',
                                            'Blue': 'blue.500',
                                            'Green': 'green.500',
                                            'Yellow': 'yellow.400',
                                            'Purple': 'purple.500',
                                            'Pink': 'pink.400',
                                            'Orange': 'orange.500',
                                            'White': 'gray.100',
                                            'Black': 'gray.800',
                                            'Gray': 'gray.500',
                                            'Brown': 'brown.500',
                                            'Teal': 'teal.500',
                                          };
                                          
                                          const colorValue = colorMap[option] || 'gray.400';
                                          const isSelected = editedService.filterValues[filter.id] === option || 
                                            (Array.isArray(editedService.filterValues[filter.id]) && 
                                             editedService.filterValues[filter.id]?.includes(option));
                                          
                                          return (
                                            <Box 
                                              key={option}
                                              p={2}
                                              borderWidth="1px"
                                              borderRadius="md"
                                              borderColor={isSelected ? 'blue.500' : 'gray.200'}
                                              bg={isSelected ? 'blue.50' : 'white'}
                                              onClick={() => handleFilterValueChange(filter.id, option)}
                                              cursor="pointer"
                                              _hover={{ bg: 'gray.50' }}
                                            >
                                              <Flex align="center">
                                                <Box 
                                                  w="16px" 
                                                  h="16px" 
                                                  borderRadius="full" 
                                                  bg={colorValue} 
                                                  mr={2}
                                                />
                                                <Text fontSize="sm">{option}</Text>
                                                {isSelected && (
                                                  <Box ml="auto" color="blue.500">✓</Box>
                                                )}
                                              </Flex>
                                            </Box>
                                          );
                                        })}
                                      </SimpleGrid>
                                    )}
                                    
                                    {filter.type === 'size' && (
                                      <Select
                                        value={editedService.filterValues[filter.id] || ''}
                                        onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
                                      >
                                        <option value="">Select {filter.name}</option>
                                        {filter.options.map(option => (
                                          <option key={option} value={option}>{option}</option>
                                        ))}
                                      </Select>
                                    )}
                                    
                                    {(filter.type === 'feature' || filter.type === 'material') && (
                                      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                                        {filter.options.map(option => {
                                          const isSelected = Array.isArray(editedService.filterValues[filter.id]) && 
                                            editedService.filterValues[filter.id]?.includes(option);
                                          
                                          return (
                                            <Checkbox 
                                              key={option}
                                              isChecked={isSelected}
                                              onChange={(e) => {
                                                const currentValues = Array.isArray(editedService.filterValues[filter.id]) 
                                                  ? [...editedService.filterValues[filter.id]] 
                                                  : [];
                                                
                                                const newValues = e.target.checked
                                                  ? [...currentValues, option]
                                                  : currentValues.filter(v => v !== option);
                                                
                                                handleFilterValueChange(filter.id, newValues);
                                              }}
                                            >
                                              {option}
                                            </Checkbox>
                                          );
                                        })}
                                      </SimpleGrid>
                                    )}
                                    
                                    {filter.type === 'text' && (
                                      <Input
                                        value={editedService.filterValues[filter.id] || ''}
                                        onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
                                        placeholder={`Enter ${filter.name.toLowerCase()}`}
                                      />
                                    )}
                                  </FormControl>
                                ))}
                                
                                {/* Custom filter values that don't match any category filter */}
                                {editedService.filterValues && Object.entries(editedService.filterValues)
                                  .filter(([key]) => !categoryFilters.some(f => f.id === key))
                                  .map(([key, value]) => (
                                    <FormControl key={key}>
                                      <FormLabel>{formatFilterKey(key)}</FormLabel>
                                      {Array.isArray(value) ? (
                                        <Input
                                          value={value.join(', ')}
                                          onChange={(e) => handleFilterValueChange(key, e.target.value.split(', '))}
                                          placeholder={`Enter values separated by commas`}
                                        />
                                      ) : (
                                        <Input
                                          value={String(value)}
                                          onChange={(e) => handleFilterValueChange(key, e.target.value)}
                                          placeholder={`Enter ${key}`}
                                        />
                                      )}
                                    </FormControl>
                                  ))
                                }
                                
                                <Button 
                                  colorScheme="blue" 
                                  mt={4} 
                                  onClick={handleSaveFilters}
                                  isLoading={isSaving}
                                  loadingText="Saving"
                                >
                                  Save Specifications
                                </Button>
                              </>
                            ) : (
                              <Alert status="info">
                                <AlertIcon />
                                <Box>
                                  <Text fontWeight="bold">No filter options defined</Text>
                                  <Text>This category does not have any specification options defined.</Text>
                                </Box>
                              </Alert>
                            )}
                          </>
                        )}
                      </VStack>
                    ) : (
                      <VStack spacing={6} align="stretch">
                        {isFetchingFilters ? (
                          <Flex justify="center" py={4}>
                            <Spinner size="md" />
                            <Text ml={2}>Loading specifications...</Text>
                          </Flex>
                        ) : (
                          <>
                            {selectedService.colors && selectedService.colors.length > 0 && (
                              <Box mb={6}>
                                <Heading size="sm" mb={2}>Available Colors</Heading>
                                <HStack flexWrap="wrap">
                                  {selectedService.colors.map(color => (
                                    <Badge key={color} colorScheme={color.toLowerCase()} m={1}>{color}</Badge>
                                  ))}
                                </HStack>
                              </Box>
                            )}
                            
                            {categoryFilters.length > 0 && (
                              <Box>
                                <Heading size="sm" mb={2}>Category Specifications</Heading>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                  {categoryFilters.map(filter => {
                                    const value = selectedService.filterValues?.[filter.id];
                                    if (!value) return null;
                                    
                                    return (
                                      <Box key={filter.id} p={3} borderWidth="1px" borderRadius="md">
                                        <Text fontWeight="bold">{filter.name}:</Text>
                                        <Text>
                                          {Array.isArray(value) 
                                            ? value.join(', ') 
                                            : String(value)}
                                        </Text>
                                      </Box>
                                    );
                                  })}
                                </SimpleGrid>
                              </Box>
                            )}
                            
                            {selectedService.filterValues && Object.keys(selectedService.filterValues).length > 0 ? (
                              <Box mt={4}>
                                <Heading size="sm" mb={2}>All Specifications</Heading>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                  {Object.entries(selectedService.filterValues).map(([key, value]) => (
                                    <Box key={key} p={3} borderWidth="1px" borderRadius="md">
                                      <Text fontWeight="bold">{formatFilterKey(key)}:</Text>
                                      <Text>
                                        {Array.isArray(value) 
                                          ? value.join(', ') 
                                          : String(value)}
                                      </Text>
                                    </Box>
                                  ))}
                                </SimpleGrid>
                              </Box>
                            ) : (
                              <Box>
                                <Alert status="info">
                                  <AlertIcon />
                                  <Box>
                                    <Text fontWeight="bold">No specifications found</Text>
                                    <Text>This service doesn't have any specifications or they couldn't be parsed from metadata.</Text>
                                  </Box>
                                </Alert>
                                
                                {selectedService.metadata && (
                                  <Box mt={4}>
                                    <Heading size="sm" mb={2}>Raw Metadata (Debug)</Heading>
                                    <Box 
                                      p={3} 
                                      bg="gray.50" 
                                      borderRadius="md" 
                                      fontSize="sm" 
                                      fontFamily="monospace"
                                      whiteSpace="pre-wrap"
                                      overflowX="auto"
                                    >
                                      {typeof selectedService.metadata === 'string' 
                                        ? selectedService.metadata 
                                        : JSON.stringify(selectedService.metadata, null, 2)}
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            )}
                          </>
                        )}
                      </VStack>
                    )}
                  </TabPanel>
                  
                  <TabPanel>
                    {isEditing && editedService ? (
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Available Days</FormLabel>
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <Box key={day} p={2} borderWidth="1px" borderRadius="md">
                                <Checkbox
                                  isChecked={editedService.availableDays.includes(day)}
                                  onChange={(e) => {
                                    const days = e.target.checked
                                      ? [...editedService.availableDays, day]
                                      : editedService.availableDays.filter(d => d !== day);
                                    setEditedService({...editedService, availableDays: days});
                                  }}
                                >
                                  {day}
                                </Checkbox>
                              </Box>
                            ))}
                          </SimpleGrid>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Hours</FormLabel>
                          <HStack>
                            <Input
                              type="time"
                              name="availableHoursStart"
                              value={editedService.availableHoursStart || ''}
                              onChange={handleInputChange}
                            />
                            <Text>to</Text>
                            <Input
                              type="time"
                              name="availableHoursEnd"
                              value={editedService.availableHoursEnd || ''}
                              onChange={handleInputChange}
                            />
                          </HStack>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Rental Duration (hours)</FormLabel>
                          <HStack>
                            <NumberInput
                              min={1}
                              max={24}
                              value={editedService.minRentalHours || 1}
                              onChange={(value) => setEditedService({
                                ...editedService, 
                                minRentalHours: parseInt(value) || 1
                              })}
                            >
                              <NumberInputField name="minRentalHours" />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                            <Text>to</Text>
                            <NumberInput
                              min={1}
                              max={24}
                              value={editedService.maxRentalHours || 8}
                              onChange={(value) => setEditedService({
                                ...editedService, 
                                maxRentalHours: parseInt(value) || 8
                              })}
                            >
                              <NumberInputField name="maxRentalHours" />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </HStack>
                        </FormControl>
                      </VStack>
                    ) : (
                      <Box>
                        <Heading size="sm" mb={2}>Availability</Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Box>
                            <Text fontWeight="bold">Available Days:</Text>
                            <HStack flexWrap="wrap">
                              {selectedService.availableDays && selectedService.availableDays.length > 0 
                                ? selectedService.availableDays.map(day => (
                                    <Badge key={day} colorScheme="green" m={1}>{day}</Badge>
                                  ))
                                : <Text>No days specified</Text>
                              }
                            </HStack>
                          </Box>
                          <Box>
                            <Text fontWeight="bold">Hours:</Text>
                            <Text>
                              {selectedService.availableHoursStart && selectedService.availableHoursEnd 
                                ? `${selectedService.availableHoursStart} - ${selectedService.availableHoursEnd}` 
                                : 'Not specified'}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold">Rental Duration:</Text>
                            <Text>
                              {selectedService.minRentalHours || selectedService.maxRentalHours 
                                ? `${selectedService.minRentalHours || 'Not set'} - ${selectedService.maxRentalHours || 'Not set'} hours` 
                                : 'Not specified'}
                            </Text>
                          </Box>
                        </SimpleGrid>
                      </Box>
                    )}
                  </TabPanel>
                  
                  <TabPanel>
                    {selectedService.photos && selectedService.photos.length > 0 ? (
                      <Box>
                        <Heading size="sm" mb={2}>Photos</Heading>
                        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                          {selectedService.photos.map((photo, index) => (
                            <Image 
                              key={index}
                              src={photo}
                              alt={`${selectedService.name} - Photo ${index + 1}`}
                              borderRadius="md"
                              height="150px"
                              objectFit="cover"
                            />
                          ))}
                        </SimpleGrid>
                      </Box>
                    ) : (
                      <Text>No images available</Text>
                    )}
                    
                    {/* Add image upload functionality here if needed */}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={4}>
              {isEditing ? (
                <>
                  <Button
                    colorScheme="blue"
                    onClick={handleSaveChanges}
                    isLoading={isSaving}
                    loadingText="Saving"
                  >
                    Save Changes
                  </Button>
                  <Button onClick={handleCancelEdit}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button
                    colorScheme="green"
                    onClick={() => {
                      onDetailsModalClose();
                      if (selectedService) handleApprove(selectedService.id);
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => {
                      onDetailsModalClose();
                      if (selectedService) openRejectModal(selectedService);
                    }}
                  >
                    Reject
                  </Button>
                  <Button onClick={onDetailsModalClose}>Close</Button>
                </>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 