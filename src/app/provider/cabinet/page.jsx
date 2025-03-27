"use client";

import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, Tabs, TabList, TabPanels, Tab, TabPanel, SimpleGrid, Card, CardBody, Flex, Badge, Button, useToast, FormControl, FormLabel, Input, Textarea, Switch, HStack, Image, Select } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useSession } from 'next-auth/react';

// Mock data for service provider dashboard
const mockServices = [
  {
    id: 1,
    name: 'Premium Decoration Package',
    category: 'Decoration',
    price: 299.99,
    description: 'Complete decoration setup with balloons, banners, table settings, and themed decorations.',
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    isActive: true,
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 2,
    name: 'Balloon Arch',
    category: 'Decoration',
    price: 149.99,
    description: 'Custom balloon arch in colors of your choice. Perfect for photo opportunities.',
    availability: ['Friday', 'Saturday', 'Sunday'],
    isActive: true,
    image: 'https://images.unsplash.com/photo-1533294455009-a77b7557d2d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 3,
    name: 'DJ Services',
    category: 'Entertainment',
    price: 399.99,
    description: 'Professional DJ with sound equipment. Will play requested songs and keep the party going.',
    availability: ['Friday', 'Saturday'],
    isActive: false,
    image: 'https://images.unsplash.com/photo-1571266028243-5c6d8c2a0d6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  }
];

const mockRequests = [
  {
    id: 1,
    clientName: 'Sarah Johnson',
    partyType: 'Birthday Party',
    date: '2025-04-15',
    time: '14:00',
    location: 'New York',
    serviceType: 'Decoration',
    status: 'New',
    details: 'Looking for princess themed decorations for my daughter\'s 7th birthday party.'
  },
  {
    id: 2,
    clientName: 'Michael Brown',
    partyType: 'Anniversary Celebration',
    date: '2025-04-22',
    time: '18:00',
    location: 'New York',
    serviceType: 'Decoration',
    status: 'Offer Sent',
    details: 'Need elegant decorations for our 25th anniversary celebration. Gold and white theme preferred.'
  },
  {
    id: 3,
    clientName: 'Jennifer Davis',
    partyType: 'Graduation Party',
    date: '2025-05-10',
    time: '16:00',
    location: 'New York',
    serviceType: 'Entertainment',
    status: 'In Progress',
    details: 'Looking for a DJ for my son\'s high school graduation party. Need someone who can play a mix of current hits and classics.'
  }
];

const mockChats = [
  {
    id: 1,
    clientName: 'Michael Brown',
    lastMessage: 'Can you provide more details about the gold decorations?',
    timestamp: '2025-03-19T14:30:00',
    unread: 2
  },
  {
    id: 2,
    clientName: 'Jennifer Davis',
    lastMessage: 'I\'ve sent you my playlist preferences.',
    timestamp: '2025-03-18T09:15:00',
    unread: 0
  }
];

const mockAdPackages = [
  {
    id: 1,
    name: '1 Day Spotlight',
    description: 'Your service featured in the "Best in Your Location" section for 1 day',
    price: 19.99,
    duration: '1 day'
  },
  {
    id: 2,
    name: '7 Day Spotlight',
    description: 'Your service featured in the "Best in Your Location" section for 7 days',
    price: 99.99,
    duration: '7 days'
  },
  {
    id: 3,
    name: 'First Wave Weekly',
    description: 'Get early access to new client requests for 7 days',
    price: 49.99,
    duration: '7 days',
    type: 'First Wave'
  },
  {
    id: 4,
    name: 'First Wave Monthly',
    description: 'Get early access to new client requests for 30 days',
    price: 149.99,
    duration: '30 days',
    type: 'First Wave'
  },
  {
    id: 5,
    name: 'Premium Bundle',
    description: '7 Day Spotlight + First Wave Weekly',
    price: 129.99,
    duration: '7 days',
    type: 'Bundle'
  }
];

// Service categories
const serviceCategories = [
  'Decoration',
  'Catering',
  'Entertainment',
  'Venue',
  'Photography',
  'Music',
  'Bounce House',
  'Clown/Entertainer'
];

// Days of the week
const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function ProviderCabinetPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();
  const [services, setServices] = useState(mockServices);
  const [requests, setRequests] = useState(mockRequests);
  const [chats, setChats] = useState(mockChats);
  const [adPackages, setAdPackages] = useState(mockAdPackages);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [filteredRequests, setFilteredRequests] = useState(mockRequests);
  const [requestFilter, setRequestFilter] = useState('All');

  // Fetch services when component mounts
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setServices(result.data);
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: error.message || 'Failed to load services',
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setServices([]);
      }
    };

    if (session?.user?.role === 'PROVIDER') {
      fetchServices();
    }
  }, [session, toast]);

  // Filter requests based on status
  useEffect(() => {
    if (requestFilter === 'All') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(request => request.status === requestFilter));
    }
  }, [requestFilter, requests]);

  // Handle service form submission
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    
    try {
    if (isEditing && currentService) {
      // Update existing service
        const response = await fetch(`/api/services/${currentService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentService),
        });

        if (!response.ok) {
          throw new Error('Failed to update service');
        }

        const result = await response.json();
        if (result.success) {
      setServices(services.map(service => 
            service.id === result.data.id ? result.data : service
      ));
          
      toast({
        title: "Service updated",
            description: `${result.data.name} has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
        }
    } else {
      // Add new service
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentService),
        });

        if (!response.ok) {
          throw new Error('Failed to create service');
        }

        const result = await response.json();
        if (result.success) {
          setServices([...services, result.data]);
          
      toast({
        title: "Service added",
            description: `${result.data.name} has been added successfully.`,
        status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      }
      
      setIsEditing(false);
      setCurrentService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save service',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle service edit
  const handleEditService = (service) => {
    setCurrentService(service);
    setIsEditing(true);
  };

  // Handle service delete
  const handleDeleteService = async (serviceId) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      const result = await response.json();
      if (result.success) {
    setServices(services.filter(service => service.id !== serviceId));
    toast({
      title: "Service deleted",
      description: "The service has been deleted successfully.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to delete service',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle service activation toggle
  const handleToggleActive = async (serviceId) => {
    try {
      const service = services.find(s => s.id === serviceId);
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...service,
          status: service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service status');
      }

      const result = await response.json();
      if (result.success) {
    setServices(services.map(service => 
          service.id === result.data.id ? result.data : service
        ));
      }
    } catch (error) {
      console.error('Error toggling service status:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update service status',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle input change for service form
  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentService({
      ...currentService,
      [name]: value
    });
  };

  // Handle availability change
  const handleAvailabilityChange = (day) => {
    const availability = currentService?.availability || [];
    if (availability.includes(day)) {
      setCurrentService({
        ...currentService,
        availability: availability.filter(d => d !== day)
      });
    } else {
      setCurrentService({
        ...currentService,
        availability: [...availability, day]
      });
    }
  };

  // Handle sending an offer
  const handleSendOffer = (requestId) => {
    // In a real app, this would open a form to create an offer
    toast({
      title: "Offer form",
      description: "This would open a form to create and send an offer to the client.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle purchasing an ad package
  const handlePurchaseAd = (packageId) => {
    // In a real app, this would open a payment form
    toast({
      title: "Purchase ad package",
      description: "This would open a payment form to purchase the selected ad package.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
      <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" mb={6}>Service Provider Dashboard</Heading>
        
        <Tabs variant="enclosed" colorScheme="brand">
          <TabList>
            <Tab>Profile</Tab>
            <Tab>Requests</Tab>
            <Tab>Chats</Tab>
            <Tab>Manage Services</Tab>
            <Tab>Advertising</Tab>
          </TabList>
          
          <TabPanels>
            {/* Profile Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading as="h2" size="lg">Provider Profile</Heading>
                
                <Card>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Company Name</FormLabel>
                        <Input defaultValue="Party Decorations Pro" />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Contact Person</FormLabel>
                        <Input defaultValue="John Smith" />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input defaultValue="john@partydecorationspro.com" />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Phone</FormLabel>
                        <Input defaultValue="(212) 555-1234" />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Business Address (Optional)</FormLabel>
                        <Input placeholder="Enter your business address" />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Website (Optional)</FormLabel>
                        <Input placeholder="https://www.example.com" />
                      </FormControl>
                      
                      <FormControl gridColumn={{ md: "span 2" }}>
                        <FormLabel>Description</FormLabel>
                        <Textarea 
                          defaultValue="We specialize in creating magical party decorations for all occasions. With over 10 years of experience, we bring creativity and professionalism to every event."
                          rows={4}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Logo/Avatar</FormLabel>
                        <Box borderWidth="1px" borderRadius="md" p={2} width="fit-content">
                          <Button size="sm">Upload Image</Button>
                        </Box>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Social Links (Optional)</FormLabel>
                        <Input placeholder="Instagram URL" mb={2} />
                        <Input placeholder="Facebook URL" />
                      </FormControl>
                    </SimpleGrid>
                    
                    <Button 
                      mt={6} 
                      colorScheme="brand"
                      _hover={{ bg: '#ffcba5' }}
                      _active={{ bg: '#ffcba5' }}
                    >
                      Save Profile
                    </Button>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
            
            {/* Requests Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading as="h2" size="lg">Incoming Requests</Heading>
                  
                  <Select 
                    width="200px" 
                    value={requestFilter}
                    onChange={(e) => setRequestFilter(e.target.value)}
                  >
                    <option value="All">All Requests</option>
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Offer Sent">Offer Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </Select>
                </Flex>
                
                {filteredRequests.length === 0 ? (
                  <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
                    <Text>No requests matching the selected filter.</Text>
                  </Box>
                ) : (
                  filteredRequests.map(request => (
                    <Card key={request.id} mb={4}>
                      <CardBody>
                        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between">
                          <Box mb={{ base: 4, md: 0 }}>
                            <Flex align="center" mb={2}>
                              <Heading as="h3" size="md">{request.partyType}</Heading>
                              <Badge ml={2} colorScheme={
                                request.status === 'New' ? 'green' :
                                request.status === 'In Progress' ? 'blue' :
                                request.status === 'Offer Sent' ? 'purple' :
                                request.status === 'Approved' ? 'teal' :
                                'red'
                              }>
                                {request.status}
                              </Badge>
                            </Flex>
                            
                            <Text mb={2}><strong>Client:</strong> {request.clientName}</Text>
                            <Text mb={2}><strong>Date & Time:</strong> {request.date} at {request.time}</Text>
                            <Text mb={2}><strong>Location:</strong> {request.location}</Text>
                            <Text mb={2}><strong>Service Type:</strong> {request.serviceType}</Text>
                            <Text><strong>Details:</strong> {request.details}</Text>
                          </Box>
                          
                          <VStack align="stretch" spacing={2} minW="150px">
                            <Button 
                              colorScheme="brand" 
                              leftIcon={<AddIcon />}
                              isDisabled={request.status === 'Offer Sent' || request.status === 'Approved'}
                              onClick={() => handleSendOffer(request.id)}
                              _hover={{ bg: '#ffcba5' }}
                              _active={{ bg: '#ffcba5' }}
                            >
                              Send Offer
                            </Button>
                            <Button 
                              leftIcon={<EditIcon />} 
                              variant="outline"
                              _hover={{ bg: '#ffcba5' }}
                              _active={{ bg: '#ffcba5' }}
                            >
                              View Details
                            </Button>
                          </VStack>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))
                )}
              </VStack>
            </TabPanel>
            
            {/* Chats Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading as="h2" size="lg">Chats with Clients</Heading>
                
                {chats.length === 0 ? (
                  <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
                    <Text>No active chats.</Text>
                  </Box>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {chats.map(chat => (
                      <Card key={chat.id} cursor="pointer" onClick={() => router.push(`/chats/${chat.id}`)}>
                        <CardBody>
                          <Flex justify="space-between" align="center">
                            <Box>
                              <Text fontWeight="bold">{chat.clientName}</Text>
                              <Text noOfLines={1} fontSize="sm" color="gray.600">
                                {chat.lastMessage}
                              </Text>
                            </Box>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="gray.500">
                                {new Date(chat.timestamp).toLocaleDateString()}
                              </Text>
                              {chat.unread > 0 && (
                                <Badge colorScheme="red" borderRadius="full" mt={1}>
                                  {chat.unread}
                                </Badge>
                              )}
                            </Box>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </VStack>
            </TabPanel>
            
            {/* Manage Services Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading as="h2" size="lg">Manage Services</Heading>
                
                {services.length === 0 ? (
                  <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
                    <Text>No services available.</Text>
                  </Box>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {services.map(service => (
                      <Card key={service.id} cursor="pointer" onClick={() => handleEditService(service)}>
                        <CardBody>
                          <Flex justify="space-between" align="center">
                            <Box>
                              <Text fontWeight="bold">{service.name}</Text>
                              <Text noOfLines={1} fontSize="sm" color="gray.600">
                                {service.category}
                              </Text>
                            </Box>
                            <VStack align="stretch" spacing={2} minW="150px">
                              <Button 
                                leftIcon={<EditIcon />} 
                                variant="outline"
                                _hover={{ bg: '#ffcba5' }}
                                _active={{ bg: '#ffcba5' }}
                              >
                                View Details
                              </Button>
                              <Button 
                                leftIcon={<DeleteIcon />} 
                                variant="outline" 
                                colorScheme="red"
                                _hover={{ bg: '#ffcba5' }}
                                _active={{ bg: '#ffcba5' }}
                              >
                                Delete
                              </Button>
                            </VStack>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </VStack>
            </TabPanel>
            
            {/* Advertising Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading as="h2" size="lg">Advertising Options</Heading>
                <Text>
                  Boost your visibility and get more clients with our advertising packages.
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {adPackages.map(pkg => (
                    <Card key={pkg.id}>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <Heading size="md">{pkg.name}</Heading>
                          <Badge colorScheme="brand" alignSelf="flex-start">
                            {pkg.duration}
                          </Badge>
                          <Text>{pkg.description}</Text>
                          <Text fontWeight="bold" fontSize="xl">
                            ${pkg.price.toFixed(2)}
                          </Text>
                          <Button
                            colorScheme="brand"
                            onClick={() => handlePurchaseAd(pkg.id)}
                            _hover={{ bg: '#ffcba5' }}
                            _active={{ bg: '#ffcba5' }}
                          >
                            Purchase
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}