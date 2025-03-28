'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  Stack,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiLock,
  FiUnlock,
  FiMail,
  FiUser,
  FiDollarSign,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const itemsPerPage = 10;
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        
        // Simulated data for demonstration
        // In a real application, you would fetch this data from an API
        const mockUsers = [
          { id: '1', name: 'John Smith', email: 'john@example.com', role: 'USER', status: 'ACTIVE', createdAt: '2023-01-15T08:30:00Z', lastLogin: '2023-06-01T10:15:00Z', transactions: 8 },
          { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'USER', status: 'ACTIVE', createdAt: '2023-02-10T14:20:00Z', lastLogin: '2023-06-02T09:45:00Z', transactions: 12 },
          { id: '3', name: 'Michael Brown', email: 'michael@example.com', role: 'ADMIN', status: 'ACTIVE', createdAt: '2023-01-05T11:00:00Z', lastLogin: '2023-06-03T16:30:00Z', transactions: 5 },
          { id: '4', name: 'Emma Wilson', email: 'emma@example.com', role: 'USER', status: 'INACTIVE', createdAt: '2023-03-20T09:15:00Z', lastLogin: '2023-05-15T13:10:00Z', transactions: 3 },
          { id: '5', name: 'David Lee', email: 'david@example.com', role: 'USER', status: 'ACTIVE', createdAt: '2023-04-08T16:45:00Z', lastLogin: '2023-06-02T11:20:00Z', transactions: 7 },
          { id: '6', name: 'Jessica Clark', email: 'jessica@example.com', role: 'USER', status: 'SUSPENDED', createdAt: '2023-02-25T10:30:00Z', lastLogin: '2023-04-10T14:50:00Z', transactions: 2 },
          { id: '7', name: 'Daniel Martin', email: 'daniel@example.com', role: 'PROVIDER', status: 'ACTIVE', createdAt: '2023-03-15T13:40:00Z', lastLogin: '2023-06-03T08:25:00Z', transactions: 15 },
          { id: '8', name: 'Olivia Rodriguez', email: 'olivia@example.com', role: 'PROVIDER', status: 'ACTIVE', createdAt: '2023-04-20T15:10:00Z', lastLogin: '2023-06-01T17:30:00Z', transactions: 9 },
          { id: '9', name: 'James Wilson', email: 'james@example.com', role: 'USER', status: 'PENDING', createdAt: '2023-05-12T08:50:00Z', lastLogin: null, transactions: 0 },
          { id: '10', name: 'Sophia Garcia', email: 'sophia@example.com', role: 'PROVIDER', status: 'ACTIVE', createdAt: '2023-03-30T11:25:00Z', lastLogin: '2023-06-02T14:15:00Z', transactions: 11 },
          { id: '11', name: 'William Anderson', email: 'william@example.com', role: 'USER', status: 'ACTIVE', createdAt: '2023-02-18T09:40:00Z', lastLogin: '2023-05-28T10:05:00Z', transactions: 6 },
          { id: '12', name: 'Ava Thomas', email: 'ava@example.com', role: 'USER', status: 'INACTIVE', createdAt: '2023-04-15T14:55:00Z', lastLogin: '2023-05-10T16:40:00Z', transactions: 1 },
        ];
        
        setUsers(mockUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);
  
  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    // Search term filter
    const matchesSearch = 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // Calculate pagination
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  // Handle user action
  const handleUserAction = (action, user) => {
    setSelectedUser(user);
    
    if (action === 'edit') {
      onOpen();
    } else if (action === 'delete') {
      // In a real application, you would call an API to delete the user
      toast({
        title: 'Delete User',
        description: `This would delete ${user.name} in a real application.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } else if (action === 'suspend' || action === 'activate') {
      const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
      // In a real application, you would call an API to update the user's status
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      );
      setUsers(updatedUsers);
      
      toast({
        title: `User ${newStatus.toLowerCase()}`,
        description: `${user.name} has been ${newStatus.toLowerCase()}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else if (action === 'setAdmin' || action === 'removeAdmin') {
      const newRole = action === 'setAdmin' ? 'ADMIN' : 'USER';
      // In a real application, you would call an API to update the user's role
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, role: newRole } : u
      );
      setUsers(updatedUsers);
      
      toast({
        title: `User role updated`,
        description: `${user.name} is now a ${newRole.toLowerCase()}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'INACTIVE':
        return 'gray';
      case 'SUSPENDED':
        return 'red';
      case 'PENDING':
        return 'yellow';
      default:
        return 'gray';
    }
  };
  
  // Get role badge color
  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'purple';
      case 'PROVIDER':
        return 'blue';
      case 'USER':
        return 'gray';
      default:
        return 'gray';
    }
  };
  
  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Container maxW="container.xl">
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Text>Error loading users: {error}</Text>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl">
      <Stack spacing={6}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>User Management</Heading>
          <Text color="gray.600">View and manage user accounts</Text>
        </Box>
        
        {/* Filters */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          gap={4} 
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
        >
          <InputGroup maxW={{ base: '100%', md: '320px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Search by name or email" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <Flex gap={4}>
            <Select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              minW="150px"
            >
              <option value="all">All Roles</option>
              <option value="USER">User</option>
              <option value="PROVIDER">Provider</option>
              <option value="ADMIN">Admin</option>
            </Select>
            
            <Select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              minW="150px"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </Select>
          </Flex>
        </Flex>
        
        {/* Users Table */}
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Last Login</Th>
                <Th>Transactions</Th>
                <Th width="80px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentUsers.map((user) => (
                <Tr key={user.id}>
                  <Td fontWeight="medium">{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Badge colorScheme={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </Td>
                  <Td>{formatDate(user.createdAt)}</Td>
                  <Td>{formatDate(user.lastLogin)}</Td>
                  <Td isNumeric>{user.transactions}</Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                        aria-label="User actions"
                      />
                      <MenuList>
                        <MenuItem 
                          icon={<FiEdit />}
                          onClick={() => handleUserAction('edit', user)}
                        >
                          Edit User
                        </MenuItem>
                        
                        {user.status === 'ACTIVE' ? (
                          <MenuItem 
                            icon={<FiLock />}
                            onClick={() => handleUserAction('suspend', user)}
                          >
                            Suspend User
                          </MenuItem>
                        ) : (
                          <MenuItem 
                            icon={<FiUnlock />}
                            onClick={() => handleUserAction('activate', user)}
                          >
                            Activate User
                          </MenuItem>
                        )}
                        
                        {user.role !== 'ADMIN' ? (
                          <MenuItem 
                            icon={<FiUser />}
                            onClick={() => handleUserAction('setAdmin', user)}
                          >
                            Make Admin
                          </MenuItem>
                        ) : (
                          <MenuItem 
                            icon={<FiUser />}
                            onClick={() => handleUserAction('removeAdmin', user)}
                          >
                            Remove Admin
                          </MenuItem>
                        )}
                        
                        <MenuItem 
                          icon={<FiMail />}
                          onClick={() => handleUserAction('email', user)}
                        >
                          Email User
                        </MenuItem>
                        
                        <MenuItem 
                          icon={<FiDollarSign />}
                          onClick={() => handleUserAction('transactions', user)}
                        >
                          View Transactions
                        </MenuItem>
                        
                        <MenuItem 
                          icon={<FiTrash2 />}
                          color="red.500"
                          onClick={() => handleUserAction('delete', user)}
                        >
                          Delete User
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={4}>
            <Text color="gray.600">
              Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
            </Text>
            <Flex gap={2}>
              <IconButton
                icon={<FiChevronLeft />}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                isDisabled={currentPage === 1}
                aria-label="Previous page"
              />
              <IconButton
                icon={<FiChevronRight />}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                isDisabled={currentPage === totalPages}
                aria-label="Next page"
              />
            </Flex>
          </Flex>
        )}
      </Stack>
      
      {/* Edit User Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>Name</FormLabel>
                  <Input defaultValue={selectedUser.name} />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input defaultValue={selectedUser.email} />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Select defaultValue={selectedUser.role}>
                    <option value="USER">User</option>
                    <option value="PROVIDER">Provider</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select defaultValue={selectedUser.status}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="PENDING">Pending</option>
                  </Select>
                </FormControl>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={onClose}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 