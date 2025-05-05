"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Flex, 
  Button, 
  SimpleGrid, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Divider, 
  Badge, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  Icon, 
  Image,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  AddIcon, 
  CalendarIcon, 
  StarIcon, 
  CheckCircleIcon, 
  TimeIcon, 
  RepeatIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import { MdCelebration, MdPending, MdHistory, MdEvent } from 'react-icons/md';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ClientDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [activeParties, setActiveParties] = useState([]);
  const [pastParties, setPastParties] = useState([]);
  const [statistics, setStatistics] = useState({
    totalPartiesOrganized: 0,
    totalSpent: 0,
    upcomingParties: 0,
    favoriteServiceCategory: ''
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (sessionStatus !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        
        // Fetch calendar events
        const calendarResponse = await fetch('/api/client/calendar');
        if (!calendarResponse.ok) throw new Error('Failed to fetch calendar data');
        const calendarData = await calendarResponse.json();
        setCalendarEvents(calendarData);
        
        // Fetch active parties
        const activePartiesResponse = await fetch('/api/client/parties?status=active');
        if (!activePartiesResponse.ok) throw new Error('Failed to fetch active parties');
        const activePartiesData = await activePartiesResponse.json();
        setActiveParties(activePartiesData);
        
        // Fetch past parties
        const pastPartiesResponse = await fetch('/api/client/parties?status=completed');
        if (!pastPartiesResponse.ok) throw new Error('Failed to fetch past parties');
        const pastPartiesData = await pastPartiesResponse.json();
        setPastParties(pastPartiesData);
        
        // Fetch statistics
        const statisticsResponse = await fetch('/api/client/statistics');
        if (statisticsResponse.ok) {
          const statisticsData = await statisticsResponse.json();
          setStatistics(statisticsData);
        }
      } catch (error) {
        console.error('Fetch dashboard data error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data: ' + error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [sessionStatus, toast]);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'MMMM d, yyyy');
  };
  
  // Get color for party status badge
  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'PUBLISHED': return 'blue';
      case 'IN_PROGRESS': return 'orange';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };
  
  // Calculate days until a date
  const getDaysUntil = (date) => {
    if (!date) return 0;
    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  if (sessionStatus === 'loading' || isLoading) {
    return (
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" h="60vh">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        </Container>
    );
  }
  
  if (!session) {
    router.push('/auth/signin');
    return null;
  }
  
  return (
      <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Client Dashboard</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
          <Card cursor="pointer" onClick={() => router.push('/client/my-party')}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Icon as={CalendarIcon} w={8} h={8} color="brand.500" />
                <Text fontWeight="bold">My Parties</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  View and manage your parties
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card cursor="pointer" onClick={() => router.push('/client/transactions')}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Icon as={CheckCircleIcon} w={8} h={8} color="green.500" />
                <Text fontWeight="bold">My Transactions</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  View your booked services
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card cursor="pointer" onClick={() => router.push('/client/profile')}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Icon as={SettingsIcon} w={8} h={8} color="brand.500" />
                <Text fontWeight="bold">Profile Settings</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Manage your account
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
        
        {/* Recent Activity Section */}
        <Box>
          <Heading as="h2" size="lg" mb={6}>Recent Activity</Heading>
          
          {activeParties.length === 0 && pastParties.length === 0 && calendarEvents.length === 0 ? (
            <Card p={6} textAlign="center">
              <VStack spacing={4}>
                <Icon as={MdEvent} w={12} h={12} color="gray.300" />
                <Text fontSize="lg" fontWeight="medium">No Recent Activity</Text>
                <Text color="gray.600">
                  You haven't created any parties or events yet.
                </Text>
                <Button
                  mt={4}
                  colorScheme="brand"
                  leftIcon={<AddIcon />}
                  onClick={() => router.push('/client/new-party')}
                >
                  Create Your First Party
                </Button>
              </VStack>
            </Card>
          ) : (
            <VStack spacing={4} align="stretch">
              {activeParties.length > 0 && (
                <Card>
                  <CardHeader>
                    <HStack>
                      <Icon as={MdCelebration} color="purple.500" />
                      <Text fontWeight="bold">Upcoming Parties</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {activeParties.slice(0, 3).map((party) => (
                        <Box key={party.id} p={3} borderWidth="1px" borderRadius="md">
                          <HStack justify="space-between" mb={2}>
                            <Heading as="h4" size="sm">{party.name}</Heading>
                            <Badge colorScheme={getStatusColor(party.status)}>
                              {party.status}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" mb={2}>{formatDate(party.date)}</Text>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">
                              {party.cityId || party.location}
                            </Text>
                            <Button
                              as={Link}
                              href={`/client/my-party?id=${party.id}`}
                              size="xs"
                              colorScheme="brand"
                            >
                              View Details
                            </Button>
                          </HStack>
                        </Box>
                      ))}
                      
                      {activeParties.length > 3 && (
                        <Button
                          as={Link}
                          href="/client/my-party"
                          variant="link"
                          colorScheme="brand"
                          alignSelf="center"
                        >
                          View All Parties
                        </Button>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}
              
              {calendarEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <HStack>
                      <Icon as={CalendarIcon} color="blue.500" />
                      <Text fontWeight="bold">Upcoming Events</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {calendarEvents.slice(0, 3).map((event) => (
                        <Box key={event.id} p={3} borderWidth="1px" borderRadius="md">
                          <HStack justify="space-between" mb={2}>
                            <Heading as="h4" size="sm">{event.childName}'s Birthday</Heading>
                            <Badge colorScheme="blue">
                              {getDaysUntil(event.birthDate)} days left
                            </Badge>
                          </HStack>
                          <Text fontSize="sm">{formatDate(event.birthDate)}</Text>
                        </Box>
                      ))}
                      
                      {calendarEvents.length > 3 && (
                        <Button
                          as={Link}
                          href="/client/calendar"
                          variant="link"
                          colorScheme="brand"
                          alignSelf="center"
                        >
                          View All Events
                        </Button>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}
              
              {pastParties.length > 0 && (
                <Card>
                  <CardHeader>
                    <HStack>
                      <Icon as={MdHistory} color="gray.500" />
                      <Text fontWeight="bold">Past Parties</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {pastParties.slice(0, 3).map((party) => (
                        <Box key={party.id} p={3} borderWidth="1px" borderRadius="md">
                          <HStack justify="space-between" mb={2}>
                            <Heading as="h4" size="sm">{party.name}</Heading>
                            <Badge colorScheme="green">Completed</Badge>
                          </HStack>
                          <Text fontSize="sm" mb={2}>{formatDate(party.date)}</Text>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">
                              {party.cityId || party.location}
                            </Text>
                            <Button
                              as={Link}
                              href={`/client/my-party?id=${party.id}`}
                              size="xs"
                              colorScheme="brand"
                            >
                              View Details
                            </Button>
                          </HStack>
                        </Box>
                      ))}
                      
                      {pastParties.length > 3 && (
                        <Button
                          as={Link}
                          href="/client/my-party"
                          variant="link"
                          colorScheme="brand"
                          alignSelf="center"
                        >
                          View All Parties
                        </Button>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          )}
        </Box>
        
        {/* Quick Actions */}
        <Box>
          <Heading as="h2" size="lg" mb={6}>Quick Actions</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <Button
              as={Link}
              href="/client/new-party"
              height="auto"
              p={6}
              colorScheme="brand"
              variant="outline"
              leftIcon={<AddIcon boxSize={5} />}
            >
              <VStack spacing={2} textAlign="center">
                <Text fontWeight="bold">Create New Party</Text>
                <Text fontSize="sm">Plan your next celebration</Text>
              </VStack>
            </Button>
            
            <Button
              as={Link}
              href="/services"
              height="auto"
              p={6}
              colorScheme="blue"
              variant="outline"
              leftIcon={<StarIcon boxSize={5} />}
            >
              <VStack spacing={2} textAlign="center">
                <Text fontWeight="bold">Browse Services</Text>
                <Text fontSize="sm">Find vendors for your event</Text>
              </VStack>
            </Button>
            
            <Button
              as={Link}
              href="/client/calendar/add"
              height="auto"
              p={6}
              colorScheme="purple"
              variant="outline"
              leftIcon={<CalendarIcon boxSize={5} />}
            >
              <VStack spacing={2} textAlign="center">
                <Text fontWeight="bold">Add to Calendar</Text>
                <Text fontSize="sm">Remember important dates</Text>
              </VStack>
            </Button>
          </SimpleGrid>
        </Box>
      </VStack>
    </Container>
  );
}