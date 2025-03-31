'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Stack,
  Badge,
  Spinner,
  useToast,
  HStack,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FaUsers, FaShoppingCart, FaMoneyBillWave, FaCalendarCheck, FaExclamationCircle } from 'react-icons/fa';

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    providers: number;
    clients: number;
  };
  services: {
    total: number;
    active: number;
    pendingApproval: number;
  };
  transactions: {
    total: number;
    today: number;
    value: number;
  };
  parties: {
    total: number;
    active: number;
    completed: number;
  };
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated and an admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      toast({
        title: 'Access Denied',
        description: 'Only administrators can access this page',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      fetchDashboardStats();
    }
  }, [session, status, router, toast]);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/statistics');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to load dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading as="h1" mb={2}>Admin Dashboard</Heading>
        <Text color="gray.600">
          Welcome back. Here's an overview of the platform's performance.
        </Text>
      </Box>

      {error && (
        <Box mb={6} p={4} bg="red.100" color="red.800" borderRadius="md">
          <Text>{error}</Text>
        </Box>
      )}

      {/* Services Pending Approval Alert */}
      {stats && stats.services.pendingApproval > 0 && (
        <Box mb={6} p={4} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.400">
          <Flex align="center">
            <Icon as={FaExclamationCircle} color="orange.500" boxSize={6} mr={3} />
            <Box flex="1">
              <Text fontWeight="bold" color="orange.700">
                {stats.services.pendingApproval} Service{stats.services.pendingApproval !== 1 ? 's' : ''} Pending Approval
              </Text>
              <Text color="orange.700">
                New services require your review before they become available to clients.
              </Text>
            </Box>
            <Button 
              colorScheme="orange" 
              size="sm"
              as={NextLink}
              href="/admin/services/approval"
            >
              Review Now
            </Button>
          </Flex>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {/* Users Stat Card */}
        <Card>
          <CardBody>
            <Stat>
              <Flex align="center" mb={2}>
                <Box
                  bg="blue.100"
                  p={2}
                  borderRadius="md"
                  mr={3}
                >
                  <Icon as={FaUsers} color="blue.500" boxSize={5} />
                </Box>
                <StatLabel fontSize="lg">Users</StatLabel>
              </Flex>
              <StatNumber fontSize="2xl">{stats?.users.total || 0}</StatNumber>
              <HStack mt={2}>
                <StatHelpText mb={0}>
                  <StatArrow type="increase" />
                  {stats?.users.newToday || 0} today
                </StatHelpText>
                <Divider orientation="vertical" h="20px" />
                <HStack>
                  <Badge colorScheme="blue">{stats?.users.providers || 0} providers</Badge>
                  <Badge colorScheme="green">{stats?.users.clients || 0} clients</Badge>
                </HStack>
              </HStack>
            </Stat>
          </CardBody>
        </Card>

        {/* Services Stat Card */}
        <Card>
          <CardBody>
            <Stat>
              <Flex align="center" mb={2}>
                <Box
                  bg="purple.100"
                  p={2}
                  borderRadius="md"
                  mr={3}
                >
                  <Icon as={FaShoppingCart} color="purple.500" boxSize={5} />
                </Box>
                <StatLabel fontSize="lg">Services</StatLabel>
              </Flex>
              <StatNumber fontSize="2xl">{stats?.services.total || 0}</StatNumber>
              <HStack mt={2}>
                <Badge colorScheme="green">{stats?.services.active || 0} active</Badge>
                {stats && stats.services.pendingApproval > 0 && (
                  <Badge colorScheme="orange">
                    {stats.services.pendingApproval} pending
                  </Badge>
                )}
              </HStack>
            </Stat>
          </CardBody>
        </Card>

        {/* Transactions Stat Card */}
        <Card>
          <CardBody>
            <Stat>
              <Flex align="center" mb={2}>
                <Box
                  bg="green.100"
                  p={2}
                  borderRadius="md"
                  mr={3}
                >
                  <Icon as={FaMoneyBillWave} color="green.500" boxSize={5} />
                </Box>
                <StatLabel fontSize="lg">Transactions</StatLabel>
              </Flex>
              <StatNumber fontSize="2xl">{stats?.transactions.total || 0}</StatNumber>
              <HStack mt={2}>
                <StatHelpText mb={0}>
                  <StatArrow type="increase" />
                  {stats?.transactions.today || 0} today
                </StatHelpText>
                <Divider orientation="vertical" h="20px" />
                <Text fontWeight="medium" color="green.500">
                  ${stats?.transactions.value.toLocaleString() || 0}
                </Text>
              </HStack>
            </Stat>
          </CardBody>
        </Card>

        {/* Parties Stat Card */}
        <Card>
          <CardBody>
            <Stat>
              <Flex align="center" mb={2}>
                <Box
                  bg="orange.100"
                  p={2}
                  borderRadius="md"
                  mr={3}
                >
                  <Icon as={FaCalendarCheck} color="orange.500" boxSize={5} />
                </Box>
                <StatLabel fontSize="lg">Parties</StatLabel>
              </Flex>
              <StatNumber fontSize="2xl">{stats?.parties.total || 0}</StatNumber>
              <HStack mt={2}>
                <Badge colorScheme="blue">{stats?.parties.active || 0} active</Badge>
                <Badge colorScheme="green">{stats?.parties.completed || 0} completed</Badge>
              </HStack>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Quick Actions</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <Button 
                as={NextLink} 
                href="/admin/services/approval"
                colorScheme="blue" 
                variant="outline"
                justifyContent="flex-start"
                height="auto"
                p={4}
              >
                <Stack spacing={1} align="start">
                  <Text fontWeight="bold">Review Services</Text>
                  <Text fontSize="sm" color="gray.600">
                    Approve or reject new service listings
                  </Text>
                </Stack>
              </Button>

              <Button 
                as={NextLink} 
                href="/admin/users"
                colorScheme="teal" 
                variant="outline"
                justifyContent="flex-start"
                height="auto"
                p={4}
              >
                <Stack spacing={1} align="start">
                  <Text fontWeight="bold">Manage Users</Text>
                  <Text fontSize="sm" color="gray.600">
                    View and manage user accounts
                  </Text>
                </Stack>
              </Button>

              <Button 
                as={NextLink} 
                href="/admin/transactions"
                colorScheme="green" 
                variant="outline"
                justifyContent="flex-start"
                height="auto"
                p={4}
              >
                <Stack spacing={1} align="start">
                  <Text fontWeight="bold">View Transactions</Text>
                  <Text fontSize="sm" color="gray.600">
                    Monitor payment activity
                  </Text>
                </Stack>
              </Button>

              <Button 
                as={NextLink} 
                href="/admin/settings"
                colorScheme="purple" 
                variant="outline"
                justifyContent="flex-start"
                height="auto"
                p={4}
              >
                <Stack spacing={1} align="start">
                  <Text fontWeight="bold">System Settings</Text>
                  <Text fontSize="sm" color="gray.600">
                    Configure platform settings
                  </Text>
                </Stack>
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Recent Activity</Heading>
          </CardHeader>
          <CardBody>
            <Box textAlign="center" py={8}>
              <Text color="gray.500">Activity data will appear here</Text>
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Container>
  );
} 