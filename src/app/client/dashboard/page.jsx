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
  RepeatIcon 
} from '@chakra-ui/icons';
import { MdCelebration, MdPending, MdHistory, MdEvent } from 'react-icons/md';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

// Mock data for calendar events
const mockCalendarEvents = [
  {
    id: 1,
    childName: 'Emily',
    birthDate: new Date('2024-05-15'),
  },
  {
    id: 2,
    childName: 'Jacob',
    birthDate: new Date('2024-07-22'),
  },
];

// Mock data for parties
const mockParties = [
  {
    id: 1,
    name: 'Emily\'s 7th Birthday',
    date: new Date('2024-05-15'),
    status: 'PUBLISHED',
    location: 'New York',
    servicesCount: 5,
    confirmedServices: 3,
  },
  {
    id: 2,
    name: 'Summer Graduation Party',
    date: new Date('2024-06-10'),
    status: 'DRAFT',
    location: 'New York',
    servicesCount: 0,
    confirmedServices: 0,
  },
  {
    id: 3,
    name: 'Anniversary Celebration',
    date: new Date('2024-08-05'),
    status: 'IN_PROGRESS',
    location: 'Los Angeles',
    servicesCount: 4,
    confirmedServices: 4,
  },
];

// Mock data for past parties
const mockPastParties = [
  {
    id: 101,
    name: 'New Year\'s Eve Party',
    date: new Date('2023-12-31'),
    status: 'COMPLETED',
    location: 'New York',
    totalCost: 2450.75,
    servicesCount: 6,
  },
  {
    id: 102,
    name: 'Valentine\'s Day Dinner',
    date: new Date('2024-02-14'),
    status: 'COMPLETED',
    location: 'New York',
    totalCost: 850.25,
    servicesCount: 3,
  },
];

// Mock data for statistics
const mockStatistics = {
  totalPartiesOrganized: 7,
  totalSpent: 5250.50,
  upcomingParties: 3,
  favoriteServiceCategory: 'Decoration',
};

export default function ClientDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [activeParties, setActiveParties] = useState([]);
  const [pastParties, setPastParties] = useState([]);
  const [statistics, setStatistics] = useState({});
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (sessionStatus !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch data from the API
        // For now, we'll use mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCalendarEvents(mockCalendarEvents);
        setActiveParties(mockParties);
        setPastParties(mockPastParties);
        setStatistics(mockStatistics);
      } catch (error) {
        console.error('Fetch dashboard data error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          status: 'error',
          duration: 3000,
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
    return format(date, 'MMMM d, yyyy');
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
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" h="60vh">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        </Container>
      </MainLayout>
    );
  }
  
  if (!session) {
    router.push('/auth/signin');
    return null;
  }
  
  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="lg">Welcome, {session.user.name}!</Heading>
            <Text color="gray.600">Manage your parties and events in one place.</Text>
          </Box>
          
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="brand" 
            onClick={() => router.push('/client/create-party')}
          >
            Create New Party
          </Button>
        </Flex>
        
        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Parties Organized</StatLabel>
                <StatNumber>{statistics.totalPartiesOrganized || 0}</StatNumber>
                <StatHelpText>
                  <Icon as={MdHistory} mr={1} />
                  Total parties
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Spent</StatLabel>
                <StatNumber>${statistics.totalSpent?.toFixed(2) || '0.00'}</StatNumber>
                <StatHelpText>
                  <Icon as={MdEvent} mr={1} />
                  All-time spending
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Upcoming Parties</StatLabel>
                <StatNumber>{statistics.upcomingParties || 0}</StatNumber>
                <StatHelpText>
                  <CalendarIcon mr={1} />
                  Next 3 months
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Favorite Category</StatLabel>
                <StatNumber>{statistics.favoriteServiceCategory || 'N/A'}</StatNumber>
                <StatHelpText>
                  <StarIcon mr={1} />
                  Most booked service
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
        
        {/* Active Parties */}
        <Box mb={8}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" display="flex" alignItems="center">
              <Icon as={MdCelebration} mr={2} color="brand.500" />
              Your Active Parties
            </Heading>
            
            <Button 
              variant="link" 
              colorScheme="brand" 
              rightIcon={<RepeatIcon />}
              onClick={() => router.push('/client/my-parties')}
            >
              View All
            </Button>
          </Flex>
          
          {activeParties.length === 0 ? (
            <Card>
              <CardBody textAlign="center" py={8}>
                <VStack spacing={4}>
                  <Icon as={MdCelebration} boxSize={12} color="gray.300" />
                  <Heading size="md">No Active Parties</Heading>
                  <Text color="gray.600">
                    You don't have any active parties yet. Create your first party to get started!
                  </Text>
                  <Button 
                    colorScheme="brand" 
                    leftIcon={<AddIcon />}
                    onClick={() => router.push('/client/create-party')}
                  >
                    Create New Party
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {activeParties.map(party => (
                <Card key={party.id}>
                  <CardHeader pb={0}>
                    <Flex justify="space-between" align="start">
                      <Heading size="md" noOfLines={1}>{party.name}</Heading>
                      <Badge colorScheme={getStatusColor(party.status)}>
                        {party.status.replace('_', ' ')}
                      </Badge>
                    </Flex>
                  </CardHeader>
                  
                  <CardBody>
                    <VStack spacing={2} align="start">
                      <HStack>
                        <CalendarIcon color="brand.500" />
                        <Text>{formatDate(party.date)}</Text>
                      </HStack>
                      
                      <HStack>
                        <Icon as={MdPending} color="brand.500" />
                        <Text>
                          {party.confirmedServices} of {party.servicesCount} services confirmed
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <CheckCircleIcon color={
                          party.servicesCount > 0 && party.confirmedServices === party.servicesCount 
                            ? 'green.500' 
                            : 'gray.500'
                        } />
                        <Text>
                          {party.servicesCount > 0 && party.confirmedServices === party.servicesCount 
                            ? 'All set!' 
                            : 'Waiting for confirmations'
                          }
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                  
                  <Divider />
                  
                  <CardFooter>
                    <Button 
                      colorScheme="brand" 
                      variant="outline" 
                      width="full"
                      onClick={() => router.push(`/client/my-party?id=${party.id}`)}
                    >
                      Manage Party
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
        
        {/* Calendar */}
        <Box mb={8}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" display="flex" alignItems="center">
              <CalendarIcon mr={2} color="brand.500" />
              Upcoming Celebrations
            </Heading>
            
            <Button 
              variant="link" 
              colorScheme="brand" 
              rightIcon={<AddIcon />}
              onClick={() => router.push('/client/calendar')}
            >
              Manage Calendar
            </Button>
          </Flex>
          
          {calendarEvents.length === 0 ? (
            <Card>
              <CardBody textAlign="center" py={8}>
                <VStack spacing={4}>
                  <CalendarIcon boxSize={12} color="gray.300" />
                  <Heading size="md">No Upcoming Events</Heading>
                  <Text color="gray.600">
                    You don't have any saved celebrations yet. Add birthdays and other special dates to your calendar.
                  </Text>
                  <Button 
                    colorScheme="brand" 
                    leftIcon={<AddIcon />}
                    onClick={() => router.push('/client/calendar')}
                  >
                    Add to Calendar
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {calendarEvents.map(event => {
                const daysUntil = getDaysUntil(event.birthDate);
                
                return (
                  <Card key={event.id}>
                    <CardBody>
                      <VStack spacing={3} align="start">
                        <Heading size="md">{event.childName}'s Birthday</Heading>
                        
                        <HStack>
                          <CalendarIcon color="brand.500" />
                          <Text>{formatDate(event.birthDate)}</Text>
                        </HStack>
                        
                        <HStack>
                          <TimeIcon color="brand.500" />
                          <Text>
                            {daysUntil} day{daysUntil !== 1 ? 's' : ''} away
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                    
                    <Divider />
                    
                    <CardFooter>
                      <Button 
                        colorScheme="brand" 
                        width="full"
                        leftIcon={<AddIcon />}
                        onClick={() => router.push('/client/create-party')}
                      >
                        Plan a Party
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Box>
        
        {/* Past Parties */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" display="flex" alignItems="center">
              <Icon as={MdHistory} mr={2} color="brand.500" />
              Party History
            </Heading>
            
            <Button 
              variant="link" 
              colorScheme="brand" 
              rightIcon={<RepeatIcon />}
              onClick={() => router.push('/client/party-history')}
            >
              View All
            </Button>
          </Flex>
          
          {pastParties.length === 0 ? (
            <Card>
              <CardBody textAlign="center" py={8}>
                <VStack spacing={4}>
                  <Icon as={MdHistory} boxSize={12} color="gray.300" />
                  <Heading size="md">No Past Parties</Heading>
                  <Text color="gray.600">
                    Your party history will appear here once you've completed events.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {pastParties.map(party => (
                <Card key={party.id}>
                  <CardBody>
                    <Flex justify="space-between">
                      <VStack spacing={2} align="start">
                        <Heading size="md" noOfLines={1}>{party.name}</Heading>
                        
                        <HStack>
                          <CalendarIcon color="brand.500" />
                          <Text>{formatDate(party.date)}</Text>
                        </HStack>
                        
                        <HStack>
                          <Icon as={MdCelebration} color="brand.500" />
                          <Text>{party.servicesCount} services</Text>
                        </HStack>
                      </VStack>
                      
                      <VStack align="end">
                        <Badge colorScheme="green">Completed</Badge>
                        <Heading size="md" color="brand.600">${party.totalCost.toFixed(2)}</Heading>
                      </VStack>
                    </Flex>
                  </CardBody>
                  
                  <Divider />
                  
                  <CardFooter>
                    <Button 
                      colorScheme="brand" 
                      variant="outline" 
                      width="full"
                      onClick={() => router.push(`/client/party-details?id=${party.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Container>
    </MainLayout>
  );
}