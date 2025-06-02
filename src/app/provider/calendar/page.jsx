"use client";

import { useState, useEffect } from 'react';
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
  Tooltip,
  Spinner,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, AddIcon, InfoIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { useSession } from 'next-auth/react';
import ProviderLayout from '../components/ProviderLayout';

export default function ProviderCalendarPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: session, status } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'PROVIDER') {
      toast({
        title: 'Access Denied',
        description: 'Only providers can access this page',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
    } else if (status === 'authenticated' && session?.user?.role === 'PROVIDER') {
      fetchEvents();
    }
  }, [status, session, router, toast]);

  // Fetch provider's events (approved offers)
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Fetch approved offers from the API
      const response = await fetch('/api/provider/requests?status=APPROVED');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch approved events: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform offers into calendar events
        const calendarEvents = data.data
          .filter(offer => offer.partyService?.party?.date) // Only include offers with valid party dates
          .map(offer => ({
            id: offer.id,
            title: offer.service?.name || 'Service Booking',
            date: new Date(offer.partyService?.party?.date),
            status: 'CONFIRMED',
            client: offer.client?.name || 'Client',
            location: offer.partyService?.party?.city?.name || '',
            partyId: offer.partyService?.partyId,
            serviceId: offer.serviceId
          }));
        
        setEvents(calendarEvents);
      } else {
        // If no data or API error, set empty events
        setEvents([]);
        console.error('API returned unsuccessful response:', data.error);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your scheduled events',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleAddService = () => {
    router.push('/provider/services/create');
  };

  // Navigate to event details
  const handleEventClick = (event) => {
    if (event.partyId) {
      router.push(`/provider/requests?partyId=${event.partyId}`);
    } else if (event.id) {
      router.push(`/provider/requests?offerId=${event.id}`);
    } else {
      router.push('/provider/requests');
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(event => 
      isSameDay(event.date, day)
    );
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
          <Spinner size="xl" color="brand.500" />
        </Box>
      </Container>
    );
  }

  return (
    <ProviderLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl">Provider Calendar</Heading>
            <Text color="gray.600" mt={2}>
              Manage your scheduled services and appointments
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
                onClick={handleAddService}
              >
                Add Service
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
                const dayEvents = getEventsForDay(day);

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
                    
                    {/* Events for this day */}
                    <VStack align="stretch" mt={2} spacing={1}>
                      {dayEvents.length > 0 && dayEvents.slice(0, 2).map(event => (
                        <Tooltip key={event.id} label={`${event.title} - ${event.client}`} placement="top">
                          <Badge 
                            p={1} 
                            borderRadius="md" 
                            colorScheme={event.status === 'CONFIRMED' ? 'green' : 'yellow'}
                            cursor="pointer"
                            noOfLines={1}
                            onClick={() => handleEventClick(event)}
                          >
                            {event.title}
                          </Badge>
                        </Tooltip>
                      ))}
                      {dayEvents.length > 2 && (
                        <Badge 
                          p={1} 
                          borderRadius="md" 
                          bg="gray.200"
                          color="gray.700"
                          cursor="pointer"
                          textAlign="center"
                          onClick={() => {
                            toast({
                              title: `${dayEvents.length} Events`,
                              description: `${dayEvents.length} events scheduled for ${format(day, 'MMMM d, yyyy')}`,
                              status: 'info',
                              duration: 3000,
                              isClosable: true,
                            });
                          }}
                        >
                          +{dayEvents.length - 2} more
                        </Badge>
                      )}
                    </VStack>
                  </GridItem>
                );
              })}
            </Grid>
          </Box>

          <Box>
            <Heading size="md" mb={4}>Upcoming Services</Heading>
            {events.length === 0 ? (
              <Box p={4} borderWidth="1px" borderRadius="md" textAlign="center">
                <Text>No upcoming services scheduled.</Text>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {events
                  .filter(event => event.date >= new Date())
                  .sort((a, b) => a.date - b.date)
                  .map(event => (
                    <Box
                      key={event.id}
                      p={4}
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      _hover={{ borderColor: 'brand.500' }}
                      cursor="pointer"
                      onClick={() => handleEventClick(event)}
                    >
                      <HStack justify="space-between">
                        <Box>
                          <Text fontWeight="bold">{event.title}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {format(event.date, 'MMMM d, yyyy')} • {event.location}
                          </Text>
                          <Text fontSize="sm" color="gray.600">Client: {event.client}</Text>
                        </Box>
                        <Badge colorScheme={event.status === 'CONFIRMED' ? 'green' : 'yellow'}>
                          {event.status}
                        </Badge>
                      </HStack>
                    </Box>
                  ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </ProviderLayout>
  );
} 