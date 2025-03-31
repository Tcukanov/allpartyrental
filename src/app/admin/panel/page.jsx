"use client";

import { useState } from 'react';
import { Box, Container, Heading, Text, VStack, Tabs, TabList, TabPanels, Tab, TabPanel, SimpleGrid, Card, CardBody, Flex, Badge, Button, HStack, Stat, StatLabel, StatNumber, StatHelpText, Table, Thead, Tbody, Tr, Th, Td, useToast, Select, Input, FormControl, FormLabel, Switch } from '@chakra-ui/react';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { AddIcon, DeleteIcon, EditIcon, WarningIcon, CheckIcon, InfoIcon } from '@chakra-ui/icons';
import { FiAlertCircle, FiHelpCircle } from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';
import NextLink from 'next/link';

// Mock data for admin dashboard
const mockUsers = [
  {
    id: 1,
    name: "John Smith",
    email: "john@example.com",
    role: "provider",
    status: "active",
    joinDate: "2025-01-15",
    serviceType: "Decoration",
    location: "New York"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "client",
    status: "active",
    joinDate: "2025-02-03",
    partiesOrganized: 3,
    location: "New York"
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael@example.com",
    role: "client",
    status: "active",
    joinDate: "2025-02-10",
    partiesOrganized: 1,
    location: "Chicago"
  },
  {
    id: 4,
    name: "Party Decorations Pro",
    email: "info@partydecorationspro.com",
    role: "provider",
    status: "active",
    joinDate: "2025-01-05",
    serviceType: "Decoration",
    location: "New York"
  },
  {
    id: 5,
    name: "Jennifer Davis",
    email: "jennifer@example.com",
    role: "client",
    status: "blocked",
    joinDate: "2025-01-20",
    partiesOrganized: 0,
    location: "Los Angeles"
  }
];

const mockDisputes = [
  {
    id: 1,
    clientName: "Sarah Johnson",
    providerName: "Party Decorations Pro",
    partyDate: "2025-03-15",
    amount: 299.99,
    status: "Open",
    reason: "Service provider didn't show up at the event.",
    createdAt: "2025-03-15T18:30:00"
  },
  {
    id: 2,
    clientName: "Michael Brown",
    providerName: "Kids Party Catering",
    partyDate: "2025-03-10",
    amount: 349.99,
    status: "Under Review",
    reason: "Food quality was not as described in the offer.",
    createdAt: "2025-03-10T20:15:00"
  },
  {
    id: 3,
    clientName: "Jennifer Davis",
    providerName: "Princess Characters",
    partyDate: "2025-02-28",
    amount: 199.99,
    status: "Resolved",
    resolution: "Partial refund",
    reason: "Character arrived 30 minutes late.",
    createdAt: "2025-02-28T17:45:00",
    resolvedAt: "2025-03-02T14:20:00"
  }
];

const mockFlaggedMessages = [
  {
    id: 1,
    senderName: "John Smith",
    receiverName: "Sarah Johnson",
    content: "Here's my phone number: 555-123-4567. Call me directly to discuss the details.",
    reason: "Contact information sharing",
    timestamp: "2025-03-19T14:30:00"
  },
  {
    id: 2,
    senderName: "Party Decorations Pro",
    receiverName: "Michael Brown",
    content: "I can offer you a 20% discount if you pay me directly through Venmo instead of the platform.",
    reason: "Price dumping",
    timestamp: "2025-03-18T09:15:00"
  },
  {
    id: 3,
    senderName: "Jennifer Davis",
    receiverName: "Princess Characters",
    content: "Your service was terrible! I'm never using this **** service again!",
    reason: "Profanity",
    timestamp: "2025-03-17T16:45:00"
  }
];

const mockStatistics = {
  users: {
    total: 156,
    clients: 98,
    providers: 58,
    growth: 12.5
  },
  parties: {
    total: 87,
    active: 42,
    completed: 45,
    growth: 8.3
  },
  transactions: {
    total: "$24,875.50",
    thisMonth: "$6,432.25",
    avgValue: "$286.50",
    growth: 15.2
  },
  advertising: {
    revenue: "$3,245.75",
    activeAds: 18,
    firstWaveSubscribers: 12,
    growth: 22.7
  }
};

const mockAdPackages = [
  {
    id: 1,
    name: "1 Day Spotlight",
    price: 19.99,
    duration: "1 day",
    type: "Spotlight"
  },
  {
    id: 2,
    name: "7 Day Spotlight",
    price: 99.99,
    duration: "7 days",
    type: "Spotlight"
  },
  {
    id: 3,
    name: "First Wave Weekly",
    price: 49.99,
    duration: "7 days",
    type: "First Wave"
  },
  {
    id: 4,
    name: "First Wave Monthly",
    price: 149.99,
    duration: "30 days",
    type: "First Wave"
  },
  {
    id: 5,
    name: "Premium Bundle",
    price: 129.99,
    duration: "7 days",
    type: "Bundle"
  }
];

export default function AdminPanelPage() {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState(mockUsers);
  const [disputes, setDisputes] = useState(mockDisputes);
  const [flaggedMessages, setFlaggedMessages] = useState(mockFlaggedMessages);
  const [statistics, setStatistics] = useState(mockStatistics);
  const [adPackages, setAdPackages] = useState(mockAdPackages);
  const [userFilter, setUserFilter] = useState("all");
  const [disputeFilter, setDisputeFilter] = useState("all");
  
  // Filter users based on role
  const filteredUsers = userFilter === "all" 
    ? users 
    : users.filter(user => user.role === userFilter);
  
  // Filter disputes based on status
  const filteredDisputes = disputeFilter === "all"
    ? disputes
    : disputes.filter(dispute => dispute.status.toLowerCase() === disputeFilter.toLowerCase());
  
  // Handle user block/unblock
  const handleToggleUserStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "active" ? "blocked" : "active" } 
        : user
    ));
    
    const user = users.find(u => u.id === userId);
    const newStatus = user.status === "active" ? "blocked" : "active";
    
    toast({
      title: `User ${newStatus}`,
      description: `${user.name} has been ${newStatus}.`,
      status: newStatus === "active" ? "success" : "info",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Handle dispute resolution
  const handleResolveDispute = (disputeId, resolution) => {
    setDisputes(disputes.map(dispute => 
      dispute.id === disputeId 
        ? { 
            ...dispute, 
            status: "Resolved", 
            resolution, 
            resolvedAt: new Date().toISOString() 
          } 
        : dispute
    ));
    
    toast({
      title: "Dispute resolved",
      description: `The dispute has been resolved with ${resolution}.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Handle message moderation
  const handleModerateMessage = (messageId, action) => {
    if (action === "delete") {
      setFlaggedMessages(flaggedMessages.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Message deleted",
        description: "The flagged message has been deleted.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } else if (action === "approve") {
      setFlaggedMessages(flaggedMessages.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Message approved",
        description: "The message has been approved and unflagged.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else if (action === "warn") {
      setFlaggedMessages(flaggedMessages.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Warning sent",
        description: "A warning has been sent to the user.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handle ad package price update
  const handleUpdateAdPrice = (packageId, newPrice) => {
    setAdPackages(adPackages.map(pkg => 
      pkg.id === packageId 
        ? { ...pkg, price: parseFloat(newPrice) } 
        : pkg
    ));
    
    toast({
      title: "Price updated",
      description: "The advertising package price has been updated.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" size="xl" mb={6}>Admin Dashboard</Heading>
        
        <Box mb={6}>
          <Flex direction={{ base: "column", md: "row" }} gap={4}>
            <Button 
              as={NextLink} 
              href="/admin/services/approval" 
              colorScheme="orange" 
              leftIcon={<Icon as={FiAlertCircle} />}
              size="md"
            >
              View Pending Services
            </Button>
            
            <Button 
              as={NextLink} 
              href="/admin/docs" 
              colorScheme="blue" 
              leftIcon={<Icon as={FiHelpCircle} />}
              size="md"
            >
              Admin Documentation
            </Button>
          </Flex>
        </Box>
        
        <Tabs variant="enclosed" colorScheme="brand">
          <TabList>
            <Tab>Dashboard & Statistics</Tab>
            <Tab>User Management</Tab>
            <Tab>Dispute Management</Tab>
            <Tab>Content Moderation</Tab>
            <Tab>Advertising Configuration</Tab>
          </TabList>
          
          <TabPanels>
            {/* Dashboard & Statistics Tab */}
            <TabPanel>
              <VStack spacing={8} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Total Users</StatLabel>
                        <StatNumber>{statistics.users.total}</StatNumber>
                        <Flex justify="space-between" align="center">
                          <StatHelpText>
                            {statistics.users.clients} clients, {statistics.users.providers} providers
                          </StatHelpText>
                          <Badge colorScheme="green">+{statistics.users.growth}%</Badge>
                        </Flex>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Parties</StatLabel>
                        <StatNumber>{statistics.parties.total}</StatNumber>
                        <Flex justify="space-between" align="center">
                          <StatHelpText>
                            {statistics.parties.active} active, {statistics.parties.completed} completed
                          </StatHelpText>
                          <Badge colorScheme="green">+{statistics.parties.growth}%</Badge>
                        </Flex>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Transaction Volume</StatLabel>
                        <StatNumber>{statistics.transactions.total}</StatNumber>
                        <Flex justify="space-between" align="center">
                          <StatHelpText>
                            This month: {statistics.transactions.thisMonth}
                          </StatHelpText>
                          <Badge colorScheme="green">+{statistics.transactions.growth}%</Badge>
                        </Flex>
                      </Stat>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Advertising Revenue</StatLabel>
                        <StatNumber>{statistics.advertising.revenue}</StatNumber>
                        <Flex justify="space-between" align="center">
                          <StatHelpText>
                            {statistics.advertising.activeAds} active ads
                          </StatHelpText>
                          <Badge colorScheme="green">+{statistics.advertising.growth}%</Badge>
                        </Flex>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>
                
                <Card>
                  <CardBody>
                    <Heading as="h3" size="md" mb={4}>Recent Activity</Heading>
                    
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Event</Th>
                          <Th>Details</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>Mar 20, 2025</Td>
                          <Td>New User Registration</Td>
                          <Td>Emily Wilson (Client) from Chicago</Td>
                        </Tr>
                        <Tr>
                          <Td>Mar 19, 2025</Td>
                          <Td>Party Completed</Td>
                          <Td>Sarah Johnson's Birthday Party ($849.97)</Td>
                        </Tr>
                        <Tr>
                          <Td>Mar 19, 2025</Td>
                          <Td>New Dispute</Td>
                          <Td>Michael Brown vs Kids Party Catering</Td>
                        </Tr>
                        <Tr>
                          <Td>Mar 18, 2025</Td>
                          <Td>Ad Package Purchase</Td>
                          <Td>Party Decorations Pro - 7 Day Spotlight ($99.99)</Td>
                        </Tr>
                        <Tr>
                          <Td>Mar 18, 2025</Td>
                          <Td>New Service Provider</Td>
                          <Td>Bounce House Fun (Bounce House) from New York</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
                
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <Card>
                    <CardBody>
                      <Heading as="h3" size="md" mb={4}>Top Service Categories</Heading>
                      
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Category</Th>
                            <Th isNumeric>Providers</Th>
                            <Th isNumeric>Bookings</Th>
                            <Th isNumeric>Revenue</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td>Decoration</Td>
                            <Td isNumeric>14</Td>
                            <Td isNumeric>32</Td>
                            <Td isNumeric>$8,245.75</Td>
                          </Tr>
                          <Tr>
                            <Td>Catering</Td>
                            <Td isNumeric>9</Td>
                            <Td isNumeric>28</Td>
                            <Td isNumeric>$7,832.50</Td>
                          </Tr>
                          <Tr>
                            <Td>Entertainment</Td>
                            <Td isNumeric>12</Td>
                            <Td isNumeric>24</Td>
                            <Td isNumeric>$5,124.25</Td>
                          </Tr>
                          <Tr>
                            <Td>Photography</Td>
                            <Td isNumeric>8</Td>
                            <Td isNumeric>18</Td>
                            <Td isNumeric>$4,875.00</Td>
                          </Tr>
                          <Tr>
                            <Td>Bounce House</Td>
                            <Td isNumeric>6</Td>
                            <Td isNumeric>15</Td>
                            <Td isNumeric>$3,245.50</Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardBody>
                      <Heading as="h3" size="md" mb={4}>Top Locations</Heading>
                      
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>City</Th>
                            <Th isNumeric>Users</Th>
                            <Th isNumeric>Parties</Th>
                            <Th isNumeric>Revenue</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td>Chicago</Td>
                            <Td isNumeric>245</Td>
                            <Td isNumeric>78</Td>
                            <Td isNumeric>$12,543.75</Td>
                          </Tr>
                          <Tr>
                            <Td>New York</Td>
                            <Td isNumeric>198</Td>
                            <Td isNumeric>62</Td>
                            <Td isNumeric>$9,876.25</Td>
                          </Tr>
                          <Tr>
                            <Td>Los Angeles</Td>
                            <Td isNumeric>176</Td>
                            <Td isNumeric>54</Td>
                            <Td isNumeric>$8,432.00</Td>
                          </Tr>
                          <Tr>
                            <Td>Miami</Td>
                            <Td isNumeric>132</Td>
                            <Td isNumeric>41</Td>
                            <Td isNumeric>$6,798.50</Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </MainLayout>
  );
}