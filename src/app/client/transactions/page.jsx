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
  Badge,
  Button,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Skeleton,
  Image,
  useToast,
  Icon,
  Divider
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { FiClock, FiCalendar, FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';

const TransactionStatusBadge = ({ status }) => {
  const statusConfig = {
    'PENDING': { color: 'gray', label: 'Pending' },
    'PROVIDER_REVIEW': { color: 'yellow', label: 'Awaiting Provider Review' },
    'DECLINED': { color: 'red', label: 'Declined' },
    'ESCROW': { color: 'blue', label: 'In Escrow' },
    'COMPLETED': { color: 'green', label: 'Completed' },
    'REFUNDED': { color: 'purple', label: 'Refunded' },
    'CANCELLED': { color: 'orange', label: 'Cancelled' }
  };

  const config = statusConfig[status] || { color: 'gray', label: status };
  
  return (
    <Badge colorScheme={config.color} fontSize="0.8em" px={2} py={1} borderRadius="md">
      {config.label}
    </Badge>
  );
};

export default function ClientTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        
        // Check session
        const session = await getSession();
        if (!session || !session.user) {
          router.push('/login');
          return;
        }
        
        // Fetch client transactions
        const response = await fetch('/api/client/transactions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        setError(err.message);
        toast({
          title: 'Error',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactions();
  }, [router, toast]);

  // Filter transactions by status
  const pendingTransactions = transactions.filter(
    tx => tx.status === 'PENDING' || tx.status === 'PROVIDER_REVIEW'
  );
  
  const activeTransactions = transactions.filter(
    tx => tx.status === 'ESCROW'
  );
  
  const completedTransactions = transactions.filter(
    tx => tx.status === 'COMPLETED'
  );
  
  const cancelledTransactions = transactions.filter(
    tx => tx.status === 'DECLINED' || tx.status === 'REFUNDED' || tx.status === 'CANCELLED'
  );

  // Get formatted date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const TransactionCard = ({ transaction }) => (
    <Card mb={4} overflow="hidden" variant="outline">
      <CardBody>
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          {/* Service Image */}
          <Box 
            width={{ base: '100%', md: '140px' }} 
            height={{ base: '140px', md: '140px' }}
            flexShrink={0}
          >
            <Image
              src={transaction.offer?.service?.photos?.[0] || '/images/placeholder-service.jpg'}
              alt={transaction.offer?.service?.name || 'Service'}
              borderRadius="md"
              objectFit="cover"
              width="100%"
              height="100%"
            />
          </Box>
          
          {/* Transaction Details */}
          <Box flex="1">
            <Flex justify="space-between" mb={2} align="flex-start" direction={{ base: 'column', sm: 'row' }}>
              <Heading as="h3" size="md" mb={{ base: 2, sm: 0 }}>
                {transaction.offer?.service?.name || 'Service Request'}
              </Heading>
              <TransactionStatusBadge status={transaction.status} />
            </Flex>
            
            <Text mb={2} color="gray.600">
              Provider: {transaction.offer?.provider?.name || 'Provider Name'}
            </Text>
            
            <Flex wrap="wrap" gap={4} mb={4}>
              <Flex align="center">
                <Icon as={FiDollarSign} mr={1} color="green.500" />
                <Text fontWeight="bold">${Number(transaction.amount).toFixed(2)}</Text>
              </Flex>
              
              <Flex align="center">
                <Icon as={FiCalendar} mr={1} color="blue.500" />
                <Text>Created: {formatDate(transaction.createdAt)}</Text>
              </Flex>
              
              {transaction.reviewDeadline && (
                <Flex align="center">
                  <Icon as={FiClock} mr={1} color="orange.500" />
                  <Text>Review deadline: {formatDate(transaction.reviewDeadline)}</Text>
                </Flex>
              )}
            </Flex>
            
            <Divider mb={4} />
            
            <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
              <Button 
                as={Link}
                href={`/services/${transaction.offer?.service?.id}`}
                size="sm"
                variant="outline"
              >
                View Service
              </Button>
              
              {transaction.status === 'ESCROW' && (
                <Text fontSize="sm" color="blue.500">
                  Funds will be released on {formatDate(transaction.escrowEndTime)}
                </Text>
              )}
              
              {transaction.status === 'PROVIDER_REVIEW' && (
                <Text fontSize="sm" color="yellow.500">
                  Awaiting provider approval
                </Text>
              )}
            </Flex>
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
  
  if (loading) {
    return (
      <Container maxW="container.lg" py={10}>
        <Heading as="h1" mb={6}>My Transactions</Heading>
        <Stack spacing={8}>
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={10}>
      <Heading as="h1" mb={6}>My Transactions</Heading>
      
      {error ? (
        <Box textAlign="center" py={10}>
          <Text color="red.500" mb={4}>{error}</Text>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Box>
      ) : transactions.length === 0 ? (
        <Box textAlign="center" py={10} borderWidth={1} borderRadius="lg">
          <Heading size="md" mb={4}>No Transactions Found</Heading>
          <Text mb={6}>You haven't made any service requests yet.</Text>
          <Button 
            as={Link}
            href="/services"
            colorScheme="blue"
          >
            Browse Services
          </Button>
        </Box>
      ) : (
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>All ({transactions.length})</Tab>
            <Tab>Pending ({pendingTransactions.length})</Tab>
            <Tab>Active ({activeTransactions.length})</Tab>
            <Tab>Completed ({completedTransactions.length})</Tab>
            <Tab>Cancelled ({cancelledTransactions.length})</Tab>
          </TabList>
          
          <TabPanels>
            {/* All Transactions */}
            <TabPanel px={0}>
              {transactions.map(transaction => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </TabPanel>
            
            {/* Pending Transactions */}
            <TabPanel px={0}>
              {pendingTransactions.length === 0 ? (
                <Text textAlign="center" py={4}>No pending transactions</Text>
              ) : (
                pendingTransactions.map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
              )}
            </TabPanel>
            
            {/* Active Transactions */}
            <TabPanel px={0}>
              {activeTransactions.length === 0 ? (
                <Text textAlign="center" py={4}>No active transactions</Text>
              ) : (
                activeTransactions.map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
              )}
            </TabPanel>
            
            {/* Completed Transactions */}
            <TabPanel px={0}>
              {completedTransactions.length === 0 ? (
                <Text textAlign="center" py={4}>No completed transactions</Text>
              ) : (
                completedTransactions.map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
              )}
            </TabPanel>
            
            {/* Cancelled Transactions */}
            <TabPanel px={0}>
              {cancelledTransactions.length === 0 ? (
                <Text textAlign="center" py={4}>No cancelled transactions</Text>
              ) : (
                cancelledTransactions.map(transaction => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Container>
  );
} 