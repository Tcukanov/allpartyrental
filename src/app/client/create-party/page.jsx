"use client";

import { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Button, 
  SimpleGrid, 
  VStack, 
  HStack, 
  Flex, 
  Card, 
  CardBody, 
  Badge, 
  Image, 
  Divider, 
  useToast,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepTitle,
  StepDescription,
  StepSeparator,
  useSteps,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton
} from '@chakra-ui/react';
import { CloseIcon, AddIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Mock data for service categories
const serviceCategories = [
  { id: 1, name: 'Decoration', icon: '🎨', description: 'Make your party look amazing' },
  { id: 2, name: 'Catering', icon: '🍽️', description: 'Delicious food for your guests' },
  { id: 3, name: 'Entertainment', icon: '🎭', description: 'Keep your guests entertained' },
  { id: 4, name: 'Venues', icon: '🏛️', description: 'Find the perfect location' },
  { id: 5, name: 'Photography', icon: '📸', description: 'Capture your special moments' },
  { id: 6, name: 'Music', icon: '🎵', description: 'Set the mood with great music' },
  { id: 7, name: 'Bounce Houses', icon: '🏠', description: 'Fun for the kids' },
  { id: 8, name: 'Party Supplies', icon: '🎁', description: 'Everything you need for your party' }
];

// Sample service options based on category
const serviceOptions = {
  'Decoration': [
    { name: 'Theme', type: 'select', options: ['Princess', 'Superhero', 'Jungle', 'Under the Sea', 'Space', 'Unicorn', 'Other'] },
    { name: 'Color Palette', type: 'select', options: ['Pink & Gold', 'Blue & Silver', 'Rainbow', 'Black & White', 'Custom'] },
    { name: 'Special Requests', type: 'textarea' }
  ],
  'Catering': [
    { name: 'Cuisine Type', type: 'select', options: ['American', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'Indian', 'Other'] },
    { name: 'Dietary Restrictions', type: 'multiselect', options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut-Free', 'Dairy-Free'] },
    { name: 'Special Requests', type: 'textarea' }
  ],
  'Entertainment': [
    { name: 'Type', type: 'select', options: ['DJ', 'Live Band', 'Magician', 'Clown', 'Character Performer', 'Face Painting', 'Other'] },
    { name: 'Duration (hours)', type: 'number', min: 1, max: 8 },
    { name: 'Special Requests', type: 'textarea' }
  ],
  'Photography': [
    { name: 'Style', type: 'select', options: ['Traditional', 'Candid', 'Artistic', 'Documentary', 'Other'] },
    { name: 'Duration (hours)', type: 'number', min: 1, max: 8 },
    { name: 'Special Requests', type: 'textarea' }
  ],
  'Music': [
    { name: 'Genre', type: 'multiselect', options: ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Electronic', 'Jazz', 'Classical'] },
    { name: 'Equipment Needed', type: 'multiselect', options: ['Speakers', 'Microphone', 'DJ Booth', 'Lighting'] },
    { name: 'Special Requests', type: 'textarea' }
  ],
};

// Clickable category component
const ClickableCategory = ({ category, onAddService }) => {
  return (
    <Box
      cursor="pointer"
      borderWidth="1px"
      borderRadius="md"
      p={3}
      bg="white"
      shadow="sm"
      _hover={{ shadow: "md", borderColor: "brand.500" }}
      h="100%"
      onClick={() => onAddService(category)}
    >
      <VStack spacing={2} align="center" textAlign="center">
        <Text fontSize="2xl">{category.icon}</Text>
        <Heading size="sm">{category.name}</Heading>
        <Text fontSize="xs" color="gray.600">{category.description}</Text>
      </VStack>
    </Box>
  );
};

// Selected service component
const SelectedService = ({ service, index, removeService }) => {
  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={3}
      mb={3}
      bg="white"
      shadow="sm"
      position="relative"
    >
      <Flex justify="space-between" align="center">
        <HStack>
          <Text fontWeight="bold">{service.category}</Text>
        </HStack>
        <IconButton
          size="sm"
          icon={<CloseIcon />}
          aria-label="Remove service"
          variant="ghost"
          colorScheme="red"
          onClick={() => removeService(index)}
        />
      </Flex>
    </Box>
  );
};

// Selected services area component
const SelectedServicesArea = ({ services, removeService }) => {
  return (
    <Box
      minH="100px"
      borderWidth="2px"
      borderRadius="md"
      borderStyle="dashed"
      borderColor="gray.300"
      p={4}
      bg="gray.50"
      flex={1}
    >
      {services.length === 0 ? (
        <VStack spacing={2} align="center" justify="center" h="100%" color="gray.500">
          <Text>No services selected yet</Text>
          <Text fontSize="sm">Click on a service category to add it</Text>
        </VStack>
      ) : (
        <VStack spacing={2} align="stretch">
          {services.map((service, index) => (
            <SelectedService
              key={index}
              service={service}
              index={index}
              removeService={removeService}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

// Event Details Form
const EventDetailsForm = ({ eventDetails, setEventDetails }) => {
  const [cities, setCities] = useState([]);
  const [isCitiesLoading, setIsCitiesLoading] = useState(true);
  const toast = useToast();
  
  // Fetch cities from API
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
          
          // Auto-select first city if none is selected
          if (data.data.length > 0 && !eventDetails.cityId) {
            setEventDetails(prev => ({ ...prev, cityId: data.data[0].id }));
          }
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
  }, [toast, eventDetails.cityId, setEventDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventDetails({ ...eventDetails, [name]: value });
  };

  const handleGuestCount = (value) => {
    setEventDetails({ ...eventDetails, guestCount: parseInt(value) });
  };

  const handleDuration = (value) => {
    setEventDetails({ ...eventDetails, duration: parseInt(value) });
  };

  return (
    <VStack spacing={6} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <FormControl isRequired>
          <FormLabel>Service looking for</FormLabel>
          <Input 
            name="name" 
            value={eventDetails.name || ''} 
            onChange={handleChange} 
            placeholder="e.g., Birthday Decorations" 
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Location (City)</FormLabel>
          <Select 
            name="cityId" 
            value={eventDetails.cityId || ''} 
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
            value={eventDetails.date || ''} 
            onChange={handleChange}
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Event Time</FormLabel>
          <Input 
            type="time" 
            name="time" 
            value={eventDetails.time || ''} 
            onChange={handleChange}
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Number of Guests</FormLabel>
          <NumberInput 
            value={eventDetails.guestCount || 0} 
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
            value={eventDetails.duration || 2} 
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
          value={eventDetails.description || ''} 
          onChange={handleChange}
          placeholder="Tell us about your party..."
          rows={4}
        />
      </FormControl>
    </VStack>
  );
};

// Service Options Form
const ServiceOptionsForm = ({ services, serviceOptions, setServiceOptions }) => {
  const handleOptionChange = (serviceIndex, optionName, value) => {
    const newOptions = [...serviceOptions];
    if (!newOptions[serviceIndex]) {
      newOptions[serviceIndex] = {};
    }
    newOptions[serviceIndex][optionName] = value;
    setServiceOptions(newOptions);
  };

  return (
    <VStack spacing={8} align="stretch">
      {services.map((service, serviceIndex) => {
        const options = serviceOptions[service.category] || [];
        
        if (options.length === 0) {
          return (
            <Box key={serviceIndex} p={4} borderWidth="1px" borderRadius="md">
              <Heading size="md" mb={4}>{service.category}</Heading>
              <Text color="gray.600">No specific options needed for this service.</Text>
            </Box>
          );
        }
        
        return (
          <Box key={serviceIndex} p={4} borderWidth="1px" borderRadius="md">
            <Heading size="md" mb={4}>{service.category}</Heading>
            <VStack spacing={4} align="stretch">
              {options.map((option, optionIndex) => {
                const currentValue = serviceOptions[serviceIndex]?.[option.name] || '';
                
                if (option.type === 'select') {
                  return (
                    <FormControl key={optionIndex}>
                      <FormLabel>{option.name}</FormLabel>
                      <Select 
                        placeholder={`Select ${option.name}`}
                        value={currentValue}
                        onChange={(e) => handleOptionChange(serviceIndex, option.name, e.target.value)}
                      >
                        {option.options.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </Select>
                    </FormControl>
                  );
                } else if (option.type === 'textarea') {
                  return (
                    <FormControl key={optionIndex}>
                      <FormLabel>{option.name}</FormLabel>
                      <Textarea 
                        placeholder={`Enter ${option.name}`}
                        value={currentValue}
                        onChange={(e) => handleOptionChange(serviceIndex, option.name, e.target.value)}
                      />
                    </FormControl>
                  );
                } else if (option.type === 'number') {
                  return (
                    <FormControl key={optionIndex}>
                      <FormLabel>{option.name}</FormLabel>
                      <NumberInput 
                        min={option.min || 0}
                        max={option.max || 100}
                        value={currentValue || option.min || 1}
                        onChange={(value) => handleOptionChange(serviceIndex, option.name, value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  );
                }
                
                return null;
              })}
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );
};

// Main Party Configurator Component
export default function PartyConfiguratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  // Check if user is signed in
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to create a party',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push('/auth/signin');
    }
  }, [status, router, toast]);

  // State for selected services
  const [services, setServices] = useState([]);
  
  // State for event details
  const [eventDetails, setEventDetails] = useState({
    name: '',
    cityId: '',
    date: '',
    time: '',
    duration: 3,
    guestCount: 20,
    description: ''
  });
  
  // State for service-specific options
  const [serviceSpecificOptions, setServiceSpecificOptions] = useState([]);
  
  // Stepper state
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: 3,
  });
  
  // Add a service to the list
  const addService = useCallback((category) => {
    // Check if the service is already added
    const isAlreadyAdded = services.some(service => service.category === category.name);
    
    if (isAlreadyAdded) {
      toast({
        title: "Service already added",
        description: `${category.name} is already in your list`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    setServices(prev => [...prev, { category: category.name }]);
    
    toast({
      title: "Service added",
      description: `${category.name} added to your party`,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  }, [services, toast]);
  
  // Remove a service from the list
  const removeService = useCallback((index) => {
    setServices(prev => {
      const newServices = [...prev];
      newServices.splice(index, 1);
      return newServices;
    });
  }, []);
  
  // Validate current step before proceeding
  const validateStep = () => {
    if (activeStep === 0) {
      if (services.length === 0) {
        toast({
          title: "No services selected",
          description: "Please add at least one service to continue.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
    } else if (activeStep === 1) {
      if (!eventDetails.name || !eventDetails.cityId || !eventDetails.date || !eventDetails.time) {
        toast({
          title: "Missing information",
          description: "Please fill out all required fields.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
    }
    
    return true;
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    setActiveStep(prev => prev - 1);
  };
  
  // Add image state
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast({
        title: 'Too many images',
        description: 'Please select up to 5 images',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setImages(files);
    const urls = files.map(file => URL.createObjectURL(file));
    setImageUrls(urls);
  };

  // Add image preview component
  const ImagePreview = () => (
    <Box>
      <FormLabel>Party Images (up to 5)</FormLabel>
      <Input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        display="none"
        id="image-upload"
      />
      <label htmlFor="image-upload">
        <Button as="span" colorScheme="blue" mb={4}>
          Upload Images
        </Button>
      </label>
      {imageUrls.length > 0 && (
        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
          {imageUrls.map((url, index) => (
            <Box key={index} position="relative">
              <Image
                src={url}
                alt={`Party image ${index + 1}`}
                borderRadius="md"
                objectFit="cover"
                height="150px"
                width="100%"
              />
              <IconButton
                aria-label="Remove image"
                icon={<CloseIcon />}
                size="sm"
                colorScheme="red"
                position="absolute"
                top={2}
                right={2}
                onClick={() => {
                  setImages(images.filter((_, i) => i !== index));
                  setImageUrls(imageUrls.filter((_, i) => i !== index));
                }}
              />
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!eventDetails.cityId) {
        toast({
          title: 'Location required',
          description: 'Please select a city for your party',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!eventDetails.name) {
        toast({
          title: 'Service name required',
          description: 'Please enter what service you are looking for',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!eventDetails.date || !eventDetails.time) {
        toast({
          title: 'Date and time required',
          description: 'Please select a date and time for your event',
          status: 'error',
          duration: 5000, 
          isClosable: true,
        });
        return;
      }

      // Prepare party data
      const partyData = {
        name: eventDetails.name,
        cityId: eventDetails.cityId, 
        date: eventDetails.date,
        startTime: eventDetails.time,
        duration: eventDetails.duration || 3,
        guestCount: eventDetails.guestCount || 20,
        description: eventDetails.description || '',
        services: services.map(service => service.category)
      };

      console.log('Submitting party data:', partyData);

      // Submit the form as JSON instead of FormData
      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(partyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create party');
      }

      const data = await response.json();
      
      toast({
        title: 'Party created successfully',
        description: 'Your party has been created and is pending approval',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      router.push(`/client/my-party?id=${data.data.id}`);
    } catch (error) {
      console.error('Error creating party:', error);
      toast({
        title: 'Error creating party',
        description: error.message || 'Failed to create party. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const steps = [
    { title: 'Select Services', description: 'Choose what you need' },
    { title: 'Event Details', description: 'When and where' },
    { title: 'Service Options', description: 'Customize your choices' },
  ];

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Create New Party</Heading>
          <Text color="gray.600" mt={2}>
            Fill in the details below to start planning your party
          </Text>
        </Box>
        
        <Stepper index={activeStep} mb={8}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus 
                  complete={<StepIndicator />}
                  incomplete={<StepIndicator />}
                  active={<StepIndicator />}
                />
              </StepIndicator>
              <Box flexShrink='0'>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Box>
              <StepSeparator />
            </Step>
          ))}
        </Stepper>
        
        {activeStep === 0 && (
          <Box>
            <Heading size="md" mb={4}>Select Services</Heading>
            <Text mb={4}>Click on a service category to add it to your party</Text>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
              {serviceCategories.map((category) => (
                <ClickableCategory 
                  key={category.id} 
                  category={category} 
                  onAddService={addService}
                />
              ))}
            </SimpleGrid>
            
            <Heading size="sm" mb={2} mt={6}>Selected Services</Heading>
            <SelectedServicesArea 
              services={services} 
              removeService={removeService} 
            />
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box>
            <Heading size="md" mb={4}>Event Details</Heading>
            <EventDetailsForm 
              eventDetails={eventDetails}
              setEventDetails={setEventDetails}
            />
            <Box mt={6}>
              <ImagePreview />
            </Box>
          </Box>
        )}
        
        {activeStep === 2 && (
          <Box>
            <Heading size="md" mb={4}>Service Options</Heading>
            <ServiceOptionsForm 
              services={services}
              serviceOptions={serviceSpecificOptions}
              setServiceOptions={setServiceSpecificOptions}
            />
          </Box>
        )}
        
        <HStack justify="space-between" mt={8}>
          <Button
            isDisabled={activeStep === 0}
            onClick={handlePrevious}
            variant="outline"
          >
            Previous
          </Button>
          
          {activeStep < 2 ? (
            <Button
              colorScheme="brand"
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            <Button
              colorScheme="brand"
              onClick={handleSubmit}
            >
              Create Party
            </Button>
          )}
        </HStack>
      </VStack>
    </Container>
  );
}