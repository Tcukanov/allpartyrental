'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Spinner,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Tag,
  TagLabel,
  TagCloseButton,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilter {
  id: string;
  categoryId: string;
  name: string;
  type: string;
  options: string[];
  isRequired: boolean;
  isTextOnly?: boolean;
  iconUrl?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function CategoryFiltersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [filters, setFilters] = useState<CategoryFilter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterTypes] = useState(['color', 'size', 'material', 'feature', 'text']);
  
  const [formData, setFormData] = useState<{
    id?: string;
    categoryId: string;
    name: string;
    type: string;
    options: string[];
    isRequired: boolean;
    isTextOnly: boolean;
    iconUrl?: string;
  }>({
    categoryId: '',
    name: '',
    type: '',
    options: [],
    isRequired: false,
    isTextOnly: false,
    iconUrl: '',
  });
  
  const [newOption, setNewOption] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait for authentication status to be determined
        if (status === 'loading') {
          return;
        }
        
        // Redirect if not authenticated or not an admin
        if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'ADMIN')) {
          toast({
            title: 'Access Denied',
            description: 'Only administrators can access this page.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          router.push('/');
          return;
        }
        
        // Only fetch data if authenticated and admin
        await fetchData();
      } catch (error) {
        console.error("Authentication check failed:", error);
        toast({
          title: 'Error',
          description: 'Failed to load this page. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push('/');
      }
    };
    
    checkAuth();
  }, [status, session, router, toast]);
  
  useEffect(() => {
    if (selectedCategory) {
      fetchFilters();
    }
  }, [selectedCategory]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const categoriesResponse = await fetch('/api/categories');
      
      if (!categoriesResponse.ok) {
        if (categoriesResponse.status === 401 || categoriesResponse.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'Only administrators can access this page.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          router.push('/');
          return;
        }
        throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
      }
      
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData.data || []);
      
      // Fetch all filters initially
      const filtersResponse = await fetch('/api/admin/category-filters');
      
      if (!filtersResponse.ok) {
        if (filtersResponse.status === 401 || filtersResponse.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'Only administrators can access this page.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          router.push('/');
          return;
        }
        throw new Error(`Failed to fetch filters: ${filtersResponse.status}`);
      }
      
      const filtersData = await filtersResponse.json();
      setFilters(filtersData.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Handle all errors with a generic message
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchFilters = async () => {
    try {
      const filtersResponse = await fetch(`/api/admin/category-filters?categoryId=${selectedCategory}`);
      
      if (!filtersResponse.ok) {
        if (filtersResponse.status === 401 || filtersResponse.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'Only administrators can access this page.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          router.push('/');
          return;
        }
        throw new Error(`Failed to fetch filters: ${filtersResponse.status}`);
      }
      
      const filtersData = await filtersResponse.json();
      setFilters(filtersData.data || []);
      
    } catch (error) {
      console.error('Error fetching filters:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to load filters. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleAddOption = () => {
    if (!newOption.trim()) return;
    
    // Check for duplicates
    if (formData.options.includes(newOption.trim())) {
      toast({
        title: 'Duplicate Option',
        description: 'This option already exists.',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    setFormData({
      ...formData,
      options: [...formData.options, newOption.trim()],
    });
    setNewOption('');
  };
  
  const handleRemoveOption = (option: string) => {
    setFormData({
      ...formData,
      options: formData.options.filter(item => item !== option),
    });
  };
  
  const handleSubmit = async () => {
    // Validation
    if (!formData.categoryId || !formData.name || !formData.type) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Only validate options if not in text-only mode
    if (!formData.isTextOnly && formData.options.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one option or enable "Text-only field" mode.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (isEditing && formData.id) {
        // Update existing filter
        response = await fetch(`/api/admin/category-filters/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            options: formData.isTextOnly ? [] : formData.options,
            isRequired: formData.isRequired,
            isTextOnly: formData.isTextOnly,
            iconUrl: formData.iconUrl
          }),
        });
      } else {
        // Create new filter
        response = await fetch('/api/admin/category-filters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            options: formData.isTextOnly ? [] : formData.options,
          }),
        });
      }
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'Only administrators can access this page.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          router.push('/');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save filter');
      }
      
      toast({
        title: 'Success',
        description: isEditing ? 'Filter updated successfully' : 'Filter created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form and refresh data
      resetForm();
      onClose();
      
      if (selectedCategory) {
        fetchFilters();
      } else {
        fetchData();
      }
      
    } catch (error: any) {
      console.error('Error saving filter:', error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to save filter',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (filter: CategoryFilter) => {
    const isTextOnly = filter.options.length === 0;
    
    setFormData({
      id: filter.id,
      categoryId: filter.categoryId,
      name: filter.name,
      type: filter.type,
      options: [...filter.options],
      isRequired: filter.isRequired,
      isTextOnly: isTextOnly,
      iconUrl: filter.iconUrl || '',
    });
    
    setIsEditing(true);
    onOpen();
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this filter?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/category-filters/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'Only administrators can access this page.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          router.push('/');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete filter');
      }
      
      toast({
        title: 'Success',
        description: 'Filter deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh data
      if (selectedCategory) {
        fetchFilters();
      } else {
        fetchData();
      }
      
    } catch (error: any) {
      console.error('Error deleting filter:', error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete filter',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const resetForm = () => {
    setFormData({
      categoryId: selectedCategory || '',
      name: '',
      type: '',
      options: [],
      isRequired: false,
      isTextOnly: false,
      iconUrl: '',
    });
    setNewOption('');
    setIsEditing(false);
  };
  
  const handleAddNew = () => {
    resetForm();
    // Pre-select the current category if one is selected
    if (selectedCategory) {
      setFormData(prev => ({ ...prev, categoryId: selectedCategory }));
    }
    onOpen();
  };
  
  if (status === 'loading' || isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
          <Spinner size="xl" />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Category Filters Management</Heading>
        
        <Box>
          <FormControl>
            <FormLabel>Filter by Category</FormLabel>
            <Select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              placeholder="All Categories"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading as="h2" size="lg">Filters</Heading>
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="brand"
              onClick={handleAddNew}
            >
              Add New Filter
            </Button>
          </HStack>
          
          {filters.length === 0 ? (
            <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
              <Text fontSize="lg">No filters found.</Text>
              <Text color="gray.600" mt={2}>
                {selectedCategory 
                  ? "This category doesn't have any filters yet." 
                  : "No filters have been created yet."}
              </Text>
              <Button 
                mt={4} 
                colorScheme="brand" 
                onClick={handleAddNew}
              >
                Create Your First Filter
              </Button>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  {!selectedCategory && <Th>Category</Th>}
                  <Th>Type</Th>
                  <Th>Icon</Th>
                  <Th>Options</Th>
                  <Th>Required</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filters.map(filter => (
                  <Tr key={filter.id}>
                    <Td>{filter.name}</Td>
                    {!selectedCategory && (
                      <Td>
                        {filter.category?.name || 'Unknown'}
                      </Td>
                    )}
                    <Td>
                      <Badge colorScheme={
                        filter.type === 'color' ? 'green' :
                        filter.type === 'size' ? 'blue' :
                        filter.type === 'material' ? 'purple' :
                        'gray'
                      }>
                        {filter.type}
                      </Badge>
                    </Td>
                    <Td>
                      {filter.iconUrl ? (
                        <Box maxW="50px">
                          <img src={filter.iconUrl} alt={filter.name} width="24" height="24" />
                        </Box>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>
                      <Flex wrap="wrap" gap={2}>
                        {filter.options.length === 0 ? (
                          <Tag size="sm" colorScheme="cyan" borderRadius="full">
                            <TagLabel>Text input field</TagLabel>
                          </Tag>
                        ) : (
                          <>
                            {filter.options.slice(0, 3).map(option => (
                              <Tag key={option} size="sm" colorScheme="brand" borderRadius="full">
                                <TagLabel>{option}</TagLabel>
                              </Tag>
                            ))}
                            {filter.options.length > 3 && (
                              <Tag size="sm" colorScheme="gray" borderRadius="full">
                                <TagLabel>+{filter.options.length - 3} more</TagLabel>
                              </Tag>
                            )}
                          </>
                        )}
                      </Flex>
                    </Td>
                    <Td>{filter.isRequired ? 'Yes' : 'No'}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit filter"
                          icon={<EditIcon />}
                          size="sm"
                          onClick={() => handleEdit(filter)}
                        />
                        <IconButton
                          aria-label="Delete filter"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(filter.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>
      
      {/* Add/Edit Filter Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Filter' : 'Add New Filter'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  placeholder="Select category"
                  isDisabled={isEditing} // Can't change category when editing
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Filter Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Color, Size, Material"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Filter Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Select filter type"
                >
                  {filterTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Is Required</FormLabel>
                <Checkbox
                  isChecked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                >
                  Vendors must specify this filter when creating services
                </Checkbox>
              </FormControl>
              
              <FormControl>
                <FormLabel>Text-only field</FormLabel>
                <Checkbox
                  isChecked={formData.isTextOnly}
                  onChange={(e) => setFormData({ ...formData, isTextOnly: e.target.checked })}
                >
                  This is a free-text field without predefined options
                </Checkbox>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Enable this for filters where vendors should enter their own text values
                </Text>
              </FormControl>
              
              <FormControl isRequired={!formData.isTextOnly}>
                <FormLabel>Options {formData.isTextOnly && <Text as="span" color="gray.500">(Disabled in text-only mode)</Text>}</FormLabel>
                <HStack>
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Enter an option"
                    isDisabled={formData.isTextOnly}
                  />
                  <Button onClick={handleAddOption} isDisabled={formData.isTextOnly}>Add</Button>
                </HStack>
                
                <Box mt={4} opacity={formData.isTextOnly ? 0.5 : 1}>
                  <Text mb={2} fontSize="sm" color="gray.600">
                    Added options ({formData.options.length}):
                  </Text>
                  <Flex wrap="wrap" gap={2}>
                    {formData.options.map((option, index) => (
                      <Tag key={index} size="md" borderRadius="full" variant="solid" colorScheme="brand">
                        <TagLabel>{option}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveOption(option)} isDisabled={formData.isTextOnly} />
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              </FormControl>
              
              <FormControl mt={4}>
                <FormLabel>Icon URL (SVG)</FormLabel>
                <Input
                  placeholder="https://example.com/icons/icon.svg"
                  value={formData.iconUrl || ''}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Enter a URL to an SVG icon for this filter
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 