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
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';

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

export default function CreateServicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    cityId: '',
    availableDays: [] as string[],
    availableHoursStart: '09:00',
    availableHoursEnd: '17:00',
    minRentalHours: 1,
    maxRentalHours: 8,
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
    const fetchCategoriesAndCities = async () => {
      try {
        setIsLoading(true);
        
        // Check authentication status from the useSession hook result
        if (status === 'unauthenticated') {
          router.push('/auth/signin');
          return;
        }
        
        if (session?.user?.role !== 'PROVIDER') {
          router.push('/');
          return;
        }
        
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
        
        // If there's at least one city, set it as default
        if (citiesData.data && citiesData.data.length > 0) {
          setFormData(prev => ({ ...prev, cityId: citiesData.data[0].id }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to load required data');
        toast({
          title: 'Error',
          description: 'Failed to load required data. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategoriesAndCities();
  }, [toast, router, session, status]);
  
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
    } else if (parseFloat(formData.price) <= 0) {
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
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImageError(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please check all required fields and fix any errors',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Validate that the selected city and category exist in the current lists
    const cityExists = cities.some(city => city.id === formData.cityId);
    const categoryExists = categories.some(category => category.id === formData.categoryId);
    
    if (!cityExists) {
      toast({
        title: 'Error',
        description: 'Selected city is not valid. Please select a city from the list.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setErrors(prev => ({ ...prev, cityId: 'Invalid selection' }));
      return;
    }
    
    if (!categoryExists) {
      toast({
        title: 'Error',
        description: 'Selected category is not valid. Please select a category from the list.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setErrors(prev => ({ ...prev, categoryId: 'Invalid selection' }));
      return;
    }
    
    // Prepare the request data
    const requestData = {
      ...formData,
      price: parseFloat(formData.price),
      photos: uploadedImages,
    };
    
    setIsSubmitting(true);
    
    try {
      // Get the selected city object for more detailed logging
      const selectedCity = cities.find(c => c.id === requestData.cityId);
      
      console.log('Submitting service data:', {
        ...requestData,
        photos: requestData.photos ? `${requestData.photos.length} images` : 'none',
        cityId: requestData.cityId,
        cityDetails: selectedCity ? {
          id: selectedCity.id,
          name: selectedCity.name,
          slug: selectedCity.slug,
        } : 'City not found in options',
        categoryName: categories.find(c => c.id === requestData.categoryId)?.name || 'Unknown'
      });
      
      // Submit the service data
      const response = await fetch('/api/services/my', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response:', jsonError);
        throw new Error('Failed to parse server response');
      }
      
      // Check for success or display error
      if (!response.ok || !data.success) {
        console.error('Service creation failed:', data);
        let errorMessage = data.error?.message || 'Failed to create service';
        
        if (data.error?.code === 'VALIDATION_ERROR') {
          // Handle validation errors
          if (errorMessage.includes('city')) {
            setErrors(prev => ({ ...prev, cityId: 'Invalid city' }));
          }
          if (errorMessage.includes('category')) {
            setErrors(prev => ({ ...prev, categoryId: 'Invalid category' }));
          }
        }
        
        if (data.error?.code === 'DB_ERROR' && errorMessage.includes('Invalid `prisma.service.create()` invocation')) {
          console.error('Prisma error details:', errorMessage);
          errorMessage = 'Database error: There may be an issue with the service status. Please try again or contact support.';
        }
        
        throw new Error(errorMessage);
      }
      
      // Success!
      toast({
        title: 'Success',
        description: 'Service created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      router.push('/provider/services');
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create service',
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
        <Heading as="h1" size="xl">Create New Service</Heading>
        
        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Service Name</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter service name"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.categoryId}>
              <FormLabel>Category</FormLabel>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                placeholder="Select category"
              >
                {categories.map(category => (
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
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.cityId}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.price}>
              <FormLabel>Price (USD)</FormLabel>
              <NumberInput
                min={0}
                precision={2}
                value={formData.price}
                onChange={handlePriceChange}
              >
                <NumberInputField name="price" placeholder="Enter price" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.price}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your service in detail"
                minH="150px"
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
            
            <FormControl isInvalid={!!imageError}>
              <FormLabel>Service Images</FormLabel>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />
              
              {uploadedImages.length > 0 && (
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mb={4}>
                  {uploadedImages.map((image, index) => (
                    <Box key={index} position="relative">
                      <Image
                        src={image}
                        alt={`Service image ${index + 1}`}
                        borderRadius="md"
                        h="120px"
                        w="100%"
                        objectFit="cover"
                      />
                      <IconButton
                        aria-label="Remove image"
                        icon={<CloseIcon />}
                        size="xs"
                        position="absolute"
                        top={1}
                        right={1}
                        borderRadius="full"
                        colorScheme="red"
                        onClick={() => removeImage(index)}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              )}
              
              {imageError && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  {imageError}
                </Alert>
              )}
              
              <Button
                leftIcon={<AddIcon />}
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                loadingText="Uploading..."
                isDisabled={uploadedImages.length >= 5}
                width="full"
                mb={2}
              >
                {uploadedImages.length === 0 ? 'Add Images' : 'Add More Images'}
              </Button>
              
              <Text fontSize="sm" color="gray.500">
                Upload up to 5 images (max 5MB each). Images help clients understand your service better.
              </Text>
              <FormErrorMessage>{imageError}</FormErrorMessage>
            </FormControl>
            
            <Box pt={4}>
              <Text fontSize="sm" color="gray.600" mb={4}>
                Note: Your service will be reviewed by our team before it becomes visible to clients.
              </Text>
              
              <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                  flexGrow={1}
                isLoading={isSubmitting}
                loadingText="Creating..."
              >
                Create Service
              </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/provider/services')}
                >
                  Back to Services
                </Button>
              </Flex>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
} 