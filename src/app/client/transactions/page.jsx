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
  Divider,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [transactionToCancel, setTransactionToCancel] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);

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
        console.log("Transactions data received:", data);
        
        // Log transactions for debugging
        if (data.length > 0) {
          console.log(`Received ${data.length} transactions`);
          data.forEach((tx, index) => {
            console.log(`[${index}] ID: ${tx.id}, Status: ${tx.status}, Amount: ${tx.amount}, Date: ${tx.createdAt}`);
          });
        }
        
        // Display all transactions without deduplication
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
  // Check if a pending transaction is less than 48 hours old
  const isPendingValid = (tx) => {
    if (tx.status !== 'PENDING' && tx.status !== 'PROVIDER_REVIEW') return true;
    
    const createdAt = new Date(tx.createdAt);
    const now = new Date();
    const diffHours = (now - createdAt) / (1000 * 60 * 60);
    
    return diffHours < 48; // Less than 48 hours old
  };
  
  // Filter out pending transactions older than a 48 hours
  const filteredTransactions = transactions.filter(isPendingValid);
  
  // Filter transactions by status
  const pendingTransactions = filteredTransactions.filter(
    tx => tx.status === 'PENDING' || tx.status === 'PROVIDER_REVIEW'
  );
  
  const activeTransactions = filteredTransactions.filter(
    tx => tx.status === 'ESCROW'
  );
  
  const completedTransactions = filteredTransactions.filter(
    tx => tx.status === 'COMPLETED'
  );
  
  const cancelledTransactions = filteredTransactions.filter(
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
            
            {transaction.offer?.partyService?.party && (
              <Text mb={2} fontSize="sm" color="purple.600">
                <strong>For party:</strong> {transaction.offer.partyService.party.name}
                {transaction.offer.partyService.party.date && 
                  ` (${formatDate(transaction.offer.partyService.party.date)})`}
              </Text>
            )}
            
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
              
              {transaction.offer?.partyService?.party && (
                <Button
                  as={Link}
                  href={`/client/my-party?id=${transaction.offer.partyService.party.id}`}
                  size="sm"
                  variant="outline"
                  colorScheme="purple"
                >
                  View Party
                </Button>
              )}
              
              {transaction.status === 'ESCROW' && (
                <Text fontSize="sm" color="blue.500">
                  Funds will be released on {formatDate(transaction.escrowEndTime)}
                </Text>
              )}
              
              {transaction.status === 'PROVIDER_REVIEW' && (
                <>
                  <Text fontSize="sm" color="yellow.500">
                    Awaiting provider approval
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleCancelTransaction(transaction.id)}
                  >
                    Cancel Request
                  </Button>
                </>
              )}
            </Flex>
            
            {/* Debug info in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <Box mt={4} p={2} bg="gray.100" borderRadius="md" fontSize="xs">
                <Text as="pre" overflowX="auto">
                  Transaction ID: {transaction.id}<br/>
                  Offer ID: {transaction.offerId}<br/>
                  Created: {transaction.createdAt}
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
  
  // Handle transaction cancellation
  const handleCancelTransaction = (transactionId) => {
    setTransactionToCancel(transactionId);
    onOpen();
  };

  // Confirm and process cancellation
  const confirmCancelTransaction = async () => {
    if (!transactionToCancel) return;
    
    try {
      setIsCanceling(true);
      
      const response = await fetch(`/api/transactions/${transactionToCancel}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel transaction');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state to reflect the cancellation
        setTransactions(transactions.map(tx => 
          tx.id === transactionToCancel 
            ? { ...tx, status: 'CANCELLED' } 
            : tx
        ));
        
        toast({
          title: 'Request cancelled',
          description: 'Your service request has been cancelled',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error?.message || 'Failed to cancel transaction');
      }
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCanceling(false);
      onClose();
    }
  };

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
      ) : filteredTransactions.length === 0 ? (
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
            <Tab>All ({filteredTransactions.length})</Tab>
            <Tab>Pending ({pendingTransactions.length})</Tab>
            <Tab>Active ({activeTransactions.length})</Tab>
            <Tab>Completed ({completedTransactions.length})</Tab>
            <Tab>Cancelled ({cancelledTransactions.length})</Tab>
          </TabList>
          
          <TabPanels>
            {/* All Transactions */}
            <TabPanel px={0}>
              {filteredTransactions.map(transaction => (
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
      
      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        onClose={onClose}
        leastDestructiveRef={undefined}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancel Service Request
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to cancel this service request? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={undefined} onClick={onClose} disabled={isCanceling}>
                No, Keep Request
              </Button>
              <Button 
                colorScheme="red"
                ml={3}
                onClick={confirmCancelTransaction}
                isLoading={isCanceling}
                loadingText="Cancelling"
              >
                Yes, Cancel Request
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
} 