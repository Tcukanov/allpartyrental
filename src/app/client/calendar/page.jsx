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
  Tooltip,
  Divider,
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

  // Get bookings for a specific day
  const getBookingsForDay = (day) => {
    return bookings.filter(booking => {
      if (!booking.date) return false;
      const bookingDate = new Date(booking.date);
      return isSameDay(bookingDate, day);
    });
  };

  // Handle booking click
  const handleBookingClick = (booking) => {
    router.push(`/client/my-party?id=${booking.id}`);
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
          <Spinner size="xl" color="brand.500" />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">My Calendar</Heading>
          <Text color="gray.600" mt={2}>
            View and manage your scheduled parties and events
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
              colorScheme="brand"
              onClick={() => router.push('/client/create-party')}
            >
              Plan New Party
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
              const dayBookings = getBookingsForDay(day);

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
                  {isCurrentDay && (
                    <Badge
                      colorScheme="brand"
                      position="absolute"
                      top={1}
                      right={1}
                    >
                      Today
                    </Badge>
                  )}
                  
                  {/* Bookings for this day */}
                  <VStack align="stretch" mt={2} spacing={1}>
                    {dayBookings.length > 0 && dayBookings.slice(0, 2).map(booking => (
                      <Tooltip key={booking.id} label={`${booking.name} - ${booking.startTime}`} placement="top">
                        <Badge 
                          p={1} 
                          borderRadius="md" 
                          colorScheme={isPast(new Date(booking.date)) ? 'gray' : 'brand'}
                          cursor="pointer"
                          noOfLines={1}
                          onClick={() => handleBookingClick(booking)}
                        >
                          {booking.name}
                        </Badge>
                      </Tooltip>
                    ))}
                    {dayBookings.length > 2 && (
                      <Badge 
                        p={1} 
                        borderRadius="md" 
                        bg="gray.200"
                        color="gray.700"
                        cursor="pointer"
                        textAlign="center"
                        onClick={() => {
                          toast({
                            title: `${dayBookings.length} Events`,
                            description: `${dayBookings.length} events scheduled for ${format(day, 'MMMM d, yyyy')}`,
                            status: 'info',
                            duration: 3000,
                            isClosable: true,
                          });
                        }}
                      >
                        +{dayBookings.length - 2} more
                      </Badge>
                    )}
                  </VStack>
                </GridItem>
              );
            })}
          </Grid>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Upcoming Parties</Heading>
          {upcomingBookings.length === 0 ? (
            <Box p={4} borderWidth="1px" borderRadius="md" textAlign="center">
              <Text>No upcoming parties scheduled.</Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {upcomingBookings
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(booking => (
                  <Box
                    key={booking.id}
                    p={4}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    _hover={{ borderColor: 'brand.500' }}
                    cursor="pointer"
                    onClick={() => handleBookingClick(booking)}
                  >
                    <HStack justify="space-between">
                      <Box>
                        <Text fontWeight="bold">{booking.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {formatBookingDate(booking.date)} • {booking.startTime}
                        </Text>
                        <Text fontSize="sm" color="gray.600">Location: {booking.location}</Text>
                        
                        {booking.partyServices && booking.partyServices.length > 0 && (
                          <HStack mt={2} flexWrap="wrap">
                            {booking.partyServices.map(partyService => (
                              <Badge key={partyService.id} colorScheme="green" variant="subtle">
                                {partyService.service?.name || 'Service'}
                              </Badge>
                            ))}
                          </HStack>
                        )}
                      </Box>
                      <Badge colorScheme="brand">
                        {booking.status}
                      </Badge>
                    </HStack>
                  </Box>
                ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Container>
  );
}
