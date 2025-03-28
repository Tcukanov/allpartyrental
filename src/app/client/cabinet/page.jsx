"use client";

import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, Tabs, TabList, TabPanels, Tab, TabPanel, SimpleGrid, Card, CardBody, Flex, Avatar, Badge, Button, Stat, StatLabel, StatNumber, StatHelpText, useToast, HStack, Icon, Spinner } from '@chakra-ui/react';
import { CalendarIcon, PartyIcon, HistoryIcon, SettingsIcon, ChatIcon, BellIcon } from '@chakra-ui/icons';
import { FaCalendarAlt, FaGift, FaHistory, FaCog, FaComment, FaEnvelope, FaMoneyBillWave } from 'react-icons/fa';
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

// Mock chats data
const mockChats = [
  {
    id: 'chat1',
    offerId: 'offer1',
    lastMessage: "I'm interested in your bounce house service, is it available for June 15th?",
    lastMessageDate: '2025-03-20T10:30:00Z',
    otherParty: {
      id: 'provider1',
      name: 'Bounce House Rentals',
      avatar: '/images/providers/provider1.jpg'
    },
    unreadCount: 2,
    serviceName: 'Deluxe Bounce House'
  },
  {
    id: 'chat2',
    offerId: 'offer2',
    lastMessage: "Thank you for your inquiry. We can definitely accommodate your request.",
    lastMessageDate: '2025-03-18T14:15:00Z',
    otherParty: {
      id: 'provider2',
      name: 'Party Catering Services',
      avatar: '/images/providers/provider2.jpg'
    },
    unreadCount: 0,
    serviceName: 'Premium Catering Package'
  },
  {
    id: 'chat3',
    offerId: 'offer3',
    lastMessage: "Your booking has been confirmed. Looking forward to providing our services!",
    lastMessageDate: '2025-03-15T09:45:00Z',
    otherParty: {
      id: 'provider3',
      name: 'Magical Entertainment',
      avatar: '/images/providers/provider3.jpg'
    },
    unreadCount: 0,
    serviceName: 'Children\'s Magic Show'
  }
];

// Add mock transactions data
const mockTransactions = [
  {
    id: 'transaction1',
    offerId: 'offer1',
    amount: 299.99,
    status: 'COMPLETED',
    createdAt: '2025-03-15T12:30:00Z',
    offer: {
      service: {
        name: 'Deluxe Bounce House'
      },
      provider: {
        name: 'Bounce House Rentals',
        profile: {
          avatar: '/images/providers/provider1.jpg'
        }
      }
    }
  },
  {
    id: 'transaction2',
    offerId: 'offer2',
    amount: 450.00,
    status: 'ESCROW',
    createdAt: '2025-03-18T09:45:00Z',
    escrowEndTime: '2025-03-20T09:45:00Z',
    offer: {
      service: {
        name: 'Premium Catering Package'
      },
      provider: {
        name: 'Party Catering Services',
        profile: {
          avatar: '/images/providers/provider2.jpg'
        }
      }
    }
  },
  {
    id: 'transaction3',
    offerId: 'offer3',
    amount: 150.00,
    status: 'PROVIDER_REVIEW',
    createdAt: '2025-03-19T14:15:00Z',
    reviewDeadline: '2025-03-20T14:15:00Z',
    offer: {
      service: {
        name: 'Children\'s Magic Show'
      },
      provider: {
        name: 'Magical Entertainment',
        profile: {
          avatar: '/images/providers/provider3.jpg'
        }
      }
    }
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
  const [chats, setChats] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
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
        // const chatsResponse = await fetch('/api/chats');
        
        // Simulate API calls with mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setActiveParties(mockParties);
        setPastParties(mockPastParties);
        setBirthdays(mockBirthdays);
        setNotifications(mockNotifications);
        setChats(mockChats);
        setTransactions(mockTransactions);
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
    const colorMap = {
      'PENDING': 'gray',
      'PROVIDER_REVIEW': 'yellow',
      'ESCROW': 'blue',
      'COMPLETED': 'green',
      'REFUNDED': 'purple',
      'DECLINED': 'red',
      'DISPUTED': 'orange'
    };
    return colorMap[status] || 'gray';
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
  
  const handleOpenChat = (chatId) => {
    // Navigate to the specific chat
    router.push(`/chats/${chatId}`);
  };
  
  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Add helper functions for transactions
  const formatStatus = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'PROVIDER_REVIEW': 'Review',
      'ESCROW': 'In Escrow',
      'COMPLETED': 'Completed',
      'REFUNDED': 'Refunded',
      'DECLINED': 'Declined',
      'DISPUTED': 'Disputed'
    };
    return statusMap[status] || status;
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
                
        <Tabs variant="enclosed">
          <TabList>
            <Tab><Icon as={FaGift} mr={2} /> My Parties</Tab>
            <Tab><Icon as={FaCalendarAlt} mr={2} /> Calendar</Tab>
            <Tab><Icon as={FaHistory} mr={2} /> Party History</Tab>
            <Tab><Icon as={FaComment} mr={2} /> Messages</Tab>
            <Tab><Icon as={FaMoneyBillWave} mr={2} /> Transactions</Tab>
            <Tab><Icon as={FaCog} mr={2} /> Settings</Tab>
          </TabList>
          
          <TabPanels>
            {/* My Parties Tab */}
            <TabPanel>
              {/* Existing My Parties content */}
              {/* ... */}
            </TabPanel>
            
            {/* Calendar Tab */}
            <TabPanel>
              {/* Existing Calendar content */}
              {/* ... */}
            </TabPanel>
            
            {/* Party History Tab */}
            <TabPanel>
              {/* Existing Party History content */}
              {/* ... */}
            </TabPanel>
            
            {/* Messages Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading as="h2" size="lg">My Messages</Heading>
                  <Button 
                    colorScheme="brand" 
                    size="sm" 
                    leftIcon={<Icon as={FaComment} />}
                    onClick={() => router.push('/chats')}
                    mb={4}
                  >
                    View All Messages
                                  </Button>
                              </Flex>
                
                {isLoading ? (
                  <Box p={6} textAlign="center">
                    <Spinner size="xl" />
                    <Text mt={4}>Loading messages...</Text>
                  </Box>
                ) : chats.length === 0 ? (
                  <Box p={8} borderWidth="1px" borderRadius="lg" textAlign="center">
                    <Icon as={FaComment} boxSize={10} color="gray.400" mb={4} />
                    <Heading as="h3" size="md" mb={2}>No Messages Yet</Heading>
                    <Text color="gray.600" mb={6}>
                      You don't have any messages yet. Start a conversation by requesting services from providers.
                                      </Text>
                                  <Button 
                                    colorScheme="brand"
                      onClick={() => router.push('/services')}
                                  >
                      Browse Services
                                  </Button>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                    {chats.map((chat) => (
                      <Card 
                        key={chat.id} 
                        cursor="pointer" 
                        onClick={() => handleOpenChat(chat.id)}
                        _hover={{ shadow: 'md' }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <Flex justify="space-between" align="center">
                            <HStack spacing={4}>
                              <Avatar 
                                name={chat.otherParty.name} 
                                src={chat.otherParty.avatar} 
                                size="md" 
                              />
                              <Box>
                                <Flex align="center">
                                  <Heading size="sm" mr={2}>{chat.otherParty.name}</Heading>
                                  {chat.unreadCount > 0 && (
                                    <Badge colorScheme="red" borderRadius="full" px={2}>
                                      {chat.unreadCount} new
                                    </Badge>
                                  )}
                                </Flex>
                                <Text color="gray.600" fontSize="sm">{chat.serviceName}</Text>
                                <Text noOfLines={1} mt={1}>{chat.lastMessage}</Text>
                              </Box>
                            </HStack>
                            <Text fontSize="sm" color="gray.500">
                              {formatRelativeTime(chat.lastMessageDate)}
                          </Text>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                    )}
              </VStack>
              </TabPanel>
              
            {/* Transactions Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading as="h2" size="lg">Payment History</Heading>
                  <Button 
                    colorScheme="brand" 
                    size="sm" 
                    leftIcon={<Icon as={FaMoneyBillWave} />}
                    onClick={() => router.push('/client/transactions')}
                    mb={4}
                  >
                    View All Transactions
                  </Button>
                </Flex>
                
                {isLoadingTransactions ? (
                  <Box p={6} textAlign="center">
                    <Spinner size="xl" />
                    <Text mt={4}>Loading transactions...</Text>
                  </Box>
                ) : transactions.length === 0 ? (
                  <Box p={8} borderWidth="1px" borderRadius="lg" textAlign="center">
                    <Icon as={FaMoneyBillWave} boxSize={10} color="gray.400" mb={4} />
                    <Heading as="h3" size="md" mb={2}>No Transactions Yet</Heading>
                    <Text color="gray.600" mb={6}>
                      You don't have any payment transactions yet. Start by booking services from providers.
                    </Text>
                    <Button 
                      colorScheme="brand"
                      onClick={() => router.push('/services')}
                    >
                      Browse Services
                    </Button>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} variant="outline">
                        <CardBody>
                          <HStack justify="space-between" mb={2}>
                            <Heading size="sm">{transaction.offer.service.name}</Heading>
                            <Badge colorScheme={getStatusColor(transaction.status)}>
                              {formatStatus(transaction.status)}
                            </Badge>
                          </HStack>
                          <HStack spacing={3} mb={2}>
                            <Avatar 
                              size="xs" 
                              name={transaction.offer.provider.name}
                              src={transaction.offer.provider.profile?.avatar} 
                            />
                            <Text fontSize="sm" color="gray.600">
                              {transaction.offer.provider.name}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600" mb={3}>
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </Text>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">${transaction.amount.toFixed(2)}</Text>
                            <Button
                              as={Link}
                              href={`/client/transactions#${transaction.id}`}
                              size="sm"
                              variant="outline"
                            >
                              Details
                            </Button>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>
            
            {/* Settings Tab */}
              <TabPanel>
              {/* Existing Settings content */}
              {/* ... */}
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* Recent Activity Section */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>Recent Activity</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Notifications Card */}
            <Card>
                          <CardBody>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Notifications</Heading>
                    <Badge colorScheme="red" borderRadius="full" px={2}>
                      {notifications.filter(n => !n.isRead).length} new
                                </Badge>
                              </Flex>
                              
                  {notifications.length === 0 ? (
                    <Text color="gray.500">No notifications</Text>
                  ) : (
                    notifications.slice(0, 3).map((notification) => (
                      <Box 
                        key={notification.id} 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md" 
                        borderLeftWidth="4px"
                        borderLeftColor={notification.isRead ? "gray.300" : "brand.500"}
                        bg={notification.isRead ? "white" : "gray.50"}
                      >
                        <Heading size="sm">{notification.title}</Heading>
                        <Text fontSize="sm" mt={1}>{notification.content}</Text>
                                </Box>
                    ))
                  )}
                  
                  {notifications.length > 3 && (
                    <Button variant="outline" size="sm" alignSelf="center">
                      View All Notifications
                                  </Button>
                  )}
                            </VStack>
                          </CardBody>
                        </Card>
            
            {/* Recent Messages Card */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Recent Messages</Heading>
                    <Button 
                      size="sm" 
                      colorScheme="brand" 
                      variant="outline"
                      rightIcon={<Icon as={FaComment} />}
                      onClick={() => router.push('/chats')}
                    >
                      View All
                    </Button>
                  </Flex>
                  
                  {chats.length === 0 ? (
                    <Text color="gray.500">No messages</Text>
                  ) : (
                    chats.slice(0, 3).map((chat) => (
                      <Box 
                        key={chat.id} 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => handleOpenChat(chat.id)}
                        _hover={{ bg: "gray.50" }}
                      >
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Heading size="sm">{chat.otherParty.name}</Heading>
                            <Text fontSize="sm" noOfLines={1} mt={1}>
                              {chat.lastMessage}
                            </Text>
                          </Box>
                          {chat.unreadCount > 0 && (
                            <Badge colorScheme="red" borderRadius="full">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </Flex>
                      </Box>
                    ))
                  )}
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>
      </VStack>
    </Container>
  );
}