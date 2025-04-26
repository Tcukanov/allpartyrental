'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  IconButton,
  useDisclosure,
  useToast,
  HStack,
  Badge,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  VStack,
  Spinner
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiStar } from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';

const AdminLocationsPage = () => {
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCity, setCurrentCity] = useState(null);
  const toast = useToast();
  
  // Modal state
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    state: ''
  });
  
  // Reference for delete confirmation
  const cancelRef = useRef();
  
  // Load cities on mount
  useEffect(() => {
    fetchCities();
  }, []);
  
  // Fetch cities from API
  const fetchCities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cities');
      const data = await response.json();
      
      if (data.success) {
        setCities(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to fetch cities',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cities. Please try again later.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add new city
  const addCity = async () => {
    try {
      const response = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'City added successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchCities();
        onFormClose();
        resetForm();
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to add city',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error adding city:', error);
      toast({
        title: 'Error',
        description: 'Failed to add city. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Update city
  const updateCity = async (cityData) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/cities/${cityData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cityData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'City updated',
          description: `${cityData.name}, ${cityData.state} has been updated`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh the cities list
        fetchCities();
      } else {
        toast({
          title: 'Error updating city',
          description: result.error?.message || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating city:', error);
      toast({
        title: 'Error updating city',
        description: 'Failed to update city',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      onFormClose();
    }
  };
  
  // Delete city
  const deleteCity = async (cityId) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/cities/${cityId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'City deleted',
          description: 'The city has been removed',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh the cities list
        fetchCities();
      } else {
        toast({
          title: 'Error deleting city',
          description: result.error?.message || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      toast({
        title: 'Error deleting city',
        description: 'Failed to delete city',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      onDeleteClose();
    }
  };
  
  // Set default city
  const handleSetDefaultCity = async (cityId) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/cities/default', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cityId }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Default city updated',
          description: `The default city has been updated`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh the cities list
        fetchCities();
      } else {
        toast({
          title: 'Error updating default city',
          description: result.error?.message || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error setting default city:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default city',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate slug from name if slug is empty
    if (name === 'name' && !formData.slug) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug || !formData.state) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (currentCity) {
      updateCity(formData);
    } else {
      addCity();
    }
  };
  
  // Open add city modal
  const handleAddClick = () => {
    resetForm();
    setCurrentCity(null);
    onFormOpen();
  };
  
  // Open edit city modal
  const handleEditClick = (city) => {
    setCurrentCity(city);
    setFormData({
      name: city.name,
      slug: city.slug,
      state: city.state
    });
    onFormOpen();
  };
  
  // Open delete confirmation
  const handleDeleteClick = (city) => {
    setCurrentCity(city);
    onDeleteOpen();
  };
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      state: ''
    });
  };
  
  // Filter cities by search term
  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Container maxW="container.xl">
      <Box py={4}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Locations</Heading>
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue" 
            onClick={handleAddClick}
          >
            Add City
          </Button>
        </Flex>
        
        <HStack mb={6} spacing={4}>
          <FormControl>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Search cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </FormControl>
        </HStack>
        
        {isLoading ? (
          <Flex justify="center" align="center" py={10}>
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>Loading cities...</Text>
            </VStack>
          </Flex>
        ) : filteredCities.length === 0 ? (
          <Box py={10} textAlign="center">
            <Text>No cities found. {searchTerm && 'Try a different search term or'} Add a new city.</Text>
            <Button 
              leftIcon={<FiPlus />} 
              colorScheme="blue" 
              onClick={handleAddClick}
              mt={4}
            >
              Add City
            </Button>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" width="100%">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>State</Th>
                  <Th>Slug</Th>
                  <Th width="200px" textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredCities.map(city => (
                  <Tr key={city.id}>
                    <Td fontWeight="medium">
                      <Flex align="center">
                        {city.isDefault && (
                          <Box as={FiStar} color="yellow.500" mr={2} />
                        )}
                        {city.name}
                      </Flex>
                    </Td>
                    <Td>{city.state}</Td>
                    <Td>
                      <Badge colorScheme="blue" variant="subtle">{city.slug}</Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2} justify="flex-end">
                        {!city.isDefault && (
                          <IconButton
                            icon={<FiStar />}
                            aria-label="Set as default city"
                            size="sm"
                            colorScheme="yellow"
                            onClick={() => handleSetDefaultCity(city.id)}
                            title="Set as default city"
                          />
                        )}
                        <IconButton
                          icon={<FiEdit />}
                          aria-label="Edit city"
                          size="sm"
                          onClick={() => handleEditClick(city)}
                        />
                        <IconButton
                          icon={<FiTrash2 />}
                          aria-label="Delete city"
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDeleteClick(city)}
                          isDisabled={city.isDefault}
                          title={city.isDefault ? "Cannot delete default city" : "Delete city"}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
      
      {/* City Form Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>{currentCity ? 'Edit City' : 'Add New City'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>City Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter city name"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>State</FormLabel>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state (e.g. CA, NY)"
                    maxLength={2}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Slug</FormLabel>
                  <Input
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="Enter URL slug"
                    helperText="Used in URLs, e.g. 'new-york'"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onFormClose}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue">
                {currentCity ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete City
            </AlertDialogHeader>
            
            <AlertDialogBody>
              Are you sure you want to delete {currentCity?.name}? This action cannot be undone.
              <Text mt={4} color="red.600" fontWeight="bold">
                Warning: This may affect existing services and parties in this location.
              </Text>
            </AlertDialogBody>
            
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={() => deleteCity(currentCity.id)} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default AdminLocationsPage; 