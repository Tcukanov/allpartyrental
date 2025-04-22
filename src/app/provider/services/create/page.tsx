'use client';

import { useState, useRef, ChangeEvent, useEffect, useCallback } from 'react';
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
  Divider,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';

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

// Define the service form data structure
interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  cityId: string;
  availableDays: string[];
  availableHoursStart: string;
  availableHoursEnd: string;
  minRentalHours: number;
  maxRentalHours: number;
  colors: string[];
  filterValues: Record<string, string | string[]>;
  addons: Array<{
    title: string;
    description?: string;
    price: string;
    thumbnail?: string;
  }>;
  weekAvailability: Array<{
    day: string;
    available: boolean;
    hours?: { start: string; end: string };
  }>;
}

export default function CreateServicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize the form data
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    cityId: '',
    availableDays: [],
    availableHoursStart: '09:00',
    availableHoursEnd: '17:00',
    minRentalHours: 1,
    maxRentalHours: 24,
    colors: [],
    filterValues: {},
    addons: [],
    weekAvailability: [
      { day: 'Monday', available: false },
      { day: 'Tuesday', available: false },
      { day: 'Wednesday', available: false },
      { day: 'Thursday', available: false },
      { day: 'Friday', available: false },
      { day: 'Saturday', available: false },
      { day: 'Sunday', available: false },
    ],
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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for the current add-on being edited
  const [currentAddon, setCurrentAddon] = useState({
    title: '',
    description: '',
    price: '',
    thumbnail: ''
  });
  
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
  
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
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

        // Auto-select the Soft play category if available
        if (categoryData.data && categoryData.data.length > 0) {
          const softPlayCategory = categoryData.data.find(cat => cat.name === 'Soft play') || categoryData.data[0];
          
          setFormData(prev => ({
            ...prev,
            categoryId: softPlayCategory.id
          }));
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load necessary data. Please try again later.');
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, []);
  
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
    
    if (formData.colors.length === 0) {
      newErrors.colors = 'At least one color must be selected';
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
    setIsLoading(true);
    setErrors({});

    try {
      // Validate required fields
      const requiredFields = ['name', 'description', 'price', 'categoryId'];
      const newErrors: Record<string, string> = {};
      
      requiredFields.forEach((field) => {
        if (!formData[field as keyof typeof formData]) {
          newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast({
          title: 'Please fill in all required fields',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      // Only include valid filter values (not empty strings or null)
      const validFilterValues = Object.entries(formData.filterValues).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Construct the data to send to the API
      const serviceData = {
        ...formData,
        filterValues: validFilterValues,
        // Format the weekAvailability array to match what the backend expects
        weekAvailability: formData.weekAvailability,
        // Include the add-ons data
        addons: formData.addons.map(addon => ({
          title: addon.title,
          description: addon.description || '',
          price: parseFloat(addon.price),
          thumbnail: addon.thumbnail || null
        }))
      };

      // Submit the data
      const response = await fetch('/api/provider/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
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
      setIsLoading(false);
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
  
  // Add a handler for the colors checkboxes
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
  
  // Handle filter value changes - optimized with useCallback to prevent unnecessary rerenders
  const handleFilterChange = useCallback((filterId: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      filterValues: {
        ...prev.filterValues,
        [filterId]: value
      }
    }));
    
    // Only clear errors if they exist, to avoid unnecessary re-renders
    setErrors(prev => {
      if (!prev[`filter_${filterId}`]) return prev;
      const newErrors = { ...prev };
      delete newErrors[`filter_${filterId}`];
      return newErrors;
    });
  }, []);
  
  // Add a function to handle add-on form input changes
  const handleAddonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentAddon({
      ...currentAddon,
      [name]: value
    });
  };

  // Add a function to handle add-on price input
  const handleAddonPriceChange = (valueString: string) => {
    setCurrentAddon({
      ...currentAddon,
      price: valueString
    });
  };

  // Add a function to add or update an add-on
  const addOrUpdateAddon = () => {
    // Validate the add-on
    if (!currentAddon.title || !currentAddon.price) {
      toast({
        title: 'Missing Information',
        description: 'Add-on title and price are required',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    // Add the new add-on to formData
    setFormData(prev => ({
      ...prev,
      addons: [...prev.addons, { ...currentAddon }]
    }));
    
    // Reset the current add-on
    setCurrentAddon({
      title: '',
      description: '',
      price: '',
      thumbnail: ''
    });
  };

  // Add a function to remove an add-on
  const removeAddon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
  };

  // Add a function to edit an existing add-on
  const editAddon = (index: number) => {
    setCurrentAddon(formData.addons[index]);
    
    // Remove it from the list (will be added back when user saves)
    removeAddon(index);
  };

  // Add a function to handle add-on thumbnail upload
  const handleAddonThumbnailUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const imageData = await processImage(files[0]);
      setCurrentAddon({
        ...currentAddon,
        thumbnail: imageData
      });
    } catch (error) {
      console.error('Error uploading add-on thumbnail:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload add-on thumbnail',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
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
            
            {/* Category Field - Hidden since we now just have "Soft play" */}
            <input 
              type="hidden"
              name="categoryId"
              value={formData.categoryId}
            />
            
            <FormControl isRequired isInvalid={!!errors.cityId}>
              <FormLabel>Borough</FormLabel>
              <Select
                name="cityId"
                value={formData.cityId}
                onChange={handleChange}
                placeholder="Select borough"
              >
                {cities.map((city) => (
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
            
            {/* Colors Selection */}
            <FormControl isRequired isInvalid={!!errors.colors}>
              <FormLabel>Available Colors</FormLabel>
              <Text fontSize="sm" color="gray.600" mb={3}>
                Select all colors available for your soft play equipment
              </Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                {['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'White'].map(color => (
                  <Box 
                    key={color} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    p={3}
                    bg={formData.colors.includes(color) ? `${color.toLowerCase()}.100` : 'white'}
                    borderColor={formData.colors.includes(color) ? `${color.toLowerCase()}.300` : 'gray.200'}
                  >
                    <Flex align="center">
                      <input 
                        type="checkbox" 
                        style={{ marginRight: '12px' }}
                        checked={formData.colors.includes(color)}
                        onChange={() => handleColorsChange(color)}
                      />
                      <Text>{color}</Text>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
              <FormErrorMessage>{errors.colors}</FormErrorMessage>
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
            
            {/* Add-ons Section */}
            <Box mt={8}>
              <Heading as="h3" size="md" mb={4}>
                Optional Add-ons
              </Heading>
              <Divider mb={4} />
              
              <Text fontSize="sm" color="gray.600" mb={4}>
                Add optional items that customers can add to their rental. Each add-on will be shown as an optional extra during checkout.
              </Text>
              
              {/* Current Add-ons List */}
              {formData.addons.length > 0 && (
                <Box mb={6}>
                  <Text fontWeight="medium" mb={2}>Current Add-ons:</Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {formData.addons.map((addon, index) => (
                      <Box 
                        key={index} 
                        borderWidth="1px" 
                        borderRadius="md" 
                        p={4}
                        position="relative"
                      >
                        {addon.thumbnail && (
                          <Image 
                            src={addon.thumbnail} 
                            alt={addon.title}
                            borderRadius="md"
                            height="80px"
                            width="80px"
                            objectFit="cover"
                            mb={2}
                          />
                        )}
                        <Heading size="sm">{addon.title}</Heading>
                        <Text fontWeight="bold" color="green.500">
                          ${parseFloat(addon.price).toFixed(2)}
                        </Text>
                        {addon.description && (
                          <Text fontSize="sm" color="gray.600" mt={1} noOfLines={2}>
                            {addon.description}
                          </Text>
                        )}
                        
                        <HStack position="absolute" top={2} right={2}>
                          <IconButton
                            aria-label="Edit add-on"
                            icon={<EditIcon />}
                            size="sm"
                            onClick={() => editAddon(index)}
                          />
                          <IconButton
                            aria-label="Remove add-on"
                            icon={<CloseIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => removeAddon(index)}
                          />
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
              
              {/* Add New Add-on Form */}
              <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50">
                <Heading size="sm" mb={3}>Add New Add-on</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Title</FormLabel>
                    <Input
                      name="title"
                      value={currentAddon.title}
                      onChange={handleAddonChange}
                      placeholder="e.g. Extra Hour, Additional Table"
                      size="md"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Price</FormLabel>
                    <NumberInput
                      min={0}
                      precision={2}
                      value={currentAddon.price}
                      onChange={handleAddonPriceChange}
                    >
                      <NumberInputField placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
                
                <FormControl mb={3}>
                  <FormLabel fontSize="sm">Description (Optional)</FormLabel>
                  <Textarea
                    name="description"
                    value={currentAddon.description}
                    onChange={handleAddonChange}
                    placeholder="Briefly describe this add-on"
                    size="md"
                    rows={2}
                  />
                </FormControl>
                
                <FormControl mb={3}>
                  <FormLabel fontSize="sm">Thumbnail Image (Optional)</FormLabel>
                  <Input
                    type="file"
                    onChange={handleAddonThumbnailUpload}
                    accept="image/*"
                    p={1}
                    size="sm"
                  />
                  {currentAddon.thumbnail && (
                    <Image
                      src={currentAddon.thumbnail}
                      alt="Thumbnail preview"
                      mt={2}
                      height="60px"
                      width="60px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  )}
                </FormControl>
                
                <Button
                  onClick={addOrUpdateAddon}
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  size="md"
                  width="full"
                >
                  Add to Service
                </Button>
              </Box>
            </Box>
            
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