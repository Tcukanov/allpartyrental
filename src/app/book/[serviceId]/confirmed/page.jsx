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
  Card,
  CardBody,
  CardHeader,
  Alert,
  AlertIcon,
  Badge,
  Spinner,
  useToast,
  Flex,
  Icon,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { CheckCircleIcon, CalendarIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function BookingConfirmedPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const toast = useToast();
  
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { serviceId } = use(params);
  const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('transactionId');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!orderId) {
        console.error('No order ID provided');
        router.push('/');
        return;
      }

      try {
        // If we have a transaction ID, this is a real booking - fetch from database
        if (transactionId) {
          console.log('Fetching real booking data for transaction:', transactionId);
          
          const response = await fetch(`/api/bookings/order/${orderId}`);
          const data = await response.json();
          
          if (data.success && data.data) {
            setBooking(data.data);
          } else {
            throw new Error(data.error || 'Booking not found');
          }
        }
        // Check if this is a simulated payment (legacy)
        else if (orderId.startsWith('simulated-order-')) {
          // For simulated payments, try to get data from sessionStorage
          const storedBooking = sessionStorage.getItem('pendingBooking');
          if (storedBooking) {
            const bookingData = JSON.parse(storedBooking);
            
            // Create a mock booking object from the stored data
            const mockBooking = {
              id: orderId,
              service: {
                name: bookingData.service.name,
                price: bookingData.service.price
              },
              bookingDate: new Date(bookingData.bookingDetails.date + 'T' + bookingData.bookingDetails.time).toISOString(),
              address: `${bookingData.bookingDetails.address}, ${bookingData.bookingDetails.city} ${bookingData.bookingDetails.zipCode}`,
              comments: bookingData.bookingDetails.specialRequests,
              amount: bookingData.pricing.total,
              status: 'pending_confirmation',
              contactPhone: bookingData.bookingDetails.contactPhone,
              guestCount: bookingData.bookingDetails.guestCount
            };
            
            setBooking(mockBooking);
          } else {
            // If no sessionStorage data, show generic success message
            setBooking(null);
          }
        } else {
          // For real payments without transactionId (fallback), fetch from API
          const response = await fetch(`/api/bookings/order/${orderId}`);
          const data = await response.json();
          
          if (data.success && data.data) {
            setBooking(data.data);
          } else {
            throw new Error(data.error || 'Booking not found');
          }
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        
        // For simulated payments, don't show error - just show success message
        if (orderId.startsWith('simulated-order-')) {
          setBooking(null);
        } else {
          toast({
            title: 'Error',
            description: 'Unable to load booking details',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [orderId, transactionId, router, toast]);

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={10}>
        <Flex justify="center" align="center" minH="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading booking confirmation...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        
        {/* Success Header */}
        <Box textAlign="center">
          <Icon as={CheckCircleIcon} boxSize={16} color="green.500" mb={4} />
          <Heading size="xl" mb={2} color="green.600">
            Booking Confirmed!
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Your payment has been processed and your booking request has been sent to the provider.
          </Text>
        </Box>

        {/* Booking Details Card */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Booking Details</Heading>
              {orderId && (
                <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                  Order #{orderId.slice(-8).toUpperCase()}
                </Badge>
              )}
            </HStack>
          </CardHeader>
          <CardBody>
            {booking ? (
              <VStack spacing={6} align="stretch">
                {/* Service with Photo */}
                {booking.service?.photos?.[0] && (
                  <Box>
                    <Card variant="outline">
                      <CardBody p={0}>
                        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                          <Box width={{ base: '100%', md: '200px' }} height="150px" overflow="hidden">
                            <Image 
                              src={booking.service.photos[0]} 
                              alt={booking.service.name}
                              objectFit="cover"
                              width="100%"
                              height="100%"
                            />
                          </Box>
                          <VStack align="start" justify="center" p={4} flex="1">
                            <Heading size="md">{booking.service?.name || 'Service details'}</Heading>
                            <Text color="gray.600">${parseFloat(booking.amount || 0).toFixed(2)}</Text>
                          </VStack>
                        </Flex>
                      </CardBody>
                    </Card>
                  </Box>
                )}

                {!booking.service?.photos?.[0] && (
                  <Box>
                    <Text fontWeight="bold" mb={1}>Service</Text>
                    <Text>{booking.service?.name || 'Service details'}</Text>
                    <Text color="gray.600" fontSize="sm">${parseFloat(booking.amount || 0).toFixed(2)}</Text>
                  </Box>
                )}
                
                {/* Event Details */}
                <Box>
                  <Text fontWeight="bold" mb={2} fontSize="lg" color="blue.600">Event Details</Text>
                  <VStack spacing={3} align="stretch" pl={2}>
                    <HStack>
                      <Icon as={CalendarIcon} color="blue.500" />
                      <Box>
                        <Text fontWeight="semibold">Date & Time</Text>
                        <Text>{new Date(booking.bookingDate).toLocaleDateString()} at {new Date(booking.bookingDate).toLocaleTimeString()}</Text>
                      </Box>
                    </HStack>

                    {booking.duration && (
                      <HStack>
                        <Icon as={Icon} color="purple.500" />
                        <Box>
                          <Text fontWeight="semibold">Duration</Text>
                          <Text>{booking.duration} hours</Text>
                        </Box>
                      </HStack>
                    )}

                    {booking.guestCount && (
                      <HStack>
                        <Icon as={Icon} color="green.500" />
                        <Box>
                          <Text fontWeight="semibold">Guest Count</Text>
                          <Text>{booking.guestCount} guests</Text>
                        </Box>
                      </HStack>
                    )}
                  </VStack>
                </Box>
                
                {/* Location */}
                <Box>
                  <Text fontWeight="bold" mb={2} fontSize="lg" color="blue.600">Location</Text>
                  <VStack spacing={1} align="stretch" pl={2}>
                    <Text>{booking.address}</Text>
                    {(booking.city || booking.zipCode) && (
                      <Text color="gray.600">{booking.city}{booking.city && booking.zipCode ? ', ' : ''}{booking.zipCode}</Text>
                    )}
                  </VStack>
                </Box>

                {/* Contact Information */}
                <Box>
                  <Text fontWeight="bold" mb={2} fontSize="lg" color="blue.600">Contact Information</Text>
                  <VStack spacing={2} align="stretch" pl={2}>
                    {booking.contactPhone && (
                      <HStack>
                        <Icon as={PhoneIcon} color="green.500" />
                        <Text>{booking.contactPhone}</Text>
                      </HStack>
                    )}
                    {booking.contactEmail && (
                      <HStack>
                        <Icon as={EmailIcon} color="blue.500" />
                        <Text>{booking.contactEmail}</Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
                
                {/* Special Requests */}
                {booking.comments && (
                  <Box>
                    <Text fontWeight="bold" mb={1}>Special Requests</Text>
                    <Text bg="gray.50" p={3} borderRadius="md">{booking.comments}</Text>
                  </Box>
                )}

                {/* Pricing Breakdown */}
                {booking.pricing && (
                  <Box>
                    <Text fontWeight="bold" mb={2} fontSize="lg" color="blue.600">Payment Summary</Text>
                    <VStack spacing={2} align="stretch" pl={2}>
                      <HStack justify="space-between">
                        <Text>Service Price:</Text>
                        <Text fontWeight="semibold">${booking.pricing.basePrice.toFixed(2)}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Service Fee (5%):</Text>
                        <Text fontWeight="semibold">${booking.pricing.serviceFee.toFixed(2)}</Text>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="lg">Total Paid:</Text>
                        <Text fontWeight="bold" fontSize="lg" color="green.600">${booking.pricing.total.toFixed(2)}</Text>
                      </HStack>
                    </VStack>
                  </Box>
                )}

                {/* Status */}
                <Box>
                  <Text fontWeight="bold" mb={1}>Booking Status</Text>
                  <Badge 
                    colorScheme={booking.status === 'COMPLETED' ? 'green' : 'yellow'}
                    fontSize="md"
                    px={3}
                    py={1}
                    textTransform="capitalize"
                  >
                    {booking.status === 'PENDING' ? 'Pending Provider Confirmation' : (booking.status || 'Pending Confirmation')}
                  </Badge>
                </Box>
              </VStack>
            ) : (
              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">Booking Submitted Successfully</Text>
                  <Text fontSize="sm">
                    Your booking has been submitted and payment processed. 
                    You'll receive confirmation details via email shortly.
                  </Text>
                </VStack>
              </Alert>
            )}
          </CardBody>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <Heading size="md">What happens next?</Heading>
          </CardHeader>
          <CardBody>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <strong>Payment Processed:</strong> Your payment has been successfully processed
              </ListItem>
              <ListItem>
                <ListIcon as={CalendarIcon} color="blue.500" />
                <strong>Provider Notification:</strong> The service provider has been notified of your booking
              </ListItem>
              <ListItem>
                <ListIcon as={PhoneIcon} color="purple.500" />
                <strong>Confirmation Call:</strong> The provider will contact you within 24 hours to confirm details
              </ListItem>
              <ListItem>
                <ListIcon as={EmailIcon} color="orange.500" />
                <strong>Email Updates:</strong> You'll receive email updates about your booking status
              </ListItem>
            </List>
          </CardBody>
        </Card>

        {/* Contact Information */}
        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">Need help?</Text>
            <Text fontSize="sm">
              If you have any questions about your booking, please contact us at support@allpartyrent.com
            </Text>
          </VStack>
        </Alert>

        {/* Action Buttons */}
        <HStack spacing={4} justify="center">
          <Button
            as={Link}
            href="/dashboard"
            colorScheme="blue"
            size="lg"
          >
            View My Bookings
          </Button>
          <Button
            as={Link}
            href="/"
            variant="outline"
            size="lg"
          >
            Browse More Services
          </Button>
        </HStack>

      </VStack>
    </Container>
  );
} 