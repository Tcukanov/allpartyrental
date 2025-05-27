'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Image,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  SearchIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import { FiMoreVertical, FiPackage, FiEye, FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';
import ProviderLayout from '../../components/ProviderLayout';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  // Mock data
  useEffect(() => {
    const fetchServices = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setServices([
        {
          id: 1,
          name: 'DJ Services for Weddings',
          category: 'Entertainment',
          price: 450,
          status: 'active',
          views: 124,
          bookings: 8,
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
          description: 'Professional DJ services for wedding receptions with premium sound equipment.',
          createdAt: '2024-01-15'
        },
        {
          id: 2,
          name: 'Corporate Event Catering',
          category: 'Catering',
          price: 850,
          status: 'active',
          views: 89,
          bookings: 5,
          image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400',
          description: 'Full-service catering for corporate events and business meetings.',
          createdAt: '2024-01-20'
        },
        {
          id: 3,
          name: 'Birthday Party Photography',
          category: 'Photography',
          price: 650,
          status: 'draft',
          views: 45,
          bookings: 2,
          image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400',
          description: 'Professional photography services for birthday celebrations.',
          createdAt: '2024-02-01'
        }
      ]);
      
      setIsLoading(false);
    };

    fetchServices();
  }, []);

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteService = (serviceId) => {
    setServices(prev => prev.filter(service => service.id !== serviceId));
    toast({
      title: 'Service deleted',
      description: 'The service has been removed from your listings.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleToggleStatus = (serviceId) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? { ...service, status: service.status === 'active' ? 'draft' : 'active' }
          : service
      )
    );
    toast({
      title: 'Service updated',
      description: 'Service status has been changed.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (isLoading) {
    return (
      <ProviderLayout>
        <Container maxW="container.xl" py={8}>
          <Text>Loading services...</Text>
        </Container>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <Container maxW="container.xl" py={8}>
        
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
          <VStack align="start" spacing={2}>
            <Heading size="lg">My Services</Heading>
            <Text color="gray.600">
              Manage your service listings and track their performance
            </Text>
          </VStack>
          
          <Button
            as={Link}
            href="/provider/dashboard/services/create"
            leftIcon={<AddIcon />}
            colorScheme="blue"
            size="lg"
          >
            Add New Service
          </Button>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
          <Card>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {services.length}
                </Text>
                <Text fontSize="sm" color="gray.600">Total Services</Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {services.filter(s => s.status === 'active').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Active Services</Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {services.reduce((sum, s) => sum + s.views, 0)}
                </Text>
                <Text fontSize="sm" color="gray.600">Total Views</Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {services.reduce((sum, s) => sum + s.bookings, 0)}
                </Text>
                <Text fontSize="sm" color="gray.600">Total Bookings</Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Search and Filter */}
        <Box mb={6}>
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Box>

        {/* Services List */}
        {filteredServices.length === 0 ? (
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <Box>
              <AlertTitle>No services found!</AlertTitle>
              <AlertDescription>
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Create your first service to get started.'
                }
              </AlertDescription>
            </Box>
          </Alert>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredServices.map((service) => (
              <Card 
                key={service.id} 
                shadow="md" 
                borderRadius="lg" 
                overflow="hidden"
                _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                {service.image && (
                  <Image
                    src={service.image}
                    alt={service.name}
                    h="200px"
                    w="full"
                    objectFit="cover"
                  />
                )}
                
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    
                    {/* Header */}
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex="1">
                        <Heading size="md" noOfLines={2}>
                          {service.name}
                        </Heading>
                        <Badge 
                          colorScheme={service.status === 'active' ? 'green' : 'yellow'}
                          textTransform="capitalize"
                        >
                          {service.status}
                        </Badge>
                      </VStack>
                      
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem 
                            as={Link} 
                            href={`/provider/dashboard/services/${service.id}`}
                            icon={<ViewIcon />}
                          >
                            View Details
                          </MenuItem>
                          <MenuItem 
                            as={Link} 
                            href={`/provider/dashboard/services/${service.id}/edit`}
                            icon={<EditIcon />}
                          >
                            Edit Service
                          </MenuItem>
                          <MenuItem 
                            icon={<SettingsIcon />}
                            onClick={() => handleToggleStatus(service.id)}
                          >
                            {service.status === 'active' ? 'Deactivate' : 'Activate'}
                          </MenuItem>
                          <MenuItem 
                            icon={<DeleteIcon />}
                            color="red.600"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Delete Service
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Flex>

                    {/* Description */}
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                      {service.description}
                    </Text>

                    {/* Category and Price */}
                    <HStack justify="space-between">
                      <Badge colorScheme="blue" variant="subtle">
                        {service.category}
                      </Badge>
                      <Text fontWeight="bold" color="green.600">
                        ${service.price}
                      </Text>
                    </HStack>

                    {/* Stats */}
                    <SimpleGrid columns={2} spacing={4} pt={2} borderTop="1px" borderColor="gray.200">
                      <HStack spacing={2}>
                        <FiEye size={16} />
                        <Text fontSize="sm" color="gray.600">
                          {service.views} views
                        </Text>
                      </HStack>
                      <HStack spacing={2}>
                        <FiPackage size={16} />
                        <Text fontSize="sm" color="gray.600">
                          {service.bookings} bookings
                        </Text>
                      </HStack>
                    </SimpleGrid>

                    {/* Actions */}
                    <HStack spacing={2}>
                      <Button
                        as={Link}
                        href={`/provider/dashboard/services/${service.id}/edit`}
                        size="sm"
                        variant="outline"
                        leftIcon={<EditIcon />}
                        flex="1"
                      >
                        Edit
                      </Button>
                      <Button
                        as={Link}
                        href={`/provider/dashboard/services/${service.id}`}
                        size="sm"
                        colorScheme="blue"
                        leftIcon={<ViewIcon />}
                        flex="1"
                      >
                        View
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Container>
    </ProviderLayout>
  );
} 