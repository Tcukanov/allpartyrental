'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Icon,
  Flex,
  Stack,
  HStack,
  Progress,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Grid,
  GridItem,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiUsers, 
  FiDollarSign, 
  FiCalendar, 
  FiCheckCircle, 
  FiXCircle,
  FiArrowRight, 
  FiClock,
  FiAlertCircle,
  FiServer,
  FiActivity,
  FiSettings,
  FiRefreshCw,
  FiTrendingUp
} from 'react-icons/fi';

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        const response = await fetch('/api/admin/dashboard/stats');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load dashboard data');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
        
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [toast]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <Text>Error loading dashboard data: {error}</Text>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl">
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>Admin Dashboard</Heading>
          <Text color="gray.600">Overview of system activity and key metrics</Text>
        </Box>
        
        {/* Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <StatCard
            title="Total Users"
            value={dashboardData?.metrics?.users?.total || 0}
            icon={FiUsers}
            iconColor="purple.500"
            helperText={`${dashboardData?.metrics?.users?.new || 0} new today (${dashboardData?.metrics?.users?.percentChange || 0}%)`}
            linkUrl="/admin/users"
            linkText="View Users"
          />
          
          <StatCard
            title="Transactions"
            value={dashboardData?.metrics?.transactions?.total || 0}
            icon={FiDollarSign}
            iconColor="blue.500"
            helperText={`${dashboardData?.metrics?.transactions?.new || 0} new today (${dashboardData?.metrics?.transactions?.percentChange || 0}%)`}
            linkUrl="/admin/transactions"
            linkText="View Transactions"
          />
          
          <StatCard
            title="Total Revenue"
            value={formatCurrency(dashboardData?.metrics?.revenue?.total || 0)}
            icon={FiTrendingUp}
            iconColor="green.500"
            helperText={`${formatCurrency(dashboardData?.metrics?.revenue?.new || 0)} new today (${dashboardData?.metrics?.revenue?.percentChange || 0}%)`}
            linkUrl="/admin/finances"
            linkText="View Finances"
          />
        </SimpleGrid>
        
        {/* Transaction Status Chart */}
        <Card bg={cardBg}>
          <CardBody>
            <Heading size="md" mb={4}>Transaction Status Distribution</Heading>
            <Box>
              {Object.entries(dashboardData?.transactionStatus || {}).map(([status, count]) => (
                <HStack key={status} mb={3}>
                  <Text minW="120px" fontWeight="medium" textTransform="capitalize">
                    {status.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Text>
                  <Progress 
                    value={count} 
                    max={Object.values(dashboardData?.transactionStatus || {}).reduce((a, b) => a + b, 0)}
                    colorScheme={getStatusColor(status)}
                    flex="1"
                    borderRadius="full"
                    size="sm"
                  />
                  <Text fontWeight="medium" minW="40px" textAlign="right">
                    {count}
                  </Text>
                </HStack>
              ))}
            </Box>
            
            <Button 
              as={Link}
              href="/admin/transactions"
              variant="outline" 
              colorScheme="blue" 
              size="sm"
              rightIcon={<FiArrowRight />}
              mt={4}
            >
              View All Transactions
            </Button>
          </CardBody>
        </Card>
        
        {/* Quick Actions and System Status */}
        <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={6}>
          <GridItem>
            <Card bg={cardBg}>
              <CardBody>
                <Heading size="md" mb={4}>Quick Actions</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <ActionButton
                    icon={FiClock}
                    colorScheme="green"
                    onClick={() => router.push('/admin/transactions')}
                  >
                    Process Transactions
                  </ActionButton>
                  
                  <ActionButton
                    icon={FiServer}
                    colorScheme="blue"
                    onClick={() => router.push('/admin/system')}
                  >
                    Check System Status
                  </ActionButton>
                  
                  <ActionButton
                    icon={FiUsers}
                    colorScheme="purple"
                    onClick={() => router.push('/admin/users')}
                  >
                    Manage Users
                  </ActionButton>
                  
                  <ActionButton
                    icon={FiSettings}
                    colorScheme="gray"
                    onClick={() => router.push('/admin/settings')}
                  >
                    System Settings
                  </ActionButton>
                </SimpleGrid>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card bg={cardBg}>
              <CardBody>
                <Heading size="md" mb={4}>System Status</Heading>
                <Stack spacing={4}>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">API Status:</Text>
                    <Flex align="center">
                      <Icon 
                        as={dashboardData?.systemHealth?.apiStatus === 'healthy' ? FiCheckCircle : FiAlertCircle} 
                        color={dashboardData?.systemHealth?.apiStatus === 'healthy' ? 'green.500' : 'red.500'} 
                        mr={2} 
                      />
                      <Text textTransform="capitalize">{dashboardData?.systemHealth?.apiStatus || 'unknown'}</Text>
                    </Flex>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Database Status:</Text>
                    <Flex align="center">
                      <Icon 
                        as={dashboardData?.systemHealth?.dbStatus === 'healthy' ? FiCheckCircle : FiAlertCircle} 
                        color={dashboardData?.systemHealth?.dbStatus === 'healthy' ? 'green.500' : 'red.500'} 
                        mr={2} 
                      />
                      <Text textTransform="capitalize">{dashboardData?.systemHealth?.dbStatus || 'unknown'}</Text>
                    </Flex>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Processor Status:</Text>
                    <Flex align="center">
                      <Icon 
                        as={dashboardData?.systemHealth?.processorStatus === 'healthy' ? FiCheckCircle : FiAlertCircle} 
                        color={dashboardData?.systemHealth?.processorStatus === 'healthy' ? 'green.500' : 'red.500'} 
                        mr={2} 
                      />
                      <Text textTransform="capitalize">{dashboardData?.systemHealth?.processorStatus || 'unknown'}</Text>
                    </Flex>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Last Backup:</Text>
                    <Text>{formatDate(dashboardData?.systemHealth?.lastBackup || new Date())}</Text>
                  </HStack>
                  
                  <Button 
                    as={Link}
                    href="/admin/system"
                    variant="outline" 
                    colorScheme="blue" 
                    size="sm"
                    rightIcon={<FiArrowRight />}
                    mt={2}
                  >
                    View System Details
                  </Button>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
        
        {/* Recent Activity */}
        <Card bg={cardBg}>
          <CardBody>
            <Heading size="md" mb={4}>Recent Activity</Heading>
            <Stack spacing={4} divider={<Divider />}>
              {(dashboardData?.recentActivity || []).map((activity) => (
                <HStack key={activity.id} justify="space-between">
                  <HStack>
                    <Icon 
                      as={getActivityIcon(activity.type)}
                      color={getActivityColor(activity.type)}
                      boxSize={5}
                    />
                    <Text>{getActivityDescription(activity)}</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    {formatDate(activity.timestamp)}
                  </Text>
                </HStack>
              ))}
            </Stack>
            
            <Button 
              as={Link}
              href="/admin/transactions"
              variant="outline" 
              colorScheme="blue" 
              size="sm"
              rightIcon={<FiArrowRight />}
              mt={6}
            >
              View All Activity
            </Button>
          </CardBody>
        </Card>
      </Stack>
    </Container>
  );
}

// Helper component for stat cards
const StatCard = ({ title, value, icon, iconColor, helperText, linkUrl, linkText }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  
  return (
    <Card bg={cardBg}>
      <CardBody>
        <Flex justify="space-between" align="flex-start">
          <Stat>
            <StatLabel fontSize="lg" fontWeight="medium">{title}</StatLabel>
            <StatNumber fontSize="3xl" my={2}>{value}</StatNumber>
            <StatHelpText>{helperText}</StatHelpText>
          </Stat>
          <Box 
            p={2} 
            bg={useColorModeValue(`${iconColor.split('.')[0]}.50`, `${iconColor.split('.')[0]}.900`)}
            borderRadius="md"
            color={iconColor}
          >
            <Icon as={icon} boxSize={5} />
          </Box>
        </Flex>
        
        <Button 
          as={Link}
          href={linkUrl}
          size="sm"
          colorScheme="blue"
          variant="outline"
          mt={4}
          rightIcon={<FiArrowRight />}
        >
          {linkText}
        </Button>
      </CardBody>
    </Card>
  );
};

// Helper component for action buttons
const ActionButton = ({ children, icon, colorScheme, onClick }) => {
  return (
    <Button
      leftIcon={<Icon as={icon} />}
      colorScheme={colorScheme}
      variant="solid"
      size="md"
      onClick={onClick}
      justifyContent="flex-start"
      px={4}
      py={6}
    >
      {children}
    </Button>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  const colorMap = {
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    cancelled: 'red',
    refunded: 'purple'
  };
  
  return colorMap[status] || 'gray';
};

// Helper function to get activity icon
const getActivityIcon = (type) => {
  const iconMap = {
    transaction_created: FiDollarSign,
    user_registered: FiUsers,
    listing_published: FiActivity,
    review_posted: FiCheckCircle,
    payout_processed: FiDollarSign,
    dispute_opened: FiAlertCircle
  };
  
  return iconMap[type] || FiActivity;
};

// Helper function to get activity color
const getActivityColor = (type) => {
  const colorMap = {
    transaction_created: 'blue.500',
    user_registered: 'purple.500',
    listing_published: 'green.500',
    review_posted: 'orange.500',
    payout_processed: 'green.500',
    dispute_opened: 'red.500'
  };
  
  return colorMap[type] || 'gray.500';
};

// Helper function to get activity description
const getActivityDescription = (activity) => {
  switch (activity.type) {
    case 'transaction_created':
      return `New transaction: ${activity.data.amount ? formatCurrency(activity.data.amount) : ''}`;
    case 'user_registered':
      return `New user registered: ${activity.user.name}`;
    case 'listing_published':
      return `New listing published: ${activity.data.itemName || ''}`;
    case 'review_posted':
      return `New review: ${activity.data.rating ? '★'.repeat(activity.data.rating) : ''}`;
    case 'payout_processed':
      return `Payout processed: ${activity.data.amount ? formatCurrency(activity.data.amount) : ''}`;
    case 'dispute_opened':
      return `Dispute opened by ${activity.user.name}`;
    default:
      return 'System activity';
  }
}; 