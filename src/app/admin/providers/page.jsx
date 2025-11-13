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
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Stack,
  Flex,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  HStack,
  VStack,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FiCheck, FiX, FiEye, FiUserCheck, FiUserX, FiClock } from 'react-icons/fi';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/providers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to load providers');
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load provider applications',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (provider) => {
    setSelectedProvider(provider);
    onOpen();
  };

  const handleApprove = async (providerId) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/admin/providers/${providerId}/approve`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve provider');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Provider Approved',
          description: 'The provider has been approved and notified via email.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh the list
        fetchProviders();
        onClose();
      } else {
        throw new Error(data.error?.message || 'Failed to approve provider');
      }
    } catch (err) {
      console.error('Error approving provider:', err);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (providerId) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/admin/providers/${providerId}/reject`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject provider');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Provider Rejected',
          description: 'The provider application has been rejected.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh the list
        fetchProviders();
        onClose();
      } else {
        throw new Error(data.error?.message || 'Failed to reject provider');
      }
    } catch (err) {
      console.error('Error rejecting provider:', err);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (isVerified) => {
    return isVerified ? 'green' : 'yellow';
  };

  const getStatusText = (isVerified) => {
    return isVerified ? 'Approved' : 'Pending';
  };

  // Calculate stats
  const stats = {
    total: providers.length,
    pending: providers.filter(p => !p.isVerified).length,
    approved: providers.filter(p => p.isVerified).length,
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
          <Text>Error loading providers: {error}</Text>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl">
      <Stack spacing={6}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>Provider Applications</Heading>
          <Text color="gray.600">Review and manage provider applications</Text>
        </Box>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Providers</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack>
                    <FiClock />
                    <Text>Pending Approval</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="orange.500">{stats.pending}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack>
                    <FiUserCheck />
                    <Text>Approved</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="green.500">{stats.approved}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Providers Table */}
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Company Name</Th>
                <Th>Contact Person</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Applied Date</Th>
                <Th>Status</Th>
                <Th width="150px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {providers.map((provider) => (
                <Tr key={provider.id}>
                  <Td fontWeight="medium">{provider.businessName || 'N/A'}</Td>
                  <Td>{provider.user.name}</Td>
                  <Td>{provider.user.email}</Td>
                  <Td>{provider.phone || 'N/A'}</Td>
                  <Td>{formatDate(provider.createdAt)}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(provider.isVerified)}>
                      {getStatusText(provider.isVerified)}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        leftIcon={<FiEye />}
                        onClick={() => handleViewDetails(provider)}
                        variant="outline"
                      >
                        View
                      </Button>
                      {!provider.isVerified && (
                        <>
                          <Button
                            size="sm"
                            leftIcon={<FiCheck />}
                            colorScheme="green"
                            onClick={() => handleApprove(provider.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            leftIcon={<FiX />}
                            colorScheme="red"
                            onClick={() => handleReject(provider.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          
          {providers.length === 0 && (
            <Box textAlign="center" py={10}>
              <Text color="gray.500">No provider applications found</Text>
            </Box>
          )}
        </Box>
      </Stack>

      {/* Provider Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Provider Application Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProvider && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>Company Information</Text>
                  <Stack spacing={2}>
                    <HStack justify="space-between">
                      <Text color="gray.600">Company Name:</Text>
                      <Text fontWeight="medium">{selectedProvider.businessName || 'N/A'}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Website:</Text>
                      <Text fontWeight="medium">{selectedProvider.website || 'N/A'}</Text>
                    </HStack>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Contact Information</Text>
                  <Stack spacing={2}>
                    <HStack justify="space-between">
                      <Text color="gray.600">Contact Person:</Text>
                      <Text fontWeight="medium">{selectedProvider.user.name}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Email:</Text>
                      <Text fontWeight="medium">{selectedProvider.user.email}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Phone:</Text>
                      <Text fontWeight="medium">{selectedProvider.phone || 'N/A'}</Text>
                    </HStack>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Company Description</Text>
                  <Text color="gray.600">{selectedProvider.bio || 'No description provided'}</Text>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Service Locations</Text>
                  <Stack spacing={2}>
                    {selectedProvider.cities && selectedProvider.cities.length > 0 ? (
                      selectedProvider.cities.map((providerCity) => (
                        <Badge key={providerCity.id} colorScheme="blue">
                          {providerCity.city.name}
                        </Badge>
                      ))
                    ) : (
                      <Text color="gray.500">No service locations specified</Text>
                    )}
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Application Status</Text>
                  <HStack justify="space-between">
                    <Text color="gray.600">Status:</Text>
                    <Badge colorScheme={getStatusColor(selectedProvider.isVerified)}>
                      {getStatusText(selectedProvider.isVerified)}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between" mt={2}>
                    <Text color="gray.600">Applied Date:</Text>
                    <Text>{formatDate(selectedProvider.createdAt)}</Text>
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedProvider && !selectedProvider.isVerified && (
              <>
                <Button
                  leftIcon={<FiX />}
                  colorScheme="red"
                  mr={3}
                  onClick={() => handleReject(selectedProvider.id)}
                  isLoading={actionLoading}
                >
                  Reject
                </Button>
                <Button
                  leftIcon={<FiCheck />}
                  colorScheme="green"
                  onClick={() => handleApprove(selectedProvider.id)}
                  isLoading={actionLoading}
                >
                  Approve
                </Button>
              </>
            )}
            {selectedProvider && selectedProvider.isVerified && (
              <Button onClick={onClose}>Close</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

