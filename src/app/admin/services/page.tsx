'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  useToast,
  HStack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tag,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  ButtonGroup,
  Link,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  ListItem,
  UnorderedList,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { 
  FiSearch, 
  FiFilter, 
  FiMoreVertical, 
  FiEye, 
  FiEdit, 
  FiTrash2,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiAlertCircle
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  status: string;
  createdAt: string;
  provider: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  city?: {
    id: string;
    name: string;
    state: string;
  };
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: string, name: string, state: string}[]>([]);
  const [deleteError, setDeleteError] = useState<{
    message: string;
    details: string;
    partyServiceCount?: number;
    offersCount?: number;
  } | null>(null);
  
  const toast = useToast();
  const router = useRouter();
  const { isOpen: isErrorDialogOpen, onOpen: onErrorDialogOpen, onClose: onErrorDialogClose } = useDisclosure();
  const cancelRef = useRef(null);

  useEffect(() => {
    fetchServices();
    fetchCategories();
    fetchCities();
  }, [page, itemsPerPage, statusFilter, categoryFilter, cityFilter, searchQuery]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      if (cityFilter !== 'all') params.append('cityId', cityFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/admin/services?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching services: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data);
        setTotalPages(data.meta?.pages || 1);
        setTotalCount(data.meta?.total || 0);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load services',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error(`Error fetching categories: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/cities');
      
      if (!response.ok) {
        throw new Error(`Error fetching cities: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCities(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Success',
          description: 'Service deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh services list
        fetchServices();
      } else {
        // Handle 409 Conflict specifically
        if (response.status === 409) {
          // Store detailed error info
          setDeleteError({
            message: data.error?.message || 'Cannot delete service',
            details: data.error?.details || 'This service has associated data that prevents deletion.',
            partyServiceCount: data.error?.partyServiceCount,
            offersCount: data.error?.offersCount
          });
          onErrorDialogOpen();
        } else {
          throw new Error(data.error?.message || 'Failed to delete service');
        }
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete service',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateServiceStatus = async (serviceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating service: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Service status updated to ${newStatus.toLowerCase()}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh services list
        fetchServices();
      } else {
        throw new Error(data.error?.message || 'Failed to update service');
      }
    } catch (err) {
      console.error('Error updating service:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update service',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colorScheme = {
      'ACTIVE': 'green',
      'INACTIVE': 'gray',
      'PENDING': 'yellow',
      'REJECTED': 'red',
      'DRAFT': 'blue',
    }[status] || 'gray';

    return (
      <Badge colorScheme={colorScheme}>
        {status}
      </Badge>
    );
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setCityFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  if (loading && services.length === 0) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading as="h1" size="xl">Services Management</Heading>
          <Text color="gray.600">Manage all services across the platform</Text>
        </Box>
        
        <ButtonGroup>
          <Button
            as={NextLink}
            href="/admin/services/approval"
            colorScheme="orange"
            leftIcon={<Icon as={FiAlertCircle} />}
          >
            Pending Approvals
          </Button>
        </ButtonGroup>
      </HStack>
      
      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="DRAFT">Draft</option>
            </Select>
            
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            
            <Select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}, {city.state}
                </option>
              ))}
            </Select>
          </SimpleGrid>
          
          <Flex justify="flex-end" mt={4}>
            <Button
              size="sm"
              variant="outline"
              onClick={resetFilters}
              leftIcon={<Icon as={FiX} />}
            >
              Reset Filters
            </Button>
          </Flex>
        </CardBody>
      </Card>
      
      {/* Services table */}
      <Card>
        <CardBody>
          {error ? (
            <Box p={6} textAlign="center">
              <Text color="red.500">{error}</Text>
              <Button mt={4} onClick={fetchServices}>Retry</Button>
            </Box>
          ) : services.length === 0 ? (
            <Box p={6} textAlign="center">
              <Text>No services found matching your criteria.</Text>
            </Box>
          ) : (
            <>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Category</Th>
                    <Th>Provider</Th>
                    <Th isNumeric>Price</Th>
                    <Th>Location</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {services.map((service) => (
                    <Tr key={service.id}>
                      <Td>{service.name}</Td>
                      <Td>{service.category.name}</Td>
                      <Td>{service.provider.name}</Td>
                      <Td isNumeric>${parseFloat(service.price.toString()).toFixed(2)}</Td>
                      <Td>{service.city ? `${service.city.name}, ${service.city.state}` : '-'}</Td>
                      <Td>{getStatusBadge(service.status)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            size="sm"
                            aria-label="View service"
                            icon={<FiEye />}
                            onClick={() => router.push(`/services/${service.id}`)}
                          />
                          
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              size="sm"
                              aria-label="Service options"
                              icon={<FiMoreVertical />}
                            />
                            <MenuList>
                              {service.status !== 'ACTIVE' && (
                                <MenuItem 
                                  icon={<FiCheck />}
                                  onClick={() => handleUpdateServiceStatus(service.id, 'ACTIVE')}
                                >
                                  Activate
                                </MenuItem>
                              )}
                              {service.status !== 'INACTIVE' && (
                                <MenuItem 
                                  icon={<FiX />}
                                  onClick={() => handleUpdateServiceStatus(service.id, 'INACTIVE')}
                                >
                                  Deactivate
                                </MenuItem>
                              )}
                              <MenuItem 
                                icon={<FiEdit />}
                                onClick={() => router.push(`/admin/services/${service.id}/edit`)}
                              >
                                Edit
                              </MenuItem>
                              <MenuItem 
                                icon={<FiTrash2 />}
                                color="red.500"
                                onClick={() => handleDeleteService(service.id)}
                              >
                                Delete
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {/* Pagination */}
              <Flex justify="space-between" align="center" mt={6}>
                <Text color="gray.600">
                  Showing {services.length} of {totalCount} services
                </Text>
                
                <HStack>
                  <Button
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    leftIcon={<Icon as={FiChevronLeft} />}
                  >
                    Previous
                  </Button>
                  
                  <Text>
                    Page {page} of {totalPages}
                  </Text>
                  
                  <Button
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    rightIcon={<Icon as={FiChevronRight} />}
                  >
                    Next
                  </Button>
                  
                  <Select
                    size="sm"
                    width="80px"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </Select>
                </HStack>
              </Flex>
            </>
          )}
        </CardBody>
      </Card>
      
      {/* Error Dialog for Delete Conflicts */}
      <AlertDialog
        isOpen={isErrorDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onErrorDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cannot Delete Service
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text mb={4}>
                This service cannot be deleted because it has associated data:
              </Text>
              <UnorderedList spacing={2} mb={4}>
                {deleteError?.partyServiceCount > 0 && (
                  <ListItem>
                    <strong>{deleteError.partyServiceCount}</strong> party service{deleteError.partyServiceCount !== 1 ? 's' : ''}
                  </ListItem>
                )}
                {deleteError?.offersCount > 0 && (
                  <ListItem>
                    <strong>{deleteError.offersCount}</strong> offer{deleteError.offersCount !== 1 ? 's' : ''}
                  </ListItem>
                )}
              </UnorderedList>
              <Text fontWeight="bold">Deactivating vs. Deleting:</Text>
              <Text mb={3}>
                Deactivation is the recommended approach for services with historical data. 
                This preserves records while preventing new bookings.
              </Text>
              <Text>
                Deletion can only be performed on services with no associated records.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onErrorDialogClose}>
                Close
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
} 