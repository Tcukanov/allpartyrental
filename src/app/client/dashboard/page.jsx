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
          
          <Card cursor="pointer" onClick={() => router.push('/client/approved-services')}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Icon as={CheckCircleIcon} w={8} h={8} color="green.500" />
                <Text fontWeight="bold">Approved Services</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  View your approved service requests
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
          <VStack spacing={4} align="stretch">
            <Card>
              <CardBody>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="bold">Birthday Party</Text>
                    <Text fontSize="sm" color="gray.600">Created on March 15, 2024</Text>
                  </Box>
                  <Badge colorScheme="brand">In Progress</Badge>
                </Flex>
              </CardBody>
            </Card>
            
            <Card>
                    <CardBody>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="bold">Wedding Reception</Text>
                    <Text fontSize="sm" color="gray.600">Created on March 10, 2024</Text>
        </Box>
                  <Badge colorScheme="green">Completed</Badge>
          </Flex>
              </CardBody>
            </Card>
                      </VStack>
        </Box>
      </VStack>
      </Container>
  );
}