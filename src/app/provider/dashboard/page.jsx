'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Flex,
  Badge,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  useColorModeValue,
  Avatar,
  List,
  ListItem,
  ListIcon,
  Progress,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import {
  CalendarIcon,
  EmailIcon,
  PhoneIcon,
  StarIcon,
  CheckCircleIcon,
  TimeIcon,
  SettingsIcon,
  AddIcon,
  ViewIcon,
  EditIcon,
  AttachmentIcon,
  WarningIcon
} from '@chakra-ui/icons';
import { FiDollarSign, FiTrendingUp, FiUsers, FiCalendar, FiSettings, FiFileText, FiCreditCard, FiStar, FiClock, FiMapPin } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProviderLayout from '../components/ProviderLayout';

export default function ProviderDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDashboardData({
        stats: {
          totalEarnings: 12450.50,
          monthlyEarnings: 3250.75,
          earningsChange: 12.5,
          activeBookings: 8,
          totalBookings: 156,
          bookingsChange: 5.2,
          averageRating: 4.8,
          totalReviews: 89,
          profileViews: 1247,
          viewsChange: 8.3
        },
        recentBookings: [
          {
            id: 1,
            client: 'Sarah Johnson',
            service: 'DJ Services',
            date: '2024-02-15',
            time: '6:00 PM',
            amount: 450,
            status: 'confirmed',
            location: 'Miami, FL'
          },
          {
            id: 2,
            client: 'Mike Chen',
            service: 'Catering',
            date: '2024-02-18',
            time: '12:00 PM',
            amount: 850,
            status: 'pending',
            location: 'New York, NY'
          },
          {
            id: 3,
            client: 'Emily Davis',
            service: 'Photography',
            date: '2024-02-20',
            time: '2:00 PM',
            amount: 650,
            status: 'confirmed',
            location: 'Los Angeles, CA'
          }
        ],
        notifications: [
          {
            id: 1,
            type: 'booking',
            title: 'New Booking Request',
            message: 'You have a new booking request for DJ Services',
            time: '2 hours ago',
            unread: true
          },
          {
            id: 2,
            type: 'payment',
            title: 'Payment Received',
            message: 'Payment of $450 has been processed',
            time: '5 hours ago',
            unread: true
          },
          {
            id: 3,
            type: 'review',
            title: 'New Review',
            message: 'You received a 5-star review from Sarah Johnson',
            time: '1 day ago',
            unread: false
          }
        ],
        upcomingEvents: [
          {
            id: 1,
            title: 'Wedding Reception',
            client: 'The Smiths',
            date: '2024-02-15',
            time: '6:00 PM',
            service: 'DJ Services',
            location: 'Grand Ballroom, Miami'
          },
          {
            id: 2,
            title: 'Corporate Event',
            client: 'TechCorp Inc.',
            date: '2024-02-18',
            time: '12:00 PM',
            service: 'Catering',
            location: 'Conference Center, NYC'
          }
        ]
      });
      
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <ProviderLayout>
        <Box p={8}>
          <Text>Loading dashboard...</Text>
        </Box>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <Box bg={bgColor} minH="100vh">
        <Container maxW="container.xl" py={8}>
          
          {/* Header Section */}
          <Box mb={8}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <VStack align="start" spacing={2}>
                <Heading size="lg" color="gray.800">
                  Welcome back, {session?.user?.name || 'Provider'}!
                </Heading>
                <Text color="gray.600">
                  Here's what's happening with your business today
                </Text>
              </VStack>
              
              <HStack spacing={3}>
                <Button
                  as={Link}
                  href="/provider/services/create"
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  size="lg"
                >
                  Add Service
                </Button>
                <Button
                  as={Link}
                  href="/provider/calendar"
                  leftIcon={<CalendarIcon />}
                  variant="outline"
                  size="lg"
                >
                  View Calendar
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* Stats Overview */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Monthly Earnings</StatLabel>
                  <StatNumber color="green.600">
                    ${dashboardData.stats.monthlyEarnings.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {dashboardData.stats.earningsChange}% from last month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Active Bookings</StatLabel>
                  <StatNumber color="blue.600">
                    {dashboardData.stats.activeBookings}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {dashboardData.stats.bookingsChange}% from last month
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Average Rating</StatLabel>
                  <StatNumber color="yellow.600">
                    {dashboardData.stats.averageRating} ⭐
                  </StatNumber>
                  <StatHelpText>
                    From {dashboardData.stats.totalReviews} reviews
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="sm">
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Profile Views</StatLabel>
                  <StatNumber color="purple.600">
                    {dashboardData.stats.profileViews.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {dashboardData.stats.viewsChange}% this week
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Main Content Grid */}
          <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
            
            {/* Left Column */}
            <GridItem>
              <VStack spacing={6} align="stretch">
                
                {/* Recent Bookings */}
                <Card bg={cardBg} shadow="sm">
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Recent Bookings</Heading>
                      <Button
                        as={Link}
                        href="/provider/dashboard/bookings"
                        size="sm"
                        variant="ghost"
                        rightIcon={<ViewIcon />}
                      >
                        View All
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {dashboardData.recentBookings.map((booking) => (
                        <Box
                          key={booking.id}
                          p={4}
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="lg"
                          _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                          transition="all 0.2s"
                        >
                          <Flex justify="space-between" align="start">
                            <VStack align="start" spacing={2}>
                              <HStack>
                                <Text fontWeight="bold">{booking.client}</Text>
                                <Badge
                                  colorScheme={booking.status === 'confirmed' ? 'green' : 'yellow'}
                                  textTransform="capitalize"
                                >
                                  {booking.status}
                                </Badge>
                              </HStack>
                              <Text color="gray.600" fontSize="sm">{booking.service}</Text>
                              <HStack spacing={4} fontSize="sm" color="gray.500">
                                <HStack>
                                  <CalendarIcon boxSize={3} />
                                  <Text>{booking.date}</Text>
                                </HStack>
                                <HStack>
                                  <TimeIcon boxSize={3} />
                                  <Text>{booking.time}</Text>
                                </HStack>
                                <HStack>
                                  <Icon as={FiMapPin} boxSize={3} />
                                  <Text>{booking.location}</Text>
                                </HStack>
                              </HStack>
                            </VStack>
                            <Text fontWeight="bold" color="green.600">
                              ${booking.amount}
                            </Text>
                          </Flex>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Upcoming Events */}
                <Card bg={cardBg} shadow="sm">
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Upcoming Events</Heading>
                      <Button
                        as={Link}
                        href="/provider/calendar"
                        size="sm"
                        variant="ghost"
                        rightIcon={<CalendarIcon />}
                      >
                        View Calendar
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {dashboardData.upcomingEvents.map((event) => (
                        <Box
                          key={event.id}
                          p={4}
                          bg="blue.50"
                          borderRadius="lg"
                          borderLeft="4px"
                          borderLeftColor="blue.500"
                        >
                          <VStack align="start" spacing={2}>
                            <Text fontWeight="bold">{event.title}</Text>
                            <Text color="gray.600" fontSize="sm">
                              Client: {event.client}
                            </Text>
                            <HStack spacing={4} fontSize="sm" color="gray.600">
                              <HStack>
                                <CalendarIcon boxSize={3} />
                                <Text>{event.date} at {event.time}</Text>
                              </HStack>
                              <HStack>
                                <Icon as={FiMapPin} boxSize={3} />
                                <Text>{event.location}</Text>
                              </HStack>
                            </HStack>
                            <Badge colorScheme="blue" size="sm">
                              {event.service}
                            </Badge>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

              </VStack>
            </GridItem>

            {/* Right Column */}
            <GridItem>
              <VStack spacing={6} align="stretch">
                
                {/* Quick Actions */}
                <Card bg={cardBg} shadow="sm">
                  <CardHeader>
                    <Heading size="md">Quick Actions</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={2} spacing={3}>
                      <Button
                        as={Link}
                        href="/provider/services"
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        h="auto"
                        py={3}
                        flexDirection="column"
                        spacing={2}
                      >
                        <Icon as={AddIcon} boxSize={4} />
                        <Text fontSize="xs">Add Service</Text>
                      </Button>
                      
                      <Button
                        isDisabled
                        leftIcon={<EditIcon />}
                        colorScheme="green"
                        variant="outline"
                        size="sm"
                        h="auto"
                        py={3}
                        flexDirection="column"
                        spacing={2}
                        title="Profile page coming soon"
                      >
                        <Icon as={EditIcon} boxSize={4} />
                        <Text fontSize="xs">Edit Profile</Text>
                      </Button>
                      
                      <Button
                        as={Link}
                        href="/provider/dashboard/payments"
                        leftIcon={<Icon as={FiCreditCard} />}
                        colorScheme="purple"
                        variant="outline"
                        size="sm"
                        h="auto"
                        py={3}
                        flexDirection="column"
                        spacing={2}
                      >
                        <Icon as={FiCreditCard} boxSize={4} />
                        <Text fontSize="xs">Payments</Text>
                      </Button>
                      
                      <Button
                        as={Link}
                        href="/provider/dashboard/paypal"
                        leftIcon={<SettingsIcon />}
                        colorScheme="gray"
                        variant="outline"
                        size="sm"
                        h="auto"
                        py={3}
                        flexDirection="column"
                        spacing={2}
                      >
                        <Icon as={SettingsIcon} boxSize={4} />
                        <Text fontSize="xs">PayPal Settings</Text>
                      </Button>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Notifications */}
                <Card bg={cardBg} shadow="sm">
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Notifications</Heading>
                      <Badge colorScheme="red" borderRadius="full">
                        {dashboardData.notifications.filter(n => n.unread).length}
                      </Badge>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {dashboardData.notifications.slice(0, 5).map((notification) => (
                        <Box
                          key={notification.id}
                          p={3}
                          bg={notification.unread ? 'blue.50' : 'gray.50'}
                          borderRadius="md"
                          borderLeft="3px"
                          borderLeftColor={notification.unread ? 'blue.500' : 'gray.300'}
                        >
                          <VStack align="start" spacing={1}>
                            <HStack justify="space-between" w="full">
                              <Text fontWeight="bold" fontSize="sm">
                                {notification.title}
                              </Text>
                              {notification.unread && (
                                <Box w={2} h={2} bg="blue.500" borderRadius="full" />
                              )}
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              {notification.message}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {notification.time}
                            </Text>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Performance Summary */}
                <Card bg={cardBg} shadow="sm">
                  <CardHeader>
                    <Heading size="md">Performance Summary</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Box>
                        <Flex justify="space-between" mb={2}>
                          <Text fontSize="sm" fontWeight="medium">Profile Completion</Text>
                          <Text fontSize="sm" color="gray.600">85%</Text>
                        </Flex>
                        <Progress value={85} colorScheme="green" size="sm" borderRadius="full" />
                      </Box>
                      
                      <Box>
                        <Flex justify="space-between" mb={2}>
                          <Text fontSize="sm" fontWeight="medium">Response Rate</Text>
                          <Text fontSize="sm" color="gray.600">92%</Text>
                        </Flex>
                        <Progress value={92} colorScheme="blue" size="sm" borderRadius="full" />
                      </Box>
                      
                      <Box>
                        <Flex justify="space-between" mb={2}>
                          <Text fontSize="sm" fontWeight="medium">Customer Satisfaction</Text>
                          <Text fontSize="sm" color="gray.600">4.8/5.0</Text>
                        </Flex>
                        <Progress value={96} colorScheme="yellow" size="sm" borderRadius="full" />
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

              </VStack>
            </GridItem>
          </Grid>

        </Container>
      </Box>
    </ProviderLayout>
  );
} 