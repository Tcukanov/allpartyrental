'use client';

import React, { useState, useEffect, use } from 'react';
import {
  Container,
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Badge,
  Image,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Flex,
  Icon,
  Progress,
  InputGroup,
  InputLeftElement,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  Fade,
  ScaleFade
} from '@chakra-ui/react';
import { ArrowBackIcon, CalendarIcon, TimeIcon, CheckIcon } from '@chakra-ui/icons';
import { FiMapPin, FiUsers, FiPhone, FiMail, FiMessageSquare, FiClock, FiDollarSign } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format, addDays } from 'date-fns';

const steps = [
  { title: 'Service', description: 'Choose your service' },
  { title: 'Details', description: 'Booking information' },
  { title: 'Payment', description: 'Complete booking' },
  { title: 'Confirmation', description: 'All done!' }
];

export default function BookingDetailsPage({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  
  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Unwrap params using React.use() as required by Next.js 15
  const { serviceId } = use(params);

  // Stepper
  const { activeStep } = useSteps({
    index: 1,
    count: steps.length,
  });

  // Booking form data
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '10:00',
    duration: 4,
    address: '',
    city: '',
    zipCode: '',
    guestCount: 1,
    specialRequests: '',
    contactPhone: '',
    contactEmail: session?.user?.email || ''
  });

  // Price calculation
  const [pricing, setPricing] = useState({
    basePrice: 0,
    duration: 4,
    serviceFee: 0,
    total: 0
  });

  // Load service data
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${serviceId}`);
        const data = await response.json();
        
        if (data.success) {
          setService(data.data);
          const basePrice = parseFloat(data.data.price);
          setPricing(prev => ({
            ...prev,
            basePrice,
            serviceFee: basePrice * 0.05,
            total: basePrice + (basePrice * 0.05)
          }));
        } else {
          throw new Error(data.error || 'Service not found');
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        toast({
          title: 'Error',
          description: 'Failed to load service details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }
  }, [serviceId, router, toast]);

  // Fetch platform fee percentage
  const [platformFeePercent, setPlatformFeePercent] = useState(10); // Default 10%

  useEffect(() => {
    async function fetchPlatformFee() {
      try {
        const response = await fetch('/api/config/platform-fee');
        const data = await response.json();
        if (data.success) {
          setPlatformFeePercent(data.platformFeePercent);
        }
      } catch (error) {
        console.error('Error fetching platform fee:', error);
        // Keep default 10%
      }
    }
    fetchPlatformFee();
  }, []);

  // Update pricing when duration or fee changes
  useEffect(() => {
    if (service) {
      const basePrice = parseFloat(service.price);
      const serviceFee = basePrice * (platformFeePercent / 100);
      const total = basePrice + serviceFee;
      
      setPricing({
        basePrice,
        duration: bookingData.duration,
        serviceFee,
        total
      });
    }
  }, [service, bookingData.duration, platformFeePercent]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to make a booking',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      // Use relative path so it works on both localhost and production
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Validation
    if (!bookingData.date || !bookingData.address || !bookingData.city) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Store booking data in sessionStorage for the payment page
      const bookingPayload = {
        serviceId,
        service: {
          id: service.id,
          name: service.name,
          price: service.price,
          photos: service.photos
        },
        provider: {
          enablePayLater: service.provider?.enablePayLater ?? true
        },
        bookingDetails: bookingData,
        pricing
      };

      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingPayload));
      
      // Navigate to payment page
      router.push(`/book/${serviceId}/payment`);
      
    } catch (error) {
      console.error('Error processing booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to process booking. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time options
  const timeOptions = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 20) {
      timeOptions.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={10}>
        <Flex justify="center" align="center" minH="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text fontSize="lg" color="gray.600">Loading booking details...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  if (!service) {
    return (
      <Container maxW="container.xl" py={10}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          Service not found
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh">
      <Container maxW="container.xl" py={8}>
        {/* Header with back button and progress */}
        <VStack spacing={6} mb={8}>
          <Flex w="full" justify="space-between" align="center">
            <Button
              as={Link}
              href={`/services/${serviceId}`}
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              size="lg"
              color="gray.600"
              _hover={{ bg: 'white', color: 'blue.600' }}
            >
              Back to service
            </Button>
            
            <Badge 
              colorScheme="blue" 
              fontSize="sm" 
              px={3} 
              py={1} 
              borderRadius="full"
            >
              Step 2 of 4
            </Badge>
          </Flex>

          {/* Progress Stepper */}
          <Box w="full" maxW="600px">
            <Stepper index={activeStep} colorScheme="blue" size="sm">
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
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
          </Box>

          <VStack spacing={2} textAlign="center">
            <Heading size="xl" color="gray.800">Complete Your Booking</Heading>
            <Text color="gray.600" fontSize="lg">
              Tell us more about your event so we can provide the best service
            </Text>
          </VStack>
        </VStack>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          {/* Main Form */}
          <GridItem>
            <form onSubmit={handleSubmit}>
              <VStack spacing={8} align="stretch">
                
                {/* Service Summary Card */}
                <ScaleFade initialScale={0.9} in={true}>
                  <Card 
                    bg="white" 
                    shadow="lg" 
                    borderRadius="2xl" 
                    border="1px" 
                    borderColor="gray.100"
                  >
                    <CardHeader pb={4}>
                      <HStack spacing={3}>
                        <Box bg="blue.100" p={2} borderRadius="lg">
                          <CheckIcon color="blue.600" />
                        </Box>
                        <Box>
                          <Heading size="md" color="gray.800">Selected Service</Heading>
                          <Text color="gray.500" fontSize="sm">Review your choice</Text>
                        </Box>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <HStack spacing={4}>
                        {service.photos && service.photos[0] && (
                          <Image
                            src={service.photos[0]}
                            alt={service.name}
                            boxSize="80px"
                            objectFit="cover"
                            borderRadius="xl"
                          />
                        )}
                        <Box flex="1">
                          <Heading size="md" mb={2} color="gray.800">{service.name}</Heading>
                          <Text color="gray.600" fontSize="sm" mb={3} noOfLines={2}>
                            {service.description}
                          </Text>
                          <HStack spacing={3}>
                            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                              <HStack spacing={1}>
                                <FiDollarSign />
                                <Text>{service.price}</Text>
                              </HStack>
                            </Badge>
                            {service.category && (
                              <Badge colorScheme="blue" variant="outline" px={3} py={1} borderRadius="full">
                                {service.category.name}
                              </Badge>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                    </CardBody>
                  </Card>
                </ScaleFade>

                {/* Date and Time Card */}
                <Fade in={true} transition={{ enter: { delay: 0.1 } }}>
                  <Card 
                    bg="white" 
                    shadow="lg" 
                    borderRadius="2xl" 
                    border="1px" 
                    borderColor="gray.100"
                  >
                    <CardHeader pb={4}>
                      <HStack spacing={3}>
                        <Box bg="purple.100" p={2} borderRadius="lg">
                          <CalendarIcon color="purple.600" />
                        </Box>
                        <Box>
                          <Heading size="md" color="gray.800">Event Date & Time</Heading>
                          <Text color="gray.500" fontSize="sm">When do you need this service?</Text>
                        </Box>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                        <FormControl isRequired>
                          <FormLabel fontWeight="600" color="gray.700">
                            <HStack>
                              <CalendarIcon boxSize={4} />
                              <Text>Event Date</Text>
                            </HStack>
                          </FormLabel>
                          <Input
                            type="date"
                            value={bookingData.date}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            max={format(addDays(new Date(), 365), 'yyyy-MM-dd')}
                            onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                            bg="gray.50"
                            border="2px"
                            borderColor="gray.200"
                            borderRadius="xl"
                            _hover={{ borderColor: 'blue.300' }}
                            _focus={{ borderColor: 'blue.500', bg: 'white' }}
                            size="lg"
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel fontWeight="600" color="gray.700">
                            <HStack>
                              <TimeIcon boxSize={4} />
                              <Text>Start Time</Text>
                            </HStack>
                          </FormLabel>
                          <Select
                            value={bookingData.time}
                            onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                            bg="gray.50"
                            border="2px"
                            borderColor="gray.200"
                            borderRadius="xl"
                            _hover={{ borderColor: 'blue.300' }}
                            _focus={{ borderColor: 'blue.500', bg: 'white' }}
                            size="lg"
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </CardBody>
                  </Card>
                </Fade>

                {/* Location Card */}
                <Fade in={true} transition={{ enter: { delay: 0.2 } }}>
                  <Card 
                    bg="white" 
                    shadow="lg" 
                    borderRadius="2xl" 
                    border="1px" 
                    borderColor="gray.100"
                  >
                    <CardHeader pb={4}>
                      <HStack spacing={3}>
                        <Box bg="red.100" p={2} borderRadius="lg">
                          <Icon as={FiMapPin} color="red.600" />
                        </Box>
                        <Box>
                          <Heading size="md" color="gray.800">Event Location</Heading>
                          <Text color="gray.500" fontSize="sm">Where should we deliver?</Text>
                        </Box>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack spacing={6}>
                        <FormControl isRequired>
                          <FormLabel fontWeight="600" color="gray.700">
                            <HStack>
                              <Icon as={FiMapPin} boxSize={4} />
                              <Text>Street Address</Text>
                            </HStack>
                          </FormLabel>
                          <InputGroup>
                            <InputLeftElement height="12">
                              <Icon as={FiMapPin} color="gray.400" />
                            </InputLeftElement>
                            <Input
                              placeholder="123 Main Street, Apt 4B"
                              value={bookingData.address}
                              onChange={(e) => setBookingData(prev => ({ ...prev, address: e.target.value }))}
                              bg="gray.50"
                              border="2px"
                              borderColor="gray.200"
                              borderRadius="xl"
                              _hover={{ borderColor: 'blue.300' }}
                              _focus={{ borderColor: 'blue.500', bg: 'white' }}
                              size="lg"
                              pl="12"
                            />
                          </InputGroup>
                        </FormControl>
                        <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={6}>
                          <FormControl isRequired>
                            <FormLabel fontWeight="600" color="gray.700">City</FormLabel>
                            <Input
                              placeholder="Your city"
                              value={bookingData.city}
                              onChange={(e) => setBookingData(prev => ({ ...prev, city: e.target.value }))}
                              bg="gray.50"
                              border="2px"
                              borderColor="gray.200"
                              borderRadius="xl"
                              _hover={{ borderColor: 'blue.300' }}
                              _focus={{ borderColor: 'blue.500', bg: 'white' }}
                              size="lg"
                            />
                          </FormControl>
                          <FormControl isRequired>
                            <FormLabel fontWeight="600" color="gray.700">ZIP Code</FormLabel>
                            <Input
                              placeholder="12345"
                              value={bookingData.zipCode}
                              onChange={(e) => setBookingData(prev => ({ ...prev, zipCode: e.target.value }))}
                              bg="gray.50"
                              border="2px"
                              borderColor="gray.200"
                              borderRadius="xl"
                              _hover={{ borderColor: 'blue.300' }}
                              _focus={{ borderColor: 'blue.500', bg: 'white' }}
                              size="lg"
                            />
                          </FormControl>
                        </Grid>
                      </VStack>
                    </CardBody>
                  </Card>
                </Fade>

                {/* Event Details Card */}
                <Fade in={true} transition={{ enter: { delay: 0.3 } }}>
                  <Card 
                    bg="white" 
                    shadow="lg" 
                    borderRadius="2xl" 
                    border="1px" 
                    borderColor="gray.100"
                  >
                    <CardHeader pb={4}>
                      <HStack spacing={3}>
                        <Box bg="orange.100" p={2} borderRadius="lg">
                          <Icon as={FiUsers} color="orange.600" />
                        </Box>
                        <Box>
                          <Heading size="md" color="gray.800">Event Details</Heading>
                          <Text color="gray.500" fontSize="sm">Help us prepare for your event</Text>
                        </Box>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack spacing={6}>
                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                          <FormControl>
                            <FormLabel fontWeight="600" color="gray.700">
                              <HStack>
                                <Icon as={FiUsers} boxSize={4} />
                                <Text>Number of Guests</Text>
                              </HStack>
                            </FormLabel>
                            <Select
                              value={bookingData.guestCount}
                              onChange={(e) => setBookingData(prev => ({ ...prev, guestCount: parseInt(e.target.value) }))}
                              bg="gray.50"
                              border="2px"
                              borderColor="gray.200"
                              borderRadius="xl"
                              _hover={{ borderColor: 'blue.300' }}
                              _focus={{ borderColor: 'blue.500', bg: 'white' }}
                              size="lg"
                            >
                              {[1,2,3,4,5,6,7,8,9,10,15,20,25,30,40,50].map(num => (
                                <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontWeight="600" color="gray.700">
                              <HStack>
                                <Icon as={FiPhone} boxSize={4} />
                                <Text>Contact Phone</Text>
                              </HStack>
                            </FormLabel>
                            <InputGroup>
                              <InputLeftElement height="12">
                                <Icon as={FiPhone} color="gray.400" />
                              </InputLeftElement>
                              <Input
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={bookingData.contactPhone}
                                onChange={(e) => setBookingData(prev => ({ ...prev, contactPhone: e.target.value }))}
                                bg="gray.50"
                                border="2px"
                                borderColor="gray.200"
                                borderRadius="xl"
                                _hover={{ borderColor: 'blue.300' }}
                                _focus={{ borderColor: 'blue.500', bg: 'white' }}
                                size="lg"
                                pl="12"
                              />
                            </InputGroup>
                          </FormControl>
                        </Grid>
                        <FormControl>
                          <FormLabel fontWeight="600" color="gray.700">
                            <HStack>
                              <Icon as={FiMessageSquare} boxSize={4} />
                              <Text>Special Requests or Notes</Text>
                            </HStack>
                          </FormLabel>
                          <Textarea
                            placeholder="Any special requests, setup instructions, dietary restrictions, or other details we should know about..."
                            value={bookingData.specialRequests}
                            onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                            rows={4}
                            bg="gray.50"
                            border="2px"
                            borderColor="gray.200"
                            borderRadius="xl"
                            _hover={{ borderColor: 'blue.300' }}
                            _focus={{ borderColor: 'blue.500', bg: 'white' }}
                            resize="vertical"
                          />
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                </Fade>

              </VStack>
            </form>
          </GridItem>

          {/* Sidebar - Price Summary */}
          <GridItem>
            <Box position="sticky" top="20px">
              <Fade in={true} transition={{ enter: { delay: 0.4 } }}>
                <Card 
                  bg="white" 
                  shadow="xl" 
                  borderRadius="2xl" 
                  border="1px" 
                  borderColor="gray.100"
                  overflow="hidden"
                >
                  <CardHeader bg="blue.500" color="white" py={6}>
                    <VStack spacing={2}>
                      <Heading size="md">Booking Summary</Heading>
                      <Text opacity={0.9} fontSize="sm">Review your total</Text>
                    </VStack>
                  </CardHeader>
                  <CardBody p={6}>
                    <VStack spacing={5} align="stretch">
                      <HStack justify="space-between" py={2}>
                        <Text fontWeight="500" color="gray.700">Service fee</Text>
                        <Text fontWeight="600" fontSize="lg">${pricing.basePrice.toFixed(2)}</Text>
                      </HStack>
                      <HStack justify="space-between" py={2}>
                        <Text fontWeight="500" color="gray.700">Platform fee</Text>
                        <Text fontWeight="600" fontSize="lg">${pricing.serviceFee.toFixed(2)}</Text>
                      </HStack>
                      <Divider borderColor="gray.200" />
                      <HStack justify="space-between" py={2}>
                        <Text fontWeight="bold" fontSize="xl" color="gray.800">Total</Text>
                        <Text fontWeight="bold" fontSize="2xl" color="green.600">
                          ${pricing.total.toFixed(2)}
                        </Text>
                      </HStack>
                      
                      <Button
                        colorScheme="blue"
                        size="lg"
                        borderRadius="xl"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        loadingText="Processing..."
                        bg="blue.500"
                        color="white"
                        _hover={{ 
                          bg: "blue.600",
                          transform: "translateY(-2px)",
                          shadow: "xl"
                        }}
                        _active={{
                          bg: "blue.700"
                        }}
                        transition="all 0.2s"
                        h="14"
                        fontWeight="bold"
                        fontSize="lg"
                      >
                        Continue to Payment
                      </Button>
                      
                      <Alert 
                        status="info" 
                        borderRadius="lg" 
                        bg="blue.50" 
                        border="1px" 
                        borderColor="blue.200"
                      >
                        <AlertIcon color="blue.500" />
                        <Text fontSize="xs" color="blue.700">
                          You won't be charged until the provider confirms your booking
                        </Text>
                      </Alert>
                    </VStack>
                  </CardBody>
                </Card>
              </Fade>
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
} 
