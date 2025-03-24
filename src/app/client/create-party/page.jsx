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
import { useDrag, useDrop } from 'react-dnd';
import { CloseIcon, AddIcon, DragHandleIcon } from '@chakra-ui/icons';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';

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

// Item types for drag and drop
const ItemTypes = {
  CATEGORY: 'category',
  SERVICE_SLOT: 'serviceSlot'
};

// Draggable category component
const DraggableCategory = ({ category }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CATEGORY,
    item: { type: ItemTypes.CATEGORY, category },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <Box
      ref={drag}
      opacity={isDragging ? 0.5 : 1}
      cursor="move"
      borderWidth="1px"
      borderRadius="md"
      p={3}
      bg="white"
      shadow="sm"
      _hover={{ shadow: "md" }}
      h="100%"
    >
      <VStack spacing={2} align="center" textAlign="center">
        <Text fontSize="2xl">{category.icon}</Text>
        <Heading size="sm">{category.name}</Heading>
        <Text fontSize="xs" color="gray.600">{category.description}</Text>
      </VStack>
    </Box>
  );
};

// Service slot component
const ServiceSlot = ({ service, index, moveService, removeService }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SERVICE_SLOT,
    item: { type: ItemTypes.SERVICE_SLOT, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.SERVICE_SLOT,
    hover: (item, monitor) => {
      if (item.index !== index) {
        moveService(item.index, index);
        item.index = index;
      }
    }
  }));

  return (
    <Box
      ref={(node) => drag(drop(node))}
      opacity={isDragging ? 0.5 : 1}
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
          <DragHandleIcon />
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

// Droppable area component
const DroppableArea = ({ services, addService, moveService, removeService }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.CATEGORY,
    drop: (item, monitor) => {
      const { category } = item;
      addService(category);
      return { moved: true };
    }
  }));

  return (
    <Box
      ref={drop}
      minH="300px"
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
          <Text>Drag and drop service categories here</Text>
          <Text fontSize="sm">Example: Decorations, Catering, Entertainment</Text>
        </VStack>
      ) : (
        <VStack spacing={2} align="stretch">
          {services.map((service, index) => (
            <ServiceSlot
              key={index}
              service={service}
              index={index}
              moveService={moveService}
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
          <FormLabel>Party Name</FormLabel>
          <Input 
            name="name" 
            value={eventDetails.name || ''} 
            onChange={handleChange} 
            placeholder="e.g., Sarah's 7th Birthday" 
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Location (City)</FormLabel>
          <Select 
            name="cityId" 
            value={eventDetails.cityId || ''} 
            onChange={handleChange}
            placeholder="Select city"
          >
            <option value="new-york">New York</option>
            <option value="los-angeles">Los Angeles</option>
            <option value="chicago">Chicago</option>
            <option value="houston">Houston</option>
            <option value="miami">Miami</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Date</FormLabel>
          <Input 
            name="date" 
            type="date" 
            value={eventDetails.date || ''} 
            onChange={handleChange} 
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Start Time</FormLabel>
          <Input 
            name="startTime" 
            type="time" 
            value={eventDetails.startTime || ''} 
            onChange={handleChange} 
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Duration (hours)</FormLabel>
          <NumberInput 
            min={1} 
            max={12} 
            value={eventDetails.duration || 3}
            onChange={handleDuration}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Number of Guests</FormLabel>
          <NumberInput 
            min={1} 
            max={500} 
            value={eventDetails.guestCount || 20}
            onChange={handleGuestCount}
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
        <FormLabel>Additional Notes</FormLabel>
        <Textarea 
          name="notes" 
          value={eventDetails.notes || ''} 
          onChange={handleChange} 
          placeholder="Any specific requirements or information for all service providers" 
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
  const router = useRouter();
  const toast = useToast();
  
  // State for selected services
  const [services, setServices] = useState([]);
  
  // State for event details
  const [eventDetails, setEventDetails] = useState({
    name: '',
    cityId: '',
    date: '',
    startTime: '',
    duration: 3,
    guestCount: 20,
    notes: ''
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
    setServices(prev => [...prev, { category: category.name }]);
  }, []);
  
  // Move a service within the list (reordering)
  const moveService = useCallback((fromIndex, toIndex) => {
    setServices(prev => {
      const newServices = [...prev];
      const [movedService] = newServices.splice(fromIndex, 1);
      newServices.splice(toIndex, 0, movedService);
      return newServices;
    });
  }, []);
  
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
      if (!eventDetails.name || !eventDetails.cityId || !eventDetails.date || !eventDetails.startTime) {
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
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Prepare data for submission
      const partyData = {
        ...eventDetails,
        services: services.map((service, index) => ({
          category: service.category,
          specificOptions: serviceSpecificOptions[index] || {}
        }))
      };
      
      // In a real app, this would be an API call
      console.log('Party data to submit:', partyData);
      
      toast({
        title: "Party configuration submitted",
        description: "Your request has been sent to service providers. Check 'My Party' for updates.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to My Party page
      setTimeout(() => {
        router.push('/client/my-party');
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting party configuration:', error);
      toast({
        title: "Error",
        description: "There was an error submitting your party configuration. Please try again.",
        status: "error",
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
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" size="xl" mb={2}>Party Configurator</Heading>
        <Text mb={8} color="gray.600">
          Design your perfect party by selecting services and providing details
        </Text>
        
        <Stepper size="lg" index={activeStep} mb={8} colorScheme="brand">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<Badge colorScheme="green">✓</Badge>}
                  incomplete={index + 1}
                  active={index + 1}
                />
              </StepIndicator>
              <Box flexShrink="0">
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Box>
              <StepSeparator />
            </Step>
          ))}
        </Stepper>
        
        {activeStep === 0 && (
          <Box mb={8}>
            <Heading as="h2" size="md" mb={4}>Select Services for Your Party</Heading>
            <Text mb={4} color="gray.600">
              Drag service categories into the center area to add them to your party.
            </Text>
            
            <Flex direction={{ base: "column", md: "row" }} gap={6}>
              <Box w={{ base: "100%", md: "250px" }}>
                <Text fontWeight="bold" mb={2}>Available Services</Text>
                <VStack spacing={3} align="stretch">
                  {serviceCategories.map(category => (
                    <DraggableCategory key={category.id} category={category} />
                  ))}
                </VStack>
              </Box>
              
              <Box flex={1}>
                <Text fontWeight="bold" mb={2}>Your Party Services</Text>
                <DroppableArea
                  services={services}
                  addService={addService}
                  moveService={moveService}
                  removeService={removeService}
                />
              </Box>
            </Flex>
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box mb={8}>
            <Heading as="h2" size="md" mb={4}>Event Details</Heading>
            <Text mb={4} color="gray.600">
              Provide information about your event
            </Text>
            
            <EventDetailsForm 
              eventDetails={eventDetails} 
              setEventDetails={setEventDetails} 
            />
          </Box>
        )}
        
        {activeStep === 2 && (
          <Box mb={8}>
            <Heading as="h2" size="md" mb={4}>Service-Specific Options</Heading>
            <Text mb={4} color="gray.600">
              Customize each service with specific details
            </Text>
            
            <ServiceOptionsForm 
              services={services}
              serviceOptions={serviceOptions}
              setServiceOptions={setServiceSpecificOptions}
            />
          </Box>
        )}
        
        <Flex justify="space-between" mt={8}>
          {activeStep > 0 ? (
            <Button onClick={handlePrevious} colorScheme="gray">
              Previous
            </Button>
          ) : (
            <Box />
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} colorScheme="brand">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} colorScheme="brand">
              Submit Party Request
            </Button>
          )}
        </Flex>
      </Container>
    </MainLayout>
  );
}