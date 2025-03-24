"use client";

import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, Tabs, TabList, TabPanels, Tab, TabPanel, SimpleGrid, Card, CardBody, Flex, Avatar, Badge, Button, Stat, StatLabel, StatNumber, StatHelpText, useToast } from '@chakra-ui/react';
import MainLayout from '@/components/layout/MainLayout';
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
    <MainLayout>
      <Container maxW="1200px" py={8}>
        <VStack spacing={8} align="stretch">
          <Flex justify="space-between" align="center" wrap="wrap">
            <Box>
              <Heading as="h1" size="xl" mb={2}>
                Client Cabinet
              </Heading>
              <Text color="gray.600">
                Manage your parties, view your calendar, and track your history
              </Text>
            </Box>
            
            <Button 
              colorScheme="brand" 
              size="lg"
              onClick={handleCreateParty}
              mt={{ base: 4, md: 0 }}
            >
              Create New Party
            </Button>
          </Flex>
          
          <Tabs colorScheme="brand" isLazy>
            <TabList>
              <Tab>Dashboard</Tab>
              <Tab>My Parties</Tab>
              <Tab>Calendar</Tab>
              <Tab>History</Tab>
              <Tab>Profile</Tab>
            </TabList>
            
            <TabPanels>
              {/* Dashboard Tab */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Active Parties</StatLabel>
                        <StatNumber>{activeParties.length}</StatNumber>
                        <StatHelpText>
                          {activeParties.filter(p => p.status === 'IN_PROGRESS').length} in progress
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Completed Parties</StatLabel>
                        <StatNumber>{pastParties.length}</StatNumber>
                        <StatHelpText>
                          Total events organized
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Total Spent</StatLabel>
                        <StatNumber>
                          ${pastParties.reduce((sum, party) => sum + party.totalCost, 0)}
                        </StatNumber>
                        <StatHelpText>
                          Across all parties
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                  <Box>
                    <Heading as="h3" size="md" mb={4}>
                      Upcoming Parties
                    </Heading>
                    
                    {activeParties.length > 0 ? (
                      <VStack spacing={4} align="stretch">
                        {activeParties.map(party => (
                          <Card key={party.id}>
                            <CardBody>
                              <Flex justify="space-between" align="center" wrap="wrap">
                                <Box>
                                  <Heading as="h4" size="sm" mb={1}>
                                    {party.name}
                                  </Heading>
                                  <Text fontSize="sm" color="gray.600">
                                    {formatDate(party.date)} • {party.location}
                                  </Text>
                                  <Badge colorScheme={getStatusColor(party.status)} mt={2}>
                                    {party.status.replace('_', ' ')}
                                  </Badge>
                                </Box>
                                
                                <Link href={`/client/parties/${party.id}`} passHref>
                                  <Button size="sm" colorScheme="brand" variant="outline">
                                    View Details
                                  </Button>
                                </Link>
                              </Flex>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    ) : (
                      <Card>
                        <CardBody>
                          <Text color="gray.600" textAlign="center">
                            No upcoming parties. Create one now!
                          </Text>
                        </CardBody>
                      </Card>
                    )}
                  </Box>
                  
                  <Box>
                    <Heading as="h3" size="md" mb={4}>
                      Upcoming Birthdays
                    </Heading>
                    
                    {birthdays.length > 0 ? (
                      <VStack spacing={4} align="stretch">
                        {birthdays.map(child => {
                          const daysUntil = calculateDaysUntilBirthday(child.birthdate);
                          return (
                            <Card key={child.id}>
                              <CardBody>
                                <Flex justify="space-between" align="center" wrap="wrap">
                                  <Flex align="center">
                                    <Avatar size="sm" name={child.name} mr={3} />
                                    <Box>
                                      <Heading as="h4" size="sm" mb={1}>
                                        {child.name}
                                      </Heading>
                                      <Text fontSize="sm" color="gray.600">
                                        Turning {child.age + 1} in {daysUntil} days
                                      </Text>
                                    </Box>
                                  </Flex>
                                  
                                  <Button 
                                    size="sm" 
                                    colorScheme="brand"
                                    onClick={() => handleOrganizePartyForChild(child.id)}
                                  >
                                    Organize Party
                                  </Button>
                                </Flex>
                              </CardBody>
                            </Card>
                          );
                        })}
                      </VStack>
                    ) : (
                      <Card>
                        <CardBody>
                          <Text color="gray.600" textAlign="center">
                            No birthdays added yet. Add them in your profile.
                          </Text>
                        </CardBody>
                      </Card>
                    )}
                  </Box>
                </SimpleGrid>
              </TabPanel>
              
              {/* My Parties Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Heading as="h3" size="md">
                    Active Parties
                  </Heading>
                  
                  {activeParties.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      {activeParties.map(party => (
                        <Card key={party.id}>
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <Flex w="100%" justify="space-between" align="center">
                                <Heading as="h4" size="md">
                                  {party.name}
                                </Heading>
                                <Badge colorScheme={getStatusColor(party.status)}>
                                  {party.status.replace('_', ' ')}
                                </Badge>
                              </Flex>
                              
                              <Text color="gray.600">
                                {formatDate(party.date)} • {party.location}
                              </Text>
                              
                              <SimpleGrid columns={3} w="100%" spacing={4}>
                                <Box>
                                  <Text fontWeight="bold">{party.servicesCount}</Text>
                                  <Text fontSize="sm" color="gray.600">Services</Text>
                                </Box>
                                <Box>
                                  <Text fontWeight="bold">{party.offersCount}</Text>
                                  <Text fontSize="sm" color="gray.600">Offers</Text>
                                </Box>
                                <Box>
                                  <Text fontWeight="bold">{party.approvedOffersCount}</Text>
                                  <Text fontSize="sm" color="gray.600">Approved</Text>
                                </Box>
                              </SimpleGrid>
                              
                              <Flex w="100%" justify="flex-end" pt={2}>
                                <Link href={`/client/parties/${party.id}`} passHref>
                                  <Button colorScheme="brand">
                                    Manage Party
                                  </Button>
                                </Link>
                              </Flex>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Card>
                      <CardBody>
                  <response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>