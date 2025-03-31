'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
} from '@chakra-ui/react';
import { AddIcon, CloseIcon, ChevronRightIcon } from '@chakra-ui/icons';
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
}

export default function EditServicePage({ params }: { params: { id: string } }) {
  const { id } = params;
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
  
  useEffect(() => {
    const fetchServiceAndData = async () => {
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
        });
        
        // Set uploaded images
        setUploadedImages(service.photos || []);
        
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
    
    if (session?.user?.role === 'PROVIDER') {
      fetchServiceAndData();
    }
  }, [id, session, toast]);
  
  // Redirect if not authenticated or not a provider
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'PROVIDER') {
      router.push('/');
      toast({
        title: 'Access Denied',
        description: 'Only providers can access this page',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [session, status, router, toast]);
  
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
    
    if (!formData.cityId) {
      newErrors.cityId = 'City is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Minimal image processing function - just basic validation
  const processImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Simple validation
      if (!file.type.startsWith('image/')) {
        reject(new Error(`File "${file.name}" is not an image`));
        return;
      }
      
      // Read the file
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          // Return the image data but limit the size if needed
          if (reader.result.length > 500000) {
            console.warn(`Image ${file.name} is large (${Math.round(reader.result.length/1024)}KB), may cause issues`);
          }
          resolve(reader.result);
        } else {
          reject(new Error(`Failed to read file "${file.name}"`));
        }
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
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update service');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Service updated',
        description: 'Your service has been updated successfully',
        status: 'success',
        duration: 5000,
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
              
              <FormControl isRequired isInvalid={!!errors.categoryId}>
                <FormLabel>Category</FormLabel>
                <Select 
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  placeholder="Select category"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.categoryId}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={!!errors.cityId}>
                <FormLabel>City</FormLabel>
                <Select 
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleChange}
                  placeholder="Select city"
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.cityId}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
            
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