'use client'

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  useToast,
  Spinner,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Card,
  CardBody,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';

export default function EditPartyPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [partyDetails, setPartyDetails] = useState({
    name: '',
    cityId: '',
    cityName: '',
    date: '',
    startTime: '',
    duration: 3,
    guestCount: 20,
    description: '',
  });
  
  const [cities, setCities] = useState([]);
  const [isCitiesLoading, setIsCitiesLoading] = useState(true);
  const [partyServices, setPartyServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  
  // Get party ID from query params
  const partyId = searchParams.get('id');
  
  // Fetch party data
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !partyId) return;
    
    const fetchPartyData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch party details
        const response = await fetch(`/api/parties/${partyId}`);
        const data = await response.json();
        
        if (data.success) {
          const party = data.data;
          
          // Format date for input field (YYYY-MM-DD)
          const formattedDate = party.date ? new Date(party.date).toISOString().split('T')[0] : '';
          
          setPartyDetails({
            name: party.name || '',
            cityId: party.cityId || '',
            cityName: party.city?.name || '',
            date: formattedDate,
            startTime: party.startTime || '',
            duration: party.duration || 3,
            guestCount: party.guestCount || 20,
            description: party.description || '',
          });
          
          // Add more detailed logging
          console.log('API Response Party Data:', party);
          console.log('Party services array:', party.partyServices);
          
          if (party.partyServices && party.partyServices.length > 0) {
            console.log(`Found ${party.partyServices.length} services for this party`);
            console.log('First party service:', party.partyServices[0]);
            console.log('Service details of first party service:', party.partyServices[0]?.service);
            
            // Validate that services have all required data
            const validServices = party.partyServices.filter(ps => ps.service && ps.service.name);
            const invalidServices = party.partyServices.filter(ps => !ps.service || !ps.service.name);
            
            if (invalidServices.length > 0) {
              console.warn(`Found ${invalidServices.length} invalid services with missing data:`, invalidServices);
            }
            
            console.log(`Setting ${validServices.length} valid party services`);
            setPartyServices(validServices);
          } else {
            console.log('No party services found for this party');
            setPartyServices([]);
          }
        } else {
          throw new Error(data.error?.message || 'Failed to fetch party details');
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
        
        // Redirect to dashboard on error
        router.push('/client/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPartyData();
  }, [partyId, sessionStatus, router, toast]);
  
  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsCitiesLoading(true);
        const response = await fetch('/api/cities');
        
        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setCities(data.data);
        } else {
          setCities([]);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        toast({
          title: 'Error',
          description: 'Failed to load cities. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsCitiesLoading(false);
      }
    };
    
    fetchCities();
  }, [toast]);
  
  // Fetch service categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load service categories',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    
    fetchCategories();
  }, [toast]);
  
  // Fetch services by category
  const fetchServicesByCategory = async (categoryId) => {
    if (!categoryId) return;
    
    try {
      setIsLoadingServices(true);
      const response = await fetch(`/api/services/client?categoryId=${categoryId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log('Services loaded successfully:', data.data.length, 'services found');
        setAvailableServices(data.data);
      } else {
        console.log('No services found or invalid response format');
        setAvailableServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load services',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingServices(false);
    }
  };
  
  // Handle category change
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategoryId(categoryId);
    setSelectedServiceId('');
    fetchServicesByCategory(categoryId);
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPartyDetails(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle number input changes
  const handleGuestCount = (value) => {
    setPartyDetails(prev => ({ ...prev, guestCount: parseInt(value) }));
  };
  
  const handleDuration = (value) => {
    setPartyDetails(prev => ({ ...prev, duration: parseInt(value) }));
  };
  
  // Handle service selection
  const handleServiceChange = (e) => {
    setSelectedServiceId(e.target.value);
  };
  
  // Add service to party
  const handleAddService = async () => {
    if (!selectedServiceId) {
      toast({
        title: 'Select a service',
        description: 'Please select a service to add',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    console.log('Adding service with ID:', selectedServiceId);
    
    try {
      setIsAddingService(true);
      
      const requestBody = {
        serviceId: selectedServiceId,
        specificOptions: {},
      };
      
      console.log('Request body:', requestBody);
      console.log('Request URL:', `/api/parties/${partyId}/services`);
      
      const response = await fetch(`/api/parties/${partyId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to add service');
      }
      
      // Update the party services list
      setPartyServices(prev => [...prev, data.data]);
      
      toast({
        title: 'Service added',
        description: 'Service has been added to your party',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset selected service
      setSelectedServiceId('');
      onClose();
    } catch (error) {
      console.error('Error adding service:', error);
      toast({
        title: 'Error adding service',
        description: error.message || 'Failed to add service. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAddingService(false);
    }
  };
  
  // Remove service from party
  const handleRemoveService = async (partyService) => {
    console.log('Removing service:', partyService);
    try {
      const response = await fetch(`/api/parties/${partyId}/services/${partyService.serviceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to remove service');
      }
      
      // Update the party services list
      setPartyServices(prev => prev.filter(service => service.id !== partyService.id));
      
      toast({
        title: 'Service removed',
        description: 'Service has been removed from your party',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing service:', error);
      toast({
        title: 'Error removing service',
        description: error.message || 'Failed to remove service. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!partyDetails.cityId) {
        toast({
          title: 'Location required',
          description: 'Please select a city for your party',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsSaving(false);
        return;
      }
      
      if (!partyDetails.name) {
        toast({
          title: 'Party name required',
          description: 'Please enter a name for your party',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsSaving(false);
        return;
      }
      
      if (!partyDetails.date || !partyDetails.startTime) {
        toast({
          title: 'Date and time required',
          description: 'Please select a date and time for your event',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsSaving(false);
        return;
      }
      
      // Prepare update data
      const updateData = {
        name: partyDetails.name,
        cityId: partyDetails.cityId,
        date: partyDetails.date,
        startTime: partyDetails.startTime,
        duration: partyDetails.duration || 3,
        guestCount: partyDetails.guestCount || 20,
        description: partyDetails.description || '',
      };
      
      console.log('Updating party data:', updateData);
      
      // Send update request
      const response = await fetch(`/api/parties/${partyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update party');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Party updated successfully',
        description: 'Your party details have been updated',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      router.push(`/client/my-party?id=${partyId}`);
    } catch (error) {
      console.error('Error updating party:', error);
      toast({
        title: 'Error updating party',
        description: error.message || 'Failed to update party. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle cancellation
  const handleCancel = () => {
    router.push(`/client/my-party?id=${partyId}`);
  };
  
  // Format service status for display
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'yellow';
      case 'CONFIRMED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };
  
  // Add console log to inspect the selected service ID
  useEffect(() => {
    if (selectedServiceId) {
      console.log('Currently selected service ID:', selectedServiceId);
      const service = availableServices.find(s => s.id === selectedServiceId);
      console.log('Selected service details:', service);
    }
  }, [selectedServiceId, availableServices]);
  
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <Container maxW="container.md" py={8}>
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
  
  return (
    <>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl">Edit Booking</Heading>
            <Text color="gray.600" mt={2}>
              Update your booking information
            </Text>
          </Box>
          
          <Tabs variant="enclosed" colorScheme="brand">
            <TabList>
              <Tab>Basic Details</Tab>
              <Tab>Services</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel px={0}>
                <Box as="form" onSubmit={handleSubmit}>
                  <VStack spacing={8} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl isRequired>
                        <FormLabel>Party Name</FormLabel>
                        <Input 
                          name="name" 
                          value={partyDetails.name} 
                          onChange={handleChange} 
                          placeholder="e.g., Birthday Party" 
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Location (City)</FormLabel>
                        <Select 
                          name="cityId" 
                          value={partyDetails.cityId} 
                          onChange={handleChange}
                          placeholder="Select a city"
                          isDisabled={isCitiesLoading}
                        >
                          {cities.map(city => (
                            <option key={city.id} value={city.id}>
                              {city.name}, {city.state}
                            </option>
                          ))}
                        </Select>
                        {isCitiesLoading && (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Loading cities...
                          </Text>
                        )}
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Event Date</FormLabel>
                        <Input 
                          type="date" 
                          name="date" 
                          value={partyDetails.date} 
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Event Time</FormLabel>
                        <Input 
                          type="time" 
                          name="startTime" 
                          value={partyDetails.startTime} 
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Number of Guests</FormLabel>
                        <NumberInput 
                          value={partyDetails.guestCount} 
                          onChange={handleGuestCount}
                          min={1}
                          max={1000}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Duration (hours)</FormLabel>
                        <NumberInput 
                          value={partyDetails.duration} 
                          onChange={handleDuration}
                          min={1}
                          max={12}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                    
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea 
                        name="description" 
                        value={partyDetails.description} 
                        onChange={handleChange}
                        placeholder="Tell us about your party..."
                        rows={4}
                      />
                    </FormControl>
                    
                    <Flex justify="space-between" mt={8}>
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button 
                        colorScheme="brand" 
                        type="submit"
                        isLoading={isSaving}
                        loadingText="Saving"
                      >
                        Save Changes
                      </Button>
                    </Flex>
                  </VStack>
                </Box>
              </TabPanel>
              
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Party Services</Heading>
                    <Button 
                      leftIcon={<AddIcon />} 
                      colorScheme="brand" 
                      size="sm"
                      onClick={onOpen}
                    >
                      Add Service
                    </Button>
                  </Flex>
                  
                  {partyServices.length === 0 ? (
                    <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
                      <Text color="gray.500">No services found to display. Try adding some services.</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                      {console.log('Rendering partyServices array:', partyServices)}
                      {partyServices.map((partyService) => {
                        console.log('Rendering party service object:', partyService);
                        console.log('Service within partyService:', partyService.service);
                        console.log('Service name:', partyService.service?.name);
                        console.log('Service category:', partyService.service?.category?.name);
                        
                        if (!partyService.service) {
                          // Render placeholder for invalid service
                          return (
                            <Card key={partyService.id} variant="outline" bg="red.50">
                              <CardBody>
                                <Flex justify="space-between" align="center">
                                  <VStack align="start" spacing={1}>
                                    <Heading size="sm">Invalid Service</Heading>
                                    <Text fontSize="sm" color="red.600">
                                      This service has incomplete data and may need to be removed
                                    </Text>
                                    <Badge colorScheme="red">ERROR</Badge>
                                  </VStack>
                                  <IconButton
                                    aria-label="Remove service"
                                    icon={<DeleteIcon />}
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => {
                                      console.log('Clicked remove for invalid service:', partyService);
                                      handleRemoveService(partyService);
                                    }}
                                  />
                                </Flex>
                              </CardBody>
                            </Card>
                          );
                        }
                        
                        return (
                          <Card key={partyService.id} variant="outline">
                            <CardBody>
                              <Flex justify="space-between" align="center">
                                <VStack align="start" spacing={1}>
                                  <Heading size="sm">{partyService.service?.name || 'Unknown Service'}</Heading>
                                  <Text fontSize="sm" color="gray.600">
                                    {partyService.service?.category?.name || 'Unknown Category'}
                                  </Text>
                                  <Badge colorScheme={getStatusColor(partyService.status || 'PENDING')}>
                                    {partyService.status || 'PENDING'}
                                  </Badge>
                                </VStack>
                                <IconButton
                                  aria-label="Remove service"
                                  icon={<DeleteIcon />}
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => {
                                    console.log('Clicked remove for service:', partyService);
                                    handleRemoveService(partyService);
                                  }}
                                  isDisabled={partyService.status !== 'PENDING' && partyService.status !== 'DRAFT'}
                                />
                              </Flex>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </SimpleGrid>
                  )}
                  
                  <Divider my={4} />
                  
                  <Flex justify="space-between">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button 
                      colorScheme="brand" 
                      onClick={() => router.push(`/client/my-party?id=${partyId}`)}
                    >
                      Done
                    </Button>
                  </Flex>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
      
      {/* Add Service Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Service to Party</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Service Category</FormLabel>
                <Select 
                  placeholder="Select a category" 
                  value={selectedCategoryId}
                  onChange={handleCategoryChange}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              {selectedCategoryId && (
                <FormControl>
                  <FormLabel>Service</FormLabel>
                  <Select 
                    placeholder="Select a service" 
                    value={selectedServiceId}
                    onChange={handleServiceChange}
                    isDisabled={isLoadingServices || availableServices.length === 0}
                  >
                    {availableServices.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ${service.price}
                      </option>
                    ))}
                  </Select>
                  {isLoadingServices && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Loading services...
                    </Text>
                  )}
                  {!isLoadingServices && availableServices.length === 0 && selectedCategoryId && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      No services available in this category
                    </Text>
                  )}
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handleAddService}
              isLoading={isAddingService}
              loadingText="Adding"
              isDisabled={!selectedServiceId}
            >
              Add Service
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 