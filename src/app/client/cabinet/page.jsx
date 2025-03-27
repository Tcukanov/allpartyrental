"use client";

import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, Tabs, TabList, TabPanels, Tab, TabPanel, SimpleGrid, Card, CardBody, Flex, Avatar, Badge, Button, Stat, StatLabel, StatNumber, StatHelpText, useToast, HStack, Icon } from '@chakra-ui/react';
import { CalendarIcon, PartyIcon, HistoryIcon, SettingsIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Mock data for client dashboard
const mockParties = [
  {
    id: 'party1',
    name: "Emma's 8th Birthday",
    date: '2025-04-15',
    status: 'PUBLISHED',
    location: 'New York',
    servicesCount: 3,
    offersCount: 5,
    approvedOffersCount: 1
  },
  {
    id: 'party2',
    name: "Anniversary Celebration",
    date: '2025-05-20',
    status: 'IN_PROGRESS',
    location: 'New York',
    servicesCount: 5,
    offersCount: 8,
    approvedOffersCount: 4
  },
  {
    id: 'party3',
    name: "Graduation Party",
    date: '2025-06-10',
    status: 'DRAFT',
    location: 'New York',
    servicesCount: 2,
    offersCount: 0,
    approvedOffersCount: 0
  }
];

const mockPastParties = [
  {
    id: 'party4',
    name: "New Year's Eve Party",
    date: '2024-12-31',
    status: 'COMPLETED',
    location: 'New York',
    servicesCount: 4,
    totalCost: 1250,
    rating: 4.8
  },
  {
    id: 'party5',
    name: "Summer BBQ",
    date: '2024-08-15',
    status: 'COMPLETED',
    location: 'New York',
    servicesCount: 3,
    totalCost: 850,
    rating: 4.5
  }
];

const mockBirthdays = [
  {
    id: 'child1',
    name: 'Emma',
    birthdate: '2017-04-15',
    age: 8
  },
  {
    id: 'child2',
    name: 'Noah',
    birthdate: '2019-07-22',
    age: 6
  }
];

const mockNotifications = [
  {
    id: 'notif1',
    type: 'NEW_OFFER',
    title: 'New Offer Received',
    content: 'You have received a new offer for Decoration in your "Emma\'s 8th Birthday" party',
    isRead: false,
    createdAt: '2025-03-19T14:30:00Z'
  },
  {
    id: 'notif2',
    type: 'MESSAGE',
    title: 'New Message',
    content: 'You have a new message from Elegant Events regarding your party',
    isRead: true,
    createdAt: '2025-03-18T10:15:00Z'
  }
];

export default function ClientCabinetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [activeParties, setActiveParties] = useState([]);
  const [pastParties, setPastParties] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/client/cabinet');
      return;
    }
    
    // Check if user is a client
    if (status === 'authenticated' && session.user.role !== 'CLIENT') {
      toast({
        title: 'Access denied',
        description: 'Only clients can access this page',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push('/');
      return;
    }
    
    // Fetch data
    const fetchData = async () => {
      try {
        // In a real application, we would make API calls here
        // const partiesResponse = await fetch('/api/parties');
        // const birthdaysResponse = await fetch('/api/client/birthdays');
        // const notificationsResponse = await fetch('/api/notifications');
        
        // Simulate API calls with mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setActiveParties(mockParties);
        setPastParties(mockPastParties);
        setBirthdays(mockBirthdays);
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, session, router, toast]);
  
  const handleCreateParty = () => {
    router.push('/client/create-party');
  };
  
  const handleRepeatParty = (partyId) => {
    // In a real application, we would make an API call to copy the party
    toast({
      title: 'Party copied',
      description: 'The party has been copied. You can now edit it.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    router.push('/client/create-party');
  };
  
  const handleOrganizePartyForChild = (childId) => {
    // In a real application, we would pre-fill the party form with child's info
    router.push('/client/create-party');
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'gray';
      case 'PUBLISHED':
        return 'blue';
      case 'IN_PROGRESS':
        return 'orange';
      case 'COMPLETED':
        return 'green';
      default:
        return 'gray';
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const calculateDaysUntilBirthday = (birthdate) => {
    const today = new Date();
    const birthdateObj = new Date(birthdate);
    
    // Set birthday to current year
    const nextBirthday = new Date(
      today.getFullYear(),
      birthdateObj.getMonth(),
      birthdateObj.getDate()
    );
    
    // If birthday has passed this year, set to next year
    if (today > nextBirthday) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    // Calculate days difference
    const diffTime = nextBirthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Client Cabinet</Heading>
          <Text color="gray.600" mt={2}>
            Manage your account and party services
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card cursor="pointer" onClick={() => router.push('/client/create-party')}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Icon as={PartyIcon} w={8} h={8} color="brand.500" />
                <Text fontWeight="bold">Create New Party</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Start planning your next event
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
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
          
          <Card cursor="pointer" onClick={() => router.push('/client/party-history')}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Icon as={HistoryIcon} w={8} h={8} color="brand.500" />
                <Text fontWeight="bold">Party History</Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  View your past events
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