"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
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
  IconButton,
  Icon
} from '@chakra-ui/react';
import { CloseIcon, AddIcon, DragHandleIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Mock data for service categories
const serviceCategories = [
  { 
    id: 1, 
    name: 'Decoration', 
    icon: '🎨', 
    description: 'Make your party look amazing', 
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    details: 'From balloons to banners, our decorators will transform your venue into a visually stunning space.'
  },
  { 
    id: 2, 
    name: 'Catering', 
    icon: '🍽️', 
    description: 'Delicious food for your guests', 
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    details: 'Professional caterers providing a variety of cuisines tailored to your preferences and dietary needs.'
  },
  { 
    id: 3, 
    name: 'Entertainment', 
    icon: '🎭', 
    description: 'Keep your guests entertained', 
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    details: 'From DJs to live bands, magicians to clowns, we have the perfect entertainment options for your event.'
  },
  { 
    id: 4, 
    name: 'Venues', 
    icon: '🏛️', 
    description: 'Find the perfect location', 
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    details: 'Discover the ideal venue for your party, whether it\'s an intimate gathering or a grand celebration.'
  },
  { 
    id: 5, 
    name: 'Photography', 
    icon: '📸', 
    description: 'Capture your special moments', 
    image: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    details: 'Professional photographers who will document your special day with beautiful, lasting memories.'
  },
  { 
    id: 6, 
    name: 'Music', 
    icon: '🎵', 
    description: 'Set the mood with great music', 
    image: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    details: 'Expert DJs and musicians who will create the perfect soundtrack for your event.'
  },
  { 
    id: 7, 
    name: 'Bounce Houses', 
    icon: '🏠', 
    description: 'Fun for the kids', 
    image: 'https://images.unsplash.com/photo-1578779777128-3e9272e39b30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    details: 'Exciting inflatable bounce houses and games to keep children entertained throughout your event.'
  },
  { 
    id: 8, 
    name: 'Party Supplies', 
    icon: '🎁', 
    description: 'Everything you need for your party', 
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    details: 'From plates and cutlery to party favors and table decorations, we have all the essentials covered.'
  }
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
const ClickableCategory = ({ category, onAddService, onMobileDragStart }) => {
  const handleDragStart = (e) => {
    console.log("Drag started with category:", category);
    
    // Just set the basic required data
    e.dataTransfer.setData("text/plain", JSON.stringify(category));
    
    // Make sure we can see what we're dragging
    const img = e.target.querySelector('img');
    if (img) {
      try {
        e.dataTransfer.setDragImage(img, 50, 50);
      } catch (err) {
        console.error("Error setting drag image:", err);
      }
    }
    
    e.dataTransfer.effectAllowed = "copy";
  };

  // Long press handler for mobile
  const handleTouchStart = () => {
    // We'll use this to detect long press
    const timer = setTimeout(() => {
      if (onMobileDragStart) {
        onMobileDragStart(category);
      }
    }, 500); // 500ms for long press
    
    // Store the timer so we can clear it
    window.lastTouchTimer = timer;
  };
  
  const handleTouchEnd = () => {
    // Clear the long press timer if touch ends before the timer
    if (window.lastTouchTimer) {
      clearTimeout(window.lastTouchTimer);
    }
  };

  return (
    <Box
      cursor="grab"
      borderWidth="1px"
      borderRadius="md"
      bg="white"
      shadow="sm"
      _hover={{ 
        shadow: "md", 
        borderColor: "brand.500",
        transform: "translateY(-2px)"
      }}
      h="100%"
      onClick={() => onAddService(category)}
      draggable="true"
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      overflow="hidden"
      position="relative"
      transition="all 0.2s"
    >
      <Box 
        position="relative" 
        height="120px" 
        overflow="hidden"
      >
        <Image
          src={category.image}
          alt={category.name}
          objectFit="cover"
          width="100%"
          height="100%"
          fallbackSrc="https://via.placeholder.com/150"
        />
        <Box 
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.300"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="3xl">{category.icon}</Text>
        </Box>
        
        <Badge 
          position="absolute" 
          top="2" 
          right="2" 
          colorScheme="blue"
          opacity="0.9"
          px={2}
        >
          Drag me
        </Badge>
      </Box>
      <VStack spacing={1} align="center" textAlign="center" p={3}>
        <Heading size="sm">{category.name}</Heading>
        <Text fontSize="xs" color="gray.600">{category.description}</Text>
      </VStack>
    </Box>
  );
};

// Selected service component
const SelectedService = ({ service, index, removeService, handleDragStart, handleDragOver, handleDrop, handleDragEnd }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState(service.details || '');
  const [photos, setPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    // Update service details when description changes
    if (service && description !== service.details) {
      service.details = description;
    }
  }, [description, service]);
  
  const handleLocalDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
    handleDragOver(e);
  };
  
  const handleLocalDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleLocalDrop = (e, index) => {
    setIsDragOver(false);
    handleDrop(e, index);
  };
  
  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };
  
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      alert("You can only upload up to 3 photos per service");
      return;
    }
    
    setPhotos(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(urls);
    
    // Store photos in service object
    if (service) {
      service.photoFiles = files;
      service.photoUrls = urls;
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  const removePhoto = (index) => {
    const newPhotos = [...photos];
    const newUrls = [...photoPreviewUrls];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newUrls[index]);
    
    newPhotos.splice(index, 1);
    newUrls.splice(index, 1);
    
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newUrls);
    
    // Update service object
    if (service) {
      service.photoFiles = newPhotos;
      service.photoUrls = newUrls;
    }
  };

  return (
    <Box
      draggable="true"
      onDragStart={(e) => handleDragStart(e, index)}
      onDragOver={handleLocalDragOver}
      onDragLeave={handleLocalDragLeave}
      onDrop={(e) => handleLocalDrop(e, index)}
      onDragEnd={handleDragEnd}
      borderWidth="1px"
      borderRadius="md"
      mb={3}
      bg={isDragOver ? "blue.50" : "white"}
      shadow={isDragOver ? "md" : "sm"}
      borderColor={isDragOver ? "blue.500" : "gray.200"}
      position="relative"
      transition="all 0.2s"
      _hover={{
        shadow: "md",
        borderColor: "brand.500",
        cursor: "move"
      }}
    >
      <Flex p={3} justify="space-between" align="center" onClick={() => setIsExpanded(!isExpanded)}>
        <HStack>
          <Icon as={DragHandleIcon} color="gray.400" mr={2} />
          <Text fontWeight="bold">{service.category}</Text>
        </HStack>
        <IconButton
          size="sm"
          icon={<CloseIcon />}
          aria-label="Remove service"
          variant="ghost"
          colorScheme="red"
          onClick={(e) => {
            e.stopPropagation();
            removeService(index);
          }}
        />
      </Flex>
      
      {isExpanded && (
        <Box p={3} pt={0}>
          <Divider mb={3} />
          
          <VStack spacing={4} align="stretch">
            {/* Display existing image if available */}
            {service.image && !photoPreviewUrls.length && (
              <Box>
                <Image 
                  src={service.image} 
                  alt={service.category}
                  maxH="150px"
                  objectFit="cover"
                  borderRadius="md"
                  fallbackSrc="https://via.placeholder.com/150"
                />
              </Box>
            )}
            
            {/* Photo upload section */}
            <FormControl>
              <FormLabel>Photos (up to 3)</FormLabel>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <Button 
                leftIcon={<AddIcon />} 
                onClick={triggerFileInput}
                size="sm"
                colorScheme="blue"
                mb={2}
              >
                Upload Photos
              </Button>
              
              {/* Photo previews */}
              {photoPreviewUrls.length > 0 && (
                <SimpleGrid columns={3} spacing={2} mt={2}>
                  {photoPreviewUrls.map((url, idx) => (
                    <Box key={idx} position="relative">
                      <Image
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        borderRadius="md"
                        objectFit="cover"
                        h="80px"
                        w="100%"
                      />
                      <IconButton
                        icon={<CloseIcon />}
                        size="xs"
                        colorScheme="red"
                        position="absolute"
                        top="1"
                        right="1"
                        onClick={() => removePhoto(idx)}
                        aria-label="Remove photo"
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </FormControl>
            
            {/* Description text area */}
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder={`Describe what you need for the ${service.category} service...`}
                size="sm"
                rows={3}
              />
            </FormControl>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

// Selected services area component
const SelectedServicesArea = ({ services, removeService, addService, isMobileDragging, onMobileDrop }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
    e.target.style.opacity = "0.75";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set the dropEffect explicitly for Safari
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    
    setIsHighlighted(true);
    return false;
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHighlighted(false);
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target) {
      e.target.style.opacity = "1";
    }
    setDraggedItem(null);
    setIsHighlighted(false);
  };

  const handleDrop = (e, dropIndex = services.length) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHighlighted(false);
    
    console.log("Drop detected!");
    
    // For plain text (this works in Safari)
    const textData = e.dataTransfer.getData("text/plain");
    console.log("Text data:", textData);
    
    if (textData) {
      try {
        // Try to parse it as JSON first
        const parsedData = JSON.parse(textData);
        if (parsedData && parsedData.name) {
          console.log("Parsed category from text/plain:", parsedData);
          addService(parsedData);
          return;
        }
      } catch (err) {
        // If it's not JSON, see if it's a category name
        console.log("Not JSON, trying to find category by name");
        const category = serviceCategories.find(c => c.name === textData);
        if (category) {
          console.log("Found category by name:", category);
          addService(category);
          return;
        }
      }
    }
    
    // Otherwise handle reordering
    if (draggedItem === null) return;
    
    const dragIndex = draggedItem;
    if (dragIndex === dropIndex) return;

    // This will remove all services and add them back in the new order
    const newServices = [...services];
    const draggedService = newServices[dragIndex];
    
    // Remove the dragged item
    newServices.splice(dragIndex, 1);
    // Insert at new position
    newServices.splice(dropIndex, 0, draggedService);
    
    // We need to tell the main component about the reordering
    window.dispatchEvent(new CustomEvent('reorderServices', { 
      detail: { services: newServices }
    }));
  };

  return (
    <Box
      minH="100px"
      borderWidth="2px"
      borderRadius="md"
      borderStyle="dashed"
      borderColor={isHighlighted || isMobileDragging ? "blue.500" : "gray.300"}
      p={4}
      bg={isHighlighted || isMobileDragging ? "blue.50" : "gray.50"}
      flex={1}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, services.length)}
      onClick={isMobileDragging ? onMobileDrop : undefined}
      transition="all 0.2s ease"
      position="relative"
      data-drop-target="true"
      _hover={{
        borderColor: "blue.300",
        bg: "gray.100"
      }}
      _after={(isHighlighted || isMobileDragging) ? {
        content: isMobileDragging ? '"Tap here to add"' : '"Drop here"',
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "blue.500",
        fontWeight: "bold",
        fontSize: "2xl",
        backgroundColor: "rgba(237, 242, 247, 0.8)",
        zIndex: "1"
      } : {}}
    >
      {services.length === 0 ? (
        <VStack spacing={2} align="center" justify="center" h="100%" color="gray.500">
          <Text>No services selected yet</Text>
          <Text fontSize="sm">Click or drag a service category to add it</Text>
          <Badge colorScheme="blue" mt={2}>Drop zone for services</Badge>
        </VStack>
      ) : (
        <VStack spacing={2} align="stretch">
          {services.length > 1 && (
            <Flex justifyContent="center" mb={3}>
              <Badge colorScheme="blue" p={2} borderRadius="md" display="flex" alignItems="center">
                <Icon as={DragHandleIcon} mr={2} /> 
                Drag services to reorder
              </Badge>
            </Flex>
          )}
          {services.map((service, index) => (
            <SelectedService
              key={index}
              service={service}
              index={index}
              removeService={removeService}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
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
  
  // State for mobile drag handling
  const [isMobileDragging, setIsMobileDragging] = useState(false);
  const [mobileDragItem, setMobileDragItem] = useState(null);
  
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

  // Safari drag and drop fix
  useEffect(() => {
    // This prevents Safari from redirecting when dragging images
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      return false;
    });
    
    document.addEventListener('drop', (e) => {
      // Prevent default unless it's on a valid drop target
      if (!e.target.closest('[data-drop-target="true"]')) {
        e.preventDefault();
      }
      return false;
    });
    
    return () => {
      document.removeEventListener('dragover', (e) => e.preventDefault());
      document.removeEventListener('drop', (e) => e.preventDefault());
    };
  }, []);

  // State for selected services
  const [services, setServices] = useState([]);
  
  // Listen for service reordering events
  useEffect(() => {
    const handleReorderServices = (e) => {
      const { services: newServices } = e.detail;
      setServices(newServices);
    };
    
    window.addEventListener('reorderServices', handleReorderServices);
    return () => {
      window.removeEventListener('reorderServices', handleReorderServices);
    };
  }, []);
  
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
    
    // Find the category in our serviceCategories array to get all details
    const categoryData = serviceCategories.find(cat => cat.name === category.name);
    
    setServices(prev => [...prev, { 
      category: category.name,
      image: categoryData?.image,
      details: categoryData?.details
    }]);
    
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

      // Display loading toast
      const loadingToast = toast({
        title: 'Creating your party',
        description: 'Please wait while we set up your party...',
        status: 'loading',
        duration: null,
        isClosable: false,
      });

      // Check if we need to use FormData (if any service has photos)
      const hasServicePhotos = services.some(service => service.photoFiles && service.photoFiles.length > 0);
      const hasPartyPhotos = images.length > 0;
      
      if (hasServicePhotos || hasPartyPhotos) {
        // Use FormData to upload photos
        const formData = new FormData();
        
        // Add basic party data
        formData.append('name', eventDetails.name);
        formData.append('cityId', eventDetails.cityId);
        formData.append('date', eventDetails.date);
        formData.append('time', eventDetails.time);
        formData.append('duration', eventDetails.duration || 3);
        formData.append('guestCount', eventDetails.guestCount || 20);
        formData.append('description', eventDetails.description || '');
        
        // Add party images
        if (images.length > 0) {
          images.forEach((image, index) => {
            formData.append(`partyImages`, image);
          });
        }
        
        // Add services data with photos
        const servicesData = services.map((service, serviceIndex) => {
          const serviceData = {
            name: service.category,
            description: service.details || '',
            defaultImage: service.image || ''
          };
          
          // If this service has photos, add them to formData
          if (service.photoFiles && service.photoFiles.length > 0) {
            service.photoFiles.forEach((file, fileIndex) => {
              formData.append(`servicePhotos_${serviceIndex}_${fileIndex}`, file);
            });
            
            // Add photo count to the service data
            serviceData.photoCount = service.photoFiles.length;
          }
          
          return serviceData;
        });
        
        // Add services data as a JSON string
        formData.append('services', JSON.stringify(servicesData));
        
        console.log('Submitting party with images...');
        
        // Submit with FormData
        const response = await fetch('/api/parties', {
          method: 'POST',
          body: formData
        });
        
        // Close loading toast
        toast.close(loadingToast);
        
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
        
        router.push(`/client/my-bookings?id=${data.data.id}`);
      } else {
        // No photos, use JSON submission
        // Prepare party data
        const partyData = {
          name: eventDetails.name,
          cityId: eventDetails.cityId, 
          date: eventDetails.date,
          startTime: eventDetails.time,
          duration: eventDetails.duration || 3,
          guestCount: eventDetails.guestCount || 20,
          description: eventDetails.description || '',
          services: services.map(service => ({
            name: service.category,
            description: service.details || '',
            image: service.image || ''
          }))
        };

        console.log('Submitting party data:', partyData);

        // Submit the form as JSON
        const response = await fetch('/api/parties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(partyData)
        });

        // Close loading toast
        toast.close(loadingToast);

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

        router.push(`/client/my-bookings?id=${data.data.id}`);
      }
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

  // Fallback for mobile devices
  const handleMobileDragStart = (category) => {
    setIsMobileDragging(true);
    setMobileDragItem(category);
    toast({
      title: "Drag started",
      description: `Tap on the drop zone to add ${category.name}`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };
  
  const handleMobileDrop = () => {
    if (isMobileDragging && mobileDragItem) {
      addService(mobileDragItem);
      setIsMobileDragging(false);
      setMobileDragItem(null);
    }
  };

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
                  onMobileDragStart={handleMobileDragStart}
                />
              ))}
            </SimpleGrid>
            
            <Heading size="sm" mb={2} mt={6}>Selected Services</Heading>
            {services.length > 0 && (
              <Text mb={2} fontSize="sm" color="gray.600">
                You can add specific details for each service in the next steps. 
                {services.length > 1 && " Drag and drop to prioritize services in order of importance."}
              </Text>
            )}
            <SelectedServicesArea 
              services={services} 
              removeService={removeService} 
              addService={addService}
              isMobileDragging={isMobileDragging}
              onMobileDrop={handleMobileDrop}
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