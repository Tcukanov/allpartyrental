"use client";

import { useState } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, FormControl, FormLabel, Input, Select, Textarea, Button, useToast, SimpleGrid, Card, CardBody, Flex, Badge, Grid, GridItem, Tooltip } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, AddIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Service types that can be added to the party
const serviceTypes = [
  { id: 'decoration', name: 'Decoration', icon: '🎨', description: 'Make your party look amazing' },
  { id: 'catering', name: 'Catering', icon: '🍽️', description: 'Delicious food and drinks' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭', description: 'Keep your guests engaged' },
  { id: 'venue', name: 'Venue', icon: '🏛️', description: 'The perfect location' },
  { id: 'photography', name: 'Photography', icon: '📸', description: 'Capture the memories' },
  { id: 'music', name: 'Music', icon: '🎵', description: 'Set the mood with great music' },
  { id: 'bounceHouse', name: 'Bounce House', icon: '🏠', description: 'Fun for the kids' },
  { id: 'clown', name: 'Clown/Entertainer', icon: '🤡', description: 'Special entertainment for children' }
];

// Draggable service item component
const DraggableServiceItem = ({ service }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'SERVICE',
    item: { service },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <Box
      ref={drag}
      opacity={isDragging ? 0.5 : 1}
      cursor="move"
      p={3}
      borderWidth="1px"
      borderRadius="md"
      boxShadow="sm"
      bg="white"
      mb={2}
    >
      <HStack>
        <Text fontSize="2xl">{service.icon}</Text>
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold">{service.name}</Text>
          <Text fontSize="sm" color="gray.600">{service.description}</Text>
        </VStack>
      </HStack>
    </Box>
  );
};

// Droppable area for services
const DroppableArea = ({ onDrop, selectedServices }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'SERVICE',
    drop: (item) => onDrop(item.service),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  return (
    <Box
      ref={drop}
      borderWidth="2px"
      borderStyle="dashed"
      borderColor={isOver ? "brand.500" : "gray.300"}
      borderRadius="md"
      p={4}
      minHeight="300px"
      bg={isOver ? "brand.50" : "gray.50"}
      transition="all 0.2s"
    >
      <VStack spacing={4} align="stretch">
        <Text textAlign="center" fontWeight="bold" color={selectedServices.length === 0 ? "gray.500" : "black"}>
          {selectedServices.length === 0 ? "Drag services here to add to your party" : "Your selected services"}
        </Text>
        
        {selectedServices.map((service, index) => (
          <Box 
            key={`${service.id}-${index}`}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            boxShadow="md"
            bg="white"
          >
            <Flex justify="space-between" align="center">
              <HStack>
                <Text fontSize="2xl">{service.icon}</Text>
                <Text fontWeight="bold">{service.name}</Text>
              </HStack>
              <Button size="sm" colorScheme="red" onClick={() => onDrop(service, true)}>Remove</Button>
            </Flex>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default function PartyConfiguratorPage() {
  const router = useRouter();
  const toast = useToast();
  const [selectedServices, setSelectedServices] = useState([]);
  const [step, setStep] = useState(1);
  const [partyDetails, setPartyDetails] = useState({
    name: '',
    date: '',
    startTime: '',
    duration: 3,
    guests: 10,
    location: '',
    notes: ''
  });
  const [currentDate, setCurrentDate] = useState(new Date());

  // Handle dropping a service into the droppable area
  const handleDrop = (service, isRemove = false) => {
    if (isRemove) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
      return;
    }
    
    // Check if service is already added
    if (!selectedServices.find(s => s.id === service.id)) {
      setSelectedServices([...selectedServices, service]);
    } else {
      toast({
        title: "Service already added",
        description: `${service.name} is already in your party configuration.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPartyDetails({
      ...partyDetails,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (step === 1) {
      if (selectedServices.length === 0) {
        toast({
          title: "No services selected",
          description: "Please select at least one service for your party.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      setStep(2);
    } else {
      // Submit the party configuration
      toast({
        title: "Party configuration submitted!",
        description: "Your party configuration has been sent to service providers.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to the party management page
      setTimeout(() => {
        router.push('/client/cabinet');
      }, 2000);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleAddEvent = () => {
    router.push('/client/create-party');
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Party Configurator</Heading>
          <Text color="gray.600" mt={2}>
            Design your perfect party by selecting services and providing details
          </Text>
        </Box>

        <Box>
          <HStack justify="space-between" mb={6}>
            <HStack>
              <IconButton
                icon={<ChevronLeftIcon />}
                onClick={handlePreviousMonth}
                aria-label="Previous month"
              />
              <Heading size="md">{format(currentDate, 'MMMM yyyy')}</Heading>
              <IconButton
                icon={<ChevronRightIcon />}
                onClick={handleNextMonth}
                aria-label="Next month"
              />
            </HStack>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="brand"
              onClick={handleAddEvent}
            >
              Add Event
            </Button>
          </HStack>

          <Grid templateColumns="repeat(7, 1fr)" gap={1}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <GridItem key={day} textAlign="center" fontWeight="bold" py={2}>
                {day}
              </GridItem>
            ))}
            {daysInMonth.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const isSameMonthDay = isSameDay(day, currentDate);

              return (
                <GridItem
                  key={index}
                  p={2}
                  minH="100px"
                  borderWidth="1px"
                  borderColor="gray.200"
                  bg={!isCurrentMonth ? 'gray.50' : 'white'}
                  position="relative"
                >
                  <Text
                    fontSize="sm"
                    color={!isCurrentMonth ? 'gray.400' : 'gray.700'}
                    fontWeight={isCurrentDay ? 'bold' : 'normal'}
                  >
                    {format(day, 'd')}
                  </Text>
                  {isSameMonthDay && (
                    <Badge
                      colorScheme="brand"
                      position="absolute"
                      top={1}
                      right={1}
                    >
                      Today
                    </Badge>
                  )}
                </GridItem>
              );
            })}
          </Grid>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Upcoming Events</Heading>
          <VStack spacing={4} align="stretch">
            <Box
              p={4}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              _hover={{ borderColor: 'brand.500' }}
              cursor="pointer"
            >
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold">Birthday Party</Text>
                  <Text fontSize="sm" color="gray.600">March 25, 2024</Text>
                </Box>
                <Badge colorScheme="brand">Upcoming</Badge>
              </HStack>
            </Box>

            <Box
              p={4}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              _hover={{ borderColor: 'brand.500' }}
              cursor="pointer"
            >
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold">Wedding Reception</Text>
                  <Text fontSize="sm" color="gray.600">April 15, 2024</Text>
                </Box>
                <Badge colorScheme="brand">Upcoming</Badge>
              </HStack>
            </Box>
          </VStack>
        </Box>

        <Flex justify="space-between" align="center">
          <Badge colorScheme="brand" p={2} borderRadius="md" fontSize="md">
            Step {step} of 2: {step === 1 ? 'Select Services' : 'Party Details'}
          </Badge>
        </Flex>
        
        {step === 1 ? (
          <DndProvider backend={HTML5Backend}>
            <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
              <Box flex="1">
                <Heading as="h3" size="md" mb={4}>Available Services</Heading>
                <VStack align="stretch" spacing={3} maxH="600px" overflowY="auto" pr={2}>
                  {serviceTypes.map(service => (
                    <DraggableServiceItem key={service.id} service={service} />
                  ))}
                </VStack>
              </Box>
              
              <Box flex="2">
                <Heading as="h3" size="md" mb={4}>Your Party Configuration</Heading>
                <DroppableArea onDrop={handleDrop} selectedServices={selectedServices} />
              </Box>
            </Flex>
          </DndProvider>
        ) : (
          <Box as="form" onSubmit={handleSubmit}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl isRequired>
                <FormLabel>Party Name</FormLabel>
                <Input 
                  name="name" 
                  value={partyDetails.name} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Sarah's 7th Birthday"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input 
                  name="date" 
                  type="date" 
                  value={partyDetails.date} 
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Start Time</FormLabel>
                <Input 
                  name="startTime" 
                  type="time" 
                  value={partyDetails.startTime} 
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Duration (hours)</FormLabel>
                <Select 
                  name="duration" 
                  value={partyDetails.duration} 
                  onChange={handleInputChange}
                >
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={5}>5 hours</option>
                  <option value={6}>6 hours</option>
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Number of Guests</FormLabel>
                <Input 
                  name="guests" 
                  type="number" 
                  min={1}
                  value={partyDetails.guests} 
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Location</FormLabel>
                <Input 
                  name="location" 
                  value={partyDetails.location} 
                  onChange={handleInputChange} 
                  placeholder="Address where the party will be held"
                />
              </FormControl>
              
              <FormControl gridColumn={{ md: "span 2" }}>
                <FormLabel>Additional Notes</FormLabel>
                <Textarea 
                  name="notes" 
                  value={partyDetails.notes} 
                  onChange={handleInputChange} 
                  placeholder="Any special requirements or information for service providers"
                  rows={4}
                />
              </FormControl>
            </SimpleGrid>
            
            <Box mt={6}>
              <Text fontWeight="bold" mb={2}>Selected Services:</Text>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                {selectedServices.map((service, index) => (
                  <Card key={`${service.id}-${index}`} size="sm">
                    <CardBody>
                      <HStack>
                        <Text fontSize="xl">{service.icon}</Text>
                        <Text>{service.name}</Text>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          </Box>
        )}
        
        <Flex justify="space-between" mt={6}>
          {step === 2 && (
            <Button onClick={() => setStep(1)} colorScheme="gray">
              Back to Services
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            colorScheme="brand" 
            size="lg" 
            ml={step === 1 ? 'auto' : 0}
          >
            {step === 1 ? 'Continue to Party Details' : 'Submit Party Configuration'}
          </Button>
        </Flex>
      </VStack>
    </Container>
  );
}
