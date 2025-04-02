'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Card,
  CardBody,
  SimpleGrid,
  Button,
  Flex,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
  VStack,
  useToast,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Alert,
  AlertIcon,
  Spinner,
  Code,
  Divider,
  List,
  ListItem,
  ListIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { 
  FiActivity, 
  FiClock, 
  FiDatabase, 
  FiServer, 
  FiCalendar, 
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiSun,
  FiMoon,
  FiCpu,
  FiHardDrive,
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiInfo,
  FiTerminal,
  FiGlobe,
  FiArrowUp,
  FiFile,
} from 'react-icons/fi';

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Helper to format duration
const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (secs > 0 || result === '') result += `${secs}s`;
  
  return result.trim();
};

// Helper to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function SystemStatusPage() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [processingTransactions, setProcessingTransactions] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const codeBg = useColorModeValue('gray.50', 'gray.800');

  useEffect(() => {
    async function checkAccess() {
      try {
        // Check session
        const session = await getSession();
        if (!session || !session.user) {
          router.push('/login');
          return;
        }
        
        // Check admin role
        if (session.user.role !== 'ADMIN') {
          router.push('/');
          toast({
            title: 'Access Denied',
            description: 'You need administrator privileges to access this page.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        
        // Fetch system status if user is admin
        fetchSystemStatus();
      } catch (err) {
        console.error('Error checking access:', err);
        setError('Failed to verify access permissions');
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [router, toast]);

  const fetchSystemStatus = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Fetch system status
      const response = await fetch('/api/admin/system/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSystemStatus(data);
    } catch (err) {
      console.error('Error fetching system status:', err);
      setError(err.message);
      
      toast({
        title: 'Error',
        description: `Failed to fetch system status: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSystemStatus();
  };

  const processTransactions = async () => {
    try {
      setProcessingTransactions(true);
      
      const response = await fetch('/api/system/process-transactions', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to process transactions');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: 'Success',
        description: `Processed ${data.processed || 0} transactions successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh system status after processing
      fetchSystemStatus();
    } catch (err) {
      console.error('Error processing transactions:', err);
      
      toast({
        title: 'Error',
        description: `Failed to process transactions: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingTransactions(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" height="70vh" direction="column">
          <Spinner size="xl" mb={4} color="blue.500" />
          <Text>Loading system status...</Text>
        </Flex>
      </Container>
    );
  }

  if (error && !systemStatus) {
    return (
      <Container maxW="container.xl">
        <Alert status="error" mb={6} flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" p={8}>
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">System Status Error</AlertTitle>
          <AlertDescription maxWidth="md">
            {error}
          </AlertDescription>
          <Button mt={4} onClick={fetchSystemStatus} leftIcon={<FiRefreshCw />}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={6}>
        <Flex justify="space-between" align="center" wrap="wrap">
          <Box>
            <Heading mb={2}>System Status</Heading>
            <Text color="gray.600">Monitor and manage system resources</Text>
          </Box>
          
          <HStack>
            <Button 
              leftIcon={<FiRefreshCw />} 
              onClick={handleRefresh}
              colorScheme="blue"
              variant="outline"
              isLoading={refreshing}
              loadingText="Refreshing"
            >
              Refresh Status
            </Button>
            <Button 
              leftIcon={<FiActivity />} 
              onClick={processTransactions}
              colorScheme="green"
              isLoading={processingTransactions}
              loadingText="Processing"
            >
              Process Transactions
            </Button>
          </HStack>
        </Flex>
        
        {systemStatus && (
          <>
            {/* API Status */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>API Status</Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <Stat>
                    <StatLabel>Status</StatLabel>
                    <Flex align="center" mt={2}>
                      <Icon 
                        as={systemStatus?.api?.status === 'online' ? FiCheckCircle : FiAlertCircle} 
                        color={systemStatus?.api?.status === 'online' ? 'green.500' : 'red.500'} 
                        mr={2} 
                      />
                      <StatNumber fontSize="lg">
                        {systemStatus?.api?.status === 'online' ? 'Running' : 'Offline'}
                      </StatNumber>
                    </Flex>
                    <StatHelpText>
                      Response time: {systemStatus?.api?.responseTime || 'N/A'}
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Environment</StatLabel>
                    <StatNumber fontSize="lg">{systemStatus?.node?.environment || 'N/A'}</StatNumber>
                    <StatHelpText>
                      Node {systemStatus?.node?.version || 'N/A'} on {systemStatus?.os?.platform || 'N/A'}
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Uptime</StatLabel>
                    <StatNumber fontSize="lg">{formatDuration(systemStatus?.time?.uptime || 0)}</StatNumber>
                    <StatHelpText>
                      Since {new Date(Date.now() - (systemStatus?.time?.uptime || 0) * 1000).toLocaleDateString()}
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <Divider my={4} />
                
                <Heading size="sm" mb={3}>Memory Usage</Heading>
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={4}>
                  <Box>
                    <Text color="gray.600" fontSize="sm">Heap Used</Text>
                    <HStack>
                      <Text fontWeight="bold">{formatBytes(systemStatus?.memory?.usage?.heapUsed || 0)}</Text>
                      <Text color="gray.500">/ {formatBytes(systemStatus?.memory?.usage?.heapTotal || 0)}</Text>
                    </HStack>
                    <Progress 
                      value={((systemStatus?.memory?.usage?.heapUsed || 0) / (systemStatus?.memory?.usage?.heapTotal || 1)) * 100} 
                      size="sm" 
                      colorScheme="blue" 
                      mt={1}
                    />
                  </Box>
                  
                  <Box>
                    <Text color="gray.600" fontSize="sm">RSS</Text>
                    <Text fontWeight="bold">{formatBytes(systemStatus?.memory?.usage?.rss || 0)}</Text>
                  </Box>
                  
                  <Box>
                    <Text color="gray.600" fontSize="sm">External</Text>
                    <Text fontWeight="bold">{formatBytes(systemStatus?.memory?.usage?.external || 0)}</Text>
                  </Box>
                  
                  <Box>
                    <Text color="gray.600" fontSize="sm">Array Buffers</Text>
                    <Text fontWeight="bold">{formatBytes(systemStatus?.memory?.usage?.arrayBuffers || 0)}</Text>
                  </Box>
                </SimpleGrid>
                
                <Heading size="sm" mb={3}>Cron Jobs</Heading>
                <Box>
                  <HStack>
                    <Icon 
                      as={systemStatus?.cron?.transactionProcessor?.status === 'active' ? FiCheckCircle : FiAlertCircle} 
                      color={systemStatus?.cron?.transactionProcessor?.status === 'active' ? 'green.500' : 'yellow.500'} 
                    />
                    <Text>
                      {systemStatus?.cron?.transactionProcessor?.status === 'active'
                        ? 'Cron jobs are active and running'
                        : 'Cron jobs are not active'
                      }
                    </Text>
                  </HStack>
                </Box>
              </CardBody>
            </Card>
            
            {/* System Time Info */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Time Information</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Stat>
                    <StatLabel>Server Time</StatLabel>
                    <StatNumber fontSize="lg">{formatDate(systemStatus?.time?.current || new Date().toISOString())}</StatNumber>
                    <StatHelpText>Current server time (UTC)</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Client Time</StatLabel>
                    <StatNumber fontSize="lg">{formatDate(new Date().toISOString())}</StatNumber>
                    <StatHelpText>Current browser time (local)</StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <HStack mt={4} spacing={4}>
                  <Badge colorScheme="blue">
                    <HStack spacing={1} p={1}>
                      <Icon as={FiSun} />
                      <Text>Transaction review: 24 hours</Text>
                    </HStack>
                  </Badge>
                  
                  <Badge colorScheme="purple">
                    <HStack spacing={1} p={1}>
                      <Icon as={FiMoon} />
                      <Text>Escrow period: 7 days</Text>
                    </HStack>
                  </Badge>
                </HStack>
              </CardBody>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  );
} 