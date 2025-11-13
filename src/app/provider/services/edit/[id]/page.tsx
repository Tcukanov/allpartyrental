'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  Select,
  Textarea,
  useToast,
  VStack,
  Spinner,
  Flex,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  IconButton,
  Image,
  SimpleGrid,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Divider,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon, ChevronRightIcon, EditIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number | string;
  categoryId: string;
  cityId: string;
  photos: string[];
  status: string;
  availableDays: string[];
  availableHoursStart: string;
  availableHoursEnd: string;
  minRentalHours: number;
  maxRentalHours: number;
  colors: string[];
  filterValues: Record<string, string | string[]>;
  addons: Array<{
    id?: string;
    title: string;
    description?: string;
    price: number;
    thumbnail?: string | null;
  }>;
  blockedDates: string[];
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use() to unwrap the params promise
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Service>({
    id: '',
    name: '',
    description: '',
    price: '',
    categoryId: '',
    cityId: '',
    photos: [],
    status: 'ACTIVE',
    availableDays: [],
    availableHoursStart: '',
    availableHoursEnd: '',
    minRentalHours: 0,
    maxRentalHours: 0,
    colors: [],
    filterValues: {},
    addons: [],
    blockedDates: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Add state for category filters
  const [categoryFilters, setCategoryFilters] = useState<any[]>([]);
  
  // Add blockedDates state
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [selectedBlockDate, setSelectedBlockDate] = useState<Date | null>(null);
  
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch service data
        const serviceResponse = await fetch(`/api/services/${id}`);
        if (!serviceResponse.ok) {
          throw new Error(`Failed to fetch service: ${serviceResponse.status}`);
        }
        const serviceData = await serviceResponse.json();
        
        if (!serviceData.success || !serviceData.data) {
          throw new Error('Service not found');
        }
        
        const service = serviceData.data;
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data || []);
        
        // Fetch cities
        const citiesResponse = await fetch('/api/cities');
        if (!citiesResponse.ok) {
          throw new Error(`Failed to fetch cities: ${citiesResponse.status}`);
        }
        const citiesData = await citiesResponse.json();
        setCities(citiesData.data || []);
        
        // Set form data from service
        setFormData({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price.toString(),
          categoryId: service.categoryId,
          cityId: service.cityId,
          photos: service.photos || [],
          status: service.status,
          availableDays: service.availableDays || [],
          availableHoursStart: service.availableHoursStart || '',
          availableHoursEnd: service.availableHoursEnd || '',
          minRentalHours: service.minRentalHours || 0,
          maxRentalHours: service.maxRentalHours || 0,
          colors: service.colors || [],
          filterValues: service.filterValues || {},
          addons: service.addons || [],
          blockedDates: service.blockedDates || [],
        });
        
        // Set uploaded images
        setUploadedImages(service.photos || []);
        
        // Fetch category filters for this service's category
        if (service.categoryId) {
          await fetchCategoryFilters(service.categoryId);
        }
        
        // Parse blocked dates
        if (service.blockedDates && Array.isArray(service.blockedDates)) {
          try {
            console.log("Service blocked dates from API:", service.blockedDates);
            const parsed = service.blockedDates.map(dateStr => {
              try {
                return new Date(dateStr);
              } catch (e) {
                console.error("Error parsing date:", dateStr, e);
                return null;
              }
            }).filter(Boolean);
            
            console.log("Parsed blocked dates:", parsed);
            setBlockedDates(parsed);
          } catch (error) {
            console.error("Error processing blocked dates:", error);
            setBlockedDates([]);
          }
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to load required data');
        toast({
          title: 'Error',
          description: 'Failed to load service data. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user?.role === 'PROVIDER' || session?.user?.role === 'ADMIN') {
      fetchServiceDetails();
    }
  }, [id, session, toast]);
  
  // Function to fetch category filters
  const fetchCategoryFilters = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/filters?categoryId=${categoryId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category filters: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCategoryFilters(data.data || []);
        console.log('Fetched category filters:', data.data);
      } else {
        console.error('Failed to fetch category filters:', data.error);
      }
    } catch (error) {
      console.error('Error fetching category filters:', error);
      toast({
        title: 'Warning',
        description: 'Failed to load category filters. Some options may not be available.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Check if user is authenticated and has provider or admin role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'PROVIDER' && session?.user?.role !== 'ADMIN') {
        router.push('/');
        toast({
          title: 'Access Denied',
          description: 'Only service providers and admins can access this page',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [status, session, router, toast]);
  
  // Load categories and cities
  useEffect(() => {
    async function loadCategoriesAndCities() {
      try {
        // Fetch both cities and categories in parallel
        const [cityResponse, categoryResponse] = await Promise.all([
          fetch('/api/cities'),
          fetch('/api/categories')
        ]);

        if (!cityResponse.ok || !categoryResponse.ok) {
          throw new Error('Failed to load data');
        }

        const cityData = await cityResponse.json();
        const categoryData = await categoryResponse.json();

        setCities(cityData.data || []);
        setCategories(categoryData.data || []);
        
        // Removed the formData update that was causing the infinite loop
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load necessary data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }

    // Only run once when the component mounts, not on every formData change
    loadCategoriesAndCities();
  }, [toast]); // Removed formData dependency
  
  if (status === 'loading' || isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  if (loadingError) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl">Edit Service</Heading>
          <Box p={6} bg="red.50" borderRadius="md">
            <Text color="red.600">{loadingError}</Text>
            <Button mt={4} onClick={() => router.push('/provider/services')}>
              Back to Services
            </Button>
          </Box>
        </VStack>
      </Container>
    );
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handlePriceChange = (valueString: string) => {
    setFormData(prev => ({ ...prev, price: valueString }));
    
    // Clear error when field is updated
    if (errors.price) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.price;
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price.toString()) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    // Validate required category filters
    categoryFilters.forEach(filter => {
      if (filter.isRequired) {
        const value = formData.filterValues[filter.id];
        
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          newErrors[`filter_${filter.id}`] = `${filter.name} is required`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Minimal image processing function - just basic validation
  const processImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error(`File "${file.name}" is not an image`));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Calculate new dimensions (max 1920x1920)
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920;
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Start with quality 0.8 and reduce until under 1MB
          let quality = 0.8;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Base64 string is ~1.37x larger than actual file size
          // Target: 1MB = 1,048,576 bytes, so base64 should be ~1,400,000 chars
          const targetSize = 1400000;
          
          while (compressedDataUrl.length > targetSize && quality > 0.1) {
            quality -= 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          const finalSizeKB = Math.round(compressedDataUrl.length / 1024);
          console.log(`Compressed ${file.name}: ${Math.round(file.size/1024)}KB → ${finalSizeKB}KB (quality: ${quality.toFixed(1)})`);
          
          resolve(compressedDataUrl);
        };
        
        img.onerror = () => reject(new Error(`Failed to load image "${file.name}"`));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
      reader.readAsDataURL(file);
    });
  };
  
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Clear previous errors
    setImageError(null);
    
    // Check total number of images (max 5)
    if (uploadedImages.length + files.length > 5) {
      setImageError('You can upload a maximum of 5 images');
      return;
    }
    
    setIsUploading(true);
    
    // Process images one by one
    const newImages: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        try {
          const imageData = await processImage(files[i]);
          newImages.push(imageData);
          console.log(`Processed image ${i+1}/${files.length} successfully`);
        } catch (error) {
          console.error(`Error processing image ${files[i].name}:`, error);
          // Continue with other images
        }
      }
      
      if (newImages.length > 0) {
        setUploadedImages(prev => [...prev, ...newImages]);
        setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newImages] }));
        console.log(`Added ${newImages.length} new images, total now: ${uploadedImages.length + newImages.length}`);
      } else {
        setImageError('Failed to process any of the selected images.');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setImageError('Error uploading images. Please try again.');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsUploading(false);
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
    setFormData(prev => ({ ...prev, photos: newImages }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors and try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format blocked dates properly
      const formattedBlockedDates = blockedDates.map(date => {
        // Ensure date is properly formatted in ISO format with timezone handling
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00:00.000Z`;
      });
      
      console.log("Formatted blocked dates:", formattedBlockedDates);
      
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price.toString()),
          categoryId: formData.categoryId,
          cityId: formData.cityId,
          photos: uploadedImages,
          availableDays: formData.availableDays,
          availableHoursStart: formData.availableHoursStart,
          availableHoursEnd: formData.availableHoursEnd,
          minRentalHours: formData.minRentalHours,
          maxRentalHours: formData.maxRentalHours,
          colors: formData.colors,
          filterValues: formData.filterValues,
          addons: formData.addons,
          blockedDates: formattedBlockedDates,
        }),
      });
      
      // Check if there's an error and get the error details
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error?.message || 'Failed to update service');
      }
      
      const result = await response.json();
      
      // Check if the update requires approval
      const needsApproval = result.data?.status === 'PENDING_APPROVAL';
      
      toast({
        title: needsApproval ? 'Changes Submitted for Review' : 'Service updated',
        description: result.message || (needsApproval 
          ? 'Your changes have been submitted and are pending admin approval.' 
          : 'Your service has been updated successfully'),
        status: needsApproval ? 'info' : 'success',
        duration: 7000,
        isClosable: true,
      });
      
      // Redirect to services page
      router.push('/provider/services');
      
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update service',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add a handler for the availability days checkboxes
  const handleAvailableDaysChange = (day: string) => {
    setFormData(prev => {
      const days = [...prev.availableDays];
      if (days.includes(day)) {
        return { ...prev, availableDays: days.filter(d => d !== day) };
      } else {
        return { ...prev, availableDays: [...days, day] };
      }
    });
  };
  
  // Add a handler for filter values
  const handleFilterChange = (filterId: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      filterValues: {
        ...prev.filterValues,
        [filterId]: value
      }
    }));
    
    // Clear error when field is updated
    if (errors[`filter_${filterId}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`filter_${filterId}`];
        return newErrors;
      });
    }
  };
  
  // Add a handler for colors
  const handleColorsChange = (color: string) => {
    setFormData(prev => {
      const colors = [...prev.colors];
      if (colors.includes(color)) {
        return { ...prev, colors: colors.filter(c => c !== color) };
      } else {
        return { ...prev, colors: [...colors, color] };
      }
    });
  };
  
  // Add handlers for blocked dates
  const handleBlockedDateChange = (date: Date | null) => {
    setSelectedBlockDate(date);
  };

  const addBlockedDate = () => {
    if (!selectedBlockDate) return;
    
    try {
      // Normalize the date to avoid timezone issues
      const normalizedDate = new Date(selectedBlockDate);
      normalizedDate.setHours(0, 0, 0, 0);
      
      // Check if date is already in the blockedDates array
      const exists = blockedDates.some(date => {
        // Compare dates by their date parts only (year, month, day)
        const existingDate = new Date(date);
        existingDate.setHours(0, 0, 0, 0);
        return existingDate.getTime() === normalizedDate.getTime();
      });
      
      if (!exists) {
        setBlockedDates(prev => [...prev, normalizedDate]);
        setSelectedBlockDate(null);
      } else {
        toast({
          title: 'Date already blocked',
          description: 'This date is already in your list of blocked dates.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error adding blocked date:", error);
      toast({
        title: 'Error',
        description: 'Could not add blocked date. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const removeBlockedDate = (index: number) => {
    setBlockedDates(prev => prev.filter((_, i) => i !== index));
  };
  
  // Add a helper function to format dates consistently for display
  const formatDateForDisplay = (date: Date): string => {
    try {
      // Format as a readable date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date for display:", e);
      return "Invalid date";
    }
  };
  
  // Add a separate debug function for blocked dates
  const testBlockedDatesUpdate = async () => {
    if (blockedDates.length === 0) {
      toast({
        title: 'No dates to test',
        description: 'Please add some blocked dates first',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Format dates as strings
      const formattedDates = blockedDates.map(date => {
        try {
          return date.toISOString();
        } catch (e) {
          console.error("Error formatting date:", date, e);
          return null;
        }
      }).filter(Boolean);

      console.log("Testing update with formatted dates:", formattedDates);

      // Try to update just the blocked dates
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockedDates: formattedDates
        }),
      });

      const data = await response.json();
      console.log("Test update response:", data);

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update blocked dates');
      }

      toast({
        title: 'Test successful',
        description: 'Blocked dates updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error("Test update error:", error);
      toast({
        title: 'Test failed',
        description: error instanceof Error ? error.message : 'Failed to update blocked dates',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Breadcrumb separator={<ChevronRightIcon color="gray.500" />} mb={4}>
            <BreadcrumbItem>
              <BreadcrumbLink as={NextLink} href="/provider/services">
                My Services
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Edit Service</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          
          <Heading as="h1" size="xl">Edit Service</Heading>
          <Text color="gray.600" mt={2}>
            Update your service listing information
          </Text>
        </Box>

        {formData.status === 'ACTIVE' && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Approval Required for Changes</Text>
              <Text fontSize="sm">
                When you update an active service listing, your changes will be submitted for admin review 
                before going live. This ensures quality and accuracy for all listings on the platform.
              </Text>
            </Box>
          </Alert>
        )}

        {formData.status === 'PENDING_APPROVAL' && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Pending Admin Approval</Text>
              <Text fontSize="sm">
                This service is currently pending admin approval. You can continue to make edits, 
                but the service will remain under review until approved by an administrator.
              </Text>
            </Box>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Service Name</FormLabel>
              <Input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter a descriptive name for your service"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your service in detail"
                size="md"
                rows={6}
              />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
            </FormControl>
            
            {/* Availability Days */}
            <FormControl>
              <FormLabel>Availability Days</FormLabel>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <Box key={day} borderWidth="1px" borderRadius="md" p={3}>
                    <Flex align="center">
                      <input 
                        type="checkbox" 
                        style={{ marginRight: '12px' }}
                        checked={formData.availableDays.includes(day)}
                        onChange={() => handleAvailableDaysChange(day)}
                      />
                      <Text>{day}</Text>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            </FormControl>
            
            {/* Availability Hours */}
            <FormControl>
              <FormLabel>Availability Hours</FormLabel>
              <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                <Box flex="1">
                  <FormLabel fontSize="sm">Start Time</FormLabel>
                  <Input
                    type="time"
                    name="availableHoursStart"
                    value={formData.availableHoursStart}
                    onChange={handleChange}
                  />
                </Box>
                <Box flex="1">
                  <FormLabel fontSize="sm">End Time</FormLabel>
                  <Input
                    type="time"
                    name="availableHoursEnd"
                    value={formData.availableHoursEnd}
                    onChange={handleChange}
                  />
                </Box>
              </Flex>
            </FormControl>
            
            {/* Rental Hours */}
            <FormControl>
              <FormLabel>Rental Duration (hours)</FormLabel>
              <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                <Box flex="1">
                  <FormLabel fontSize="sm">Minimum Hours</FormLabel>
                  <NumberInput
                    min={1}
                    max={24}
                    value={formData.minRentalHours}
                    onChange={(valueString) => setFormData(prev => ({ ...prev, minRentalHours: parseInt(valueString) || 1 }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>
                <Box flex="1">
                  <FormLabel fontSize="sm">Maximum Hours</FormLabel>
                  <NumberInput
                    min={1}
                    max={24}
                    value={formData.maxRentalHours}
                    onChange={(valueString) => setFormData(prev => ({ ...prev, maxRentalHours: parseInt(valueString) || 1 }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={2}>
                Set the minimum and maximum rental duration for your service.
              </Text>
            </FormControl>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl isRequired isInvalid={!!errors.price}>
                <FormLabel>Price ($)</FormLabel>
                <NumberInput 
                  min={0} 
                  precision={2} 
                  value={formData.price.toString()}
                  onChange={handlePriceChange}
                >
                  <NumberInputField 
                    placeholder="0.00"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.price}</FormErrorMessage>
              </FormControl>
              
              {/* Category Field - Hidden since we now just have "Soft play" */}
              <input 
                type="hidden"
                name="categoryId"
                value={formData.categoryId}
              />
            </SimpleGrid>
            
            {/* Dynamic Category Filters */}
            {categoryFilters.length > 0 && (
              <Box mt={6}>
                <Heading as="h3" size="md" mb={4}>
                  Additional Details
                </Heading>
                <VStack spacing={4} align="stretch">
                  {categoryFilters.map(filter => (
                    <FormControl 
                      key={filter.id} 
                      isRequired={filter.isRequired}
                      isInvalid={!!errors[`filter_${filter.id}`]}
                    >
                      <FormLabel>
                        {filter.name}
                        {filter.iconUrl && (
                          <Image
                            src={filter.iconUrl}
                            alt={filter.name}
                            boxSize="16px"
                            display="inline-block"
                            ml={2}
                            verticalAlign="middle"
                          />
                        )}
                      </FormLabel>
                      
                      {/* Render different input types based on filter type */}
                      {filter.options.length === 0 ? (
                        // Text input for text-only filters
                        <Input
                          value={formData.filterValues[filter.id] || ''}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                          placeholder={`Enter ${filter.name.toLowerCase()}`}
                        />
                      ) : filter.type === 'color' ? (
                        // Color selection
                        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
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
                              'Brown': 'orange.800',
                              'Teal': 'teal.500',
                            };
                            
                            const colorValue = colorMap[option] || 'gray.400';
                            const isSelected = formData.filterValues[filter.id] === option ||
                              (Array.isArray(formData.filterValues[filter.id]) && 
                               formData.filterValues[filter.id]?.includes(option));
                            
                            return (
                              <Box
                                key={option}
                                borderWidth="1px"
                                borderRadius="md"
                                p={2}
                                cursor="pointer"
                                bg={isSelected ? 'blue.50' : 'white'}
                                borderColor={isSelected ? 'blue.300' : 'gray.200'}
                                onClick={() => handleFilterChange(filter.id, option)}
                                _hover={{ bg: 'gray.50' }}
                              >
                                <Flex align="center" justify="center">
                                  <Box 
                                    w="12px" 
                                    h="12px" 
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
                      ) : filter.type === 'size' || filter.type === 'material' ? (
                        // Single select dropdown
                        <Select
                          value={formData.filterValues[filter.id] || ''}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                          placeholder={`Select ${filter.name.toLowerCase()}`}
                        >
                          {filter.options.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        // Multi-select checkboxes for features
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                          {filter.options.map(option => {
                            const isSelected = Array.isArray(formData.filterValues[filter.id]) &&
                              formData.filterValues[filter.id]?.includes(option);
                            
                            return (
                              <Box 
                                key={option}
                                borderWidth="1px"
                                borderRadius="md"
                                p={2}
                                bg={isSelected ? 'blue.50' : 'white'}
                                borderColor={isSelected ? 'blue.300' : 'gray.200'}
                              >
                                <Flex align="center">
                                  <input
                                    type="checkbox"
                                    style={{ marginRight: '12px' }}
                                    checked={isSelected}
                                    onChange={() => {
                                      const currentValues = Array.isArray(formData.filterValues[filter.id])
                                        ? [...formData.filterValues[filter.id]]
                                        : [];
                                        
                                      if (isSelected) {
                                        handleFilterChange(
                                          filter.id, 
                                          currentValues.filter(val => val !== option)
                                        );
                                      } else {
                                        handleFilterChange(
                                          filter.id,
                                          [...currentValues, option]
                                        );
                                      }
                                    }}
                                  />
                                  <Text fontSize="sm">{option}</Text>
                                </Flex>
                              </Box>
                            );
                          })}
                        </SimpleGrid>
                      )}
                      
                      <FormErrorMessage>
                        {errors[`filter_${filter.id}`]}
                      </FormErrorMessage>
                    </FormControl>
                  ))}
                </VStack>
              </Box>
            )}
            
            <FormControl>
              <FormLabel>Service Images (Max 5)</FormLabel>
              <HStack>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                  leftIcon={<AddIcon />}
                  isDisabled={uploadedImages.length >= 5}
                >
                  Upload Images
                </Button>
                <Text fontSize="sm" color="gray.500">
                  {uploadedImages.length}/5 images
                </Text>
              </HStack>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              
              {imageError && (
                <Alert status="error" mt={2}>
                  <AlertIcon />
                  {imageError}
                </Alert>
              )}
              
              {uploadedImages.length > 0 && (
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mt={4}>
                  {uploadedImages.map((image, index) => (
                    <Box key={index} position="relative">
                      <Image
                        src={image}
                        alt={`Service image ${index + 1}`}
                        borderRadius="md"
                        objectFit="cover"
                        boxSize="150px"
                      />
                      <IconButton
                        aria-label="Remove image"
                        icon={<CloseIcon />}
                        size="sm"
                        colorScheme="red"
                        position="absolute"
                        top={2}
                        right={2}
                        onClick={() => removeImage(index)}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </FormControl>
            
            {/* Add the Blocked Dates Section */}
            <Box
              mt={8}
              p={6}
              bg="white"
              borderRadius="md"
              boxShadow="md"
              _dark={{ bg: 'gray.700' }}
            >
              <Heading as="h3" size="md" mb={4}>
                Blocked Dates
              </Heading>
              <Text mb={4}>
                Select dates when your service will not be available.
              </Text>
              
              <HStack spacing={4} alignItems="flex-end" mb={6}>
                <FormControl>
                  <FormLabel>Select Date to Block</FormLabel>
                  <Input
                    type="date"
                    value={selectedBlockDate ? selectedBlockDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        handleBlockedDateChange(new Date(val));
                      } else {
                        handleBlockedDateChange(null);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]} // Can't block dates in the past
                  />
                </FormControl>
                
                <Button 
                  colorScheme="blue" 
                  onClick={addBlockedDate}
                  isDisabled={!selectedBlockDate}
                  leftIcon={<AddIcon />}
                >
                  Add Date
                </Button>
                
                <Button 
                  colorScheme="teal" 
                  variant="outline"
                  onClick={testBlockedDatesUpdate}
                  leftIcon={<EditIcon />}
                  isDisabled={blockedDates.length === 0}
                >
                  Test Dates Update
                </Button>
              </HStack>
              
              {blockedDates.length > 0 ? (
                <Box mt={4}>
                  <Text fontWeight="bold" mb={2}>Currently Blocked Dates:</Text>
                  
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {blockedDates.map((date, index) => (
                      <Flex 
                        key={index}
                        justify="space-between"
                        align="center"
                        p={3}
                        bg="gray.50"
                        _dark={{ bg: 'gray.600' }}
                        borderRadius="md"
                      >
                        <Text>{formatDateForDisplay(date)}</Text>
                        <IconButton
                          size="sm"
                          colorScheme="red"
                          aria-label="Remove date"
                          icon={<CloseIcon />}
                          onClick={() => removeBlockedDate(index)}
                        />
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>
              ) : (
                <Text color="gray.500" mt={2}>No blocked dates selected.</Text>
              )}
            </Box>
            
            <HStack spacing={4} pt={4}>
              <Button
                type="submit"
                colorScheme="brand"
                isLoading={isSubmitting}
                loadingText="Updating"
                size="lg"
              >
                Update Service
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/provider/services')}
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
} 