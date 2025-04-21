"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useToast,
  HStack,
  IconButton,
  Grid,
  GridItem,
  Badge,
  Spinner,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, TimeIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, isPast } from 'date-fns';
import { getSession } from 'next-auth/react';
import Link from 'next/link';

export default function ClientCalendarPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Separate bookings into upcoming and past
  const upcomingBookings = bookings.filter(booking => {
    const eventDate = new Date(booking.date);
    return eventDate >= new Date();
  });

  const pastBookings = bookings.filter(booking => {
    const eventDate = new Date(booking.date);
    return eventDate < new Date();
  });

  // Function to fetch bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check session
      const session = await getSession();
      if (!session || !session.user) {
        router.push('/login');
        return;
      }
      
      // Fetch approved bookings
      const response = await fetch('/api/client/bookings');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch bookings');
      }
      
      const data = await response.json();
      console.log("Bookings data received:", data);
      
      // Transform the data for the calendar
      const transformedBookings = data.map(party => ({
        id: party.id,
        name: party.name,
        date: party.date,
        startTime: party.startTime || 'Time not specified',
        location: party.city?.name || party.location || 'Location not specified',
        partyServices: party.partyServices || [],
        status: party.status || 'CONFIRMED'
      }));
      
      setBookings(transformedBookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.message || 'Failed to load your bookings');
      toast({
        title: 'Error',
        description: err.message || 'Failed to load your bookings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  // Load bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Calendar navigation functions
  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Calendar data preparation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Helper functions for formatting
  const formatBookingDate = (dateString) => {
    try {
      if (!dateString) return 'Date not specified';
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return 'Invalid date';
    }
  };

  // Booking card component
  const BookingCard = ({ booking }) => {
    const bookingDate = booking.date ? new Date(booking.date) : null;
    const isPastBooking = bookingDate && isPast(bookingDate);
    
    return (
      <Card variant="outline" mb={4} borderColor={isPastBooking ? "gray.200" : "brand.200"}>
        <CardHeader bg={isPastBooking ? "gray.50" : "brand.50"} py={2} px={4}>
          <HStack justify="space-between">
            <Heading size="sm">{booking.name || 'Unnamed Booking'}</Heading>
            <Badge colorScheme={isPastBooking ? "gray" : "brand"}>
              {isPastBooking ? 'Past' : 'Upcoming'}
            </Badge>
          </HStack>
        </CardHeader>
        <CardBody py={3} px={4}>
          <HStack spacing={4} mb={2}>
            <HStack>
              <CalendarIcon color="gray.500" />
              <Text fontSize="sm">{formatBookingDate(booking.date)}</Text>
            </HStack>
            <HStack>
              <TimeIcon color="gray.500" />
              <Text fontSize="sm">{booking.startTime || 'Time not specified'}</Text>
            </HStack>
          </HStack>
          
          <Divider my={2} />
          
          {booking.partyServices && booking.partyServices.length > 0 ? (
            <Box>
              <Text fontSize="xs" fontWeight="bold" mb={1}>Confirmed Services:</Text>
              <HStack flexWrap="wrap" spacing={1}>
                {booking.partyServices.map(partyService => (
                  <Badge key={partyService.id} colorScheme="green" variant="subtle" mr={1} mb={1}>
                    {partyService.service?.name || 'Service'}
                  </Badge>
                ))}
              </HStack>
            </Box>
          ) : (
            <Text fontSize="xs" color="gray.500">No confirmed services</Text>
          )}
          
          <Button 
            size="sm" 
            mt={3} 
            colorScheme="brand" 
            variant="outline"
            onClick={() => router.push(`/client/my-party?id=${booking.id}`)}
          >
            View Details
          </Button>
        </CardBody>
      </Card>
    );
  };

  // Render
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading as="h1" size="xl">Booking Calendar</Heading>
          <Text color="gray.600" mt={2}>
            View your confirmed and upcoming bookings
          </Text>
        </Box>

        {/* Loading state */}
        {loading ? (
          <Box textAlign="center" py={8}>
            <Spinner size="xl" color="brand.500" />
            <Text mt={4}>Loading your bookings...</Text>
          </Box>
        ) : error ? (
          <Box p={6} borderWidth="1px" borderRadius="md" textAlign="center" bg="red.50">
            <Text mb={4} color="red.500">{error}</Text>
            <Button 
              colorScheme="red" 
              size="sm" 
              onClick={fetchBookings}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <>
            {/* Calendar View */}
            <Box
              bg="white"
              borderRadius="lg"
              borderWidth="1px"
              p={4}
              boxShadow="sm"
            >
              <HStack justifyContent="space-between" mb={4}>
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

              <Grid
                templateColumns="repeat(7, 1fr)"
                gap={2}
                textAlign="center"
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <GridItem key={day}>
                    <Text fontWeight="bold" fontSize="sm">{day}</Text>
                  </GridItem>
                ))}

                {daysInMonth.map(date => {
                  // Get bookings for this day
                  const dateBookings = bookings.filter(booking => {
                    if (!booking.date) return false;
                    const bookingDate = new Date(booking.date);
                    return isSameDay(bookingDate, date);
                  });
                  
                  const hasBookings = dateBookings.length > 0;
                  
                  return (
                    <GridItem
                      key={date.toString()}
                      py={2}
                      px={1}
                      bg={isToday(date) ? 'brand.50' : 'white'}
                      borderWidth={1}
                      borderColor={hasBookings ? 'brand.300' : 'gray.100'}
                      borderRadius="md"
                      opacity={isSameMonth(date, currentDate) ? 1 : 0.4}
                      cursor={hasBookings ? 'pointer' : 'default'}
                      position="relative"
                      _hover={hasBookings ? { bg: 'brand.50' } : {}}
                      onClick={() => {
                        if (hasBookings) {
                          // You could implement a day detail view here
                          console.log("Bookings for", format(date, 'MMM d, yyyy'), dateBookings);
                        }
                      }}
                    >
                      <Text fontWeight={isToday(date) ? 'bold' : 'normal'}>
                        {format(date, 'd')}
                      </Text>
                      
                      {hasBookings && (
                        <Box 
                          w="80%" 
                          h="4px" 
                          bg="brand.500" 
                          borderRadius="full"
                          position="absolute"
                          bottom="2px"
                          left="10%"
                        />
                      )}
                    </GridItem>
                  );
                })}
              </Grid>
            </Box>

            {/* Daily Bookings Section */}
            <Box mt={8}>
              <Heading as="h3" size="md" mb={4}>
                Bookings for {format(currentDate, 'MMMM yyyy')}
              </Heading>
              
              {bookings.filter(booking => {
                if (!booking.date) return false;
                const bookingDate = new Date(booking.date);
                return isSameMonth(bookingDate, currentDate);
              }).length === 0 ? (
                <Box p={6} bg="gray.50" borderRadius="md" textAlign="center">
                  <Text>No bookings scheduled for this month.</Text>
                  <Button 
                    as={Link}
                    href="/client/my-bookings"
                    mt={4} 
                    colorScheme="brand" 
                    size="sm"
                  >
                    View All Bookings
                  </Button>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {bookings
                    .filter(booking => {
                      if (!booking.date) return false;
                      const bookingDate = new Date(booking.date);
                      return isSameMonth(bookingDate, currentDate);
                    })
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(booking => (
                      <Card key={booking.id} variant="outline">
                        <CardHeader bg="brand.50" py={2} px={4}>
                          <HStack justify="space-between">
                            <Heading size="sm">{booking.name}</Heading>
                            <Badge>{formatBookingDate(booking.date)}</Badge>
                          </HStack>
                        </CardHeader>
                        <CardBody py={3} px={4}>
                          <HStack spacing={4} mb={2}>
                            <HStack>
                              <CalendarIcon color="gray.500" />
                              <Text fontSize="sm">{formatBookingDate(booking.date)}</Text>
                            </HStack>
                            <HStack>
                              <TimeIcon color="gray.500" />
                              <Text fontSize="sm">{booking.startTime || 'Time not specified'}</Text>
                            </HStack>
                          </HStack>
                          
                          <Divider my={2} />
                          
                          {booking.partyServices && booking.partyServices.length > 0 ? (
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" mb={1}>Confirmed Services:</Text>
                              <HStack flexWrap="wrap" spacing={1}>
                                {booking.partyServices.map(partyService => (
                                  <Badge key={partyService.id} colorScheme="green" variant="subtle" mr={1} mb={1}>
                                    {partyService.service?.name || 'Service'}
                                  </Badge>
                                ))}
                              </HStack>
                            </Box>
                          ) : (
                            <Text fontSize="xs" color="gray.500">No confirmed services</Text>
                          )}
                          
                          <Button 
                            size="sm" 
                            mt={3} 
                            colorScheme="brand" 
                            variant="outline"
                            onClick={() => router.push(`/client/my-party?id=${booking.id}`)}
                          >
                            View Details
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                </SimpleGrid>
              )}
            </Box>
          </>
        )}
      </VStack>
    </Container>
  );
}
