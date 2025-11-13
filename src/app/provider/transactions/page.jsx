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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { FiClock, FiCalendar, FiDollarSign, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import Link from 'next/link';
import { getTransactionStatusConfig, transactionRequiresAction } from '@/utils/statusConfig';
import ProviderLayout from '../components/ProviderLayout';

const TransactionStatusBadge = ({ status }) => {
  const config = getTransactionStatusConfig(status);
  
  return (
    <Badge colorScheme={config.color} fontSize="0.8em" px={2} py={1} borderRadius="md">
      {config.label}
    </Badge>
  );
};

export default function ProviderTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionType, setActionType] = useState(null);
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

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
        
        // Fetch provider transactions
        const response = await fetch('/api/provider/transactions');
        
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
  const pendingReviewTransactions = transactions.filter(
    tx => transactionRequiresAction(tx.status)
  );
  
  const activeTransactions = transactions.filter(
    tx => tx.status === 'ACTIVE' || tx.status === 'IN_PROGRESS'
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

  const handleApproveRequest = (transaction) => {
    setSelectedTransaction(transaction);
    setActionType('approve');
    onOpen();
  };

  const handleDeclineRequest = (transaction) => {
    setSelectedTransaction(transaction);
    setActionType('decline');
    onOpen();
  };

  const handleConfirmAction = async () => {
    if (!selectedTransaction || !actionType) return;
    
    try {
      setProcessingAction(true);
      
      const endpoint = `/api/transactions/${selectedTransaction.id}/${actionType}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${actionType} transaction`);
      }
      
      // Update the local state
      setTransactions(prevTransactions => 
        prevTransactions.map(tx => 
          tx.id === selectedTransaction.id
            ? { 
                ...tx, 
                status: actionType === 'approve' ? 'COMPLETED' : 'DECLINED' 
              }
            : tx
        )
      );
      
      toast({
        title: actionType === 'approve' ? 'Request Approved' : 'Request Declined',
        description: actionType === 'approve' 
          ? 'Transaction is now complete. Payment is being processed and will be transferred to your account.' 
          : 'The client has been notified and will receive a refund.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (err) {
      toast({
        title: 'Action Failed',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingAction(false);
      onClose();
    }
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
              src={transaction.service?.photos?.[0] || '/images/placeholder-service.jpg'}
              alt={transaction.service?.name || 'Service'}
              fallbackSrc="/images/placeholder-service.jpg"
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
                {transaction.service?.name || 'Service Request'}
              </Heading>
              <TransactionStatusBadge status={transaction.status} />
            </Flex>
            
            <Text mb={2} color="gray.600">
              Client: {transaction.client?.name || 'Client Name'}
            </Text>
            
            <Flex wrap="wrap" gap={4} mb={4}>
              <Flex align="center">
                <Icon as={FiDollarSign} mr={1} color="green.500" />
                <Text fontWeight="bold">${Number(transaction.amount).toFixed(2)}</Text>
                <Text fontSize="sm" ml={2} color="gray.500">
                  (You receive: ${(Number(transaction.amount) * 0.95).toFixed(2)})
                </Text>
              </Flex>
              
              <Flex align="center">
                <Icon as={FiCalendar} mr={1} color="blue.500" />
                <Text>Created: {formatDate(transaction.createdAt)}</Text>
              </Flex>
              
              {transactionRequiresAction(transaction.status) && transaction.reviewDeadline && (
                <Flex align="center">
                  <Icon as={FiClock} mr={1} color="orange.500" />
                  <Text>Respond by: {formatDate(transaction.reviewDeadline)}</Text>
                </Flex>
              )}
            </Flex>
            
            <Divider mb={4} />
            
            <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
              <Flex gap={2}>
                <Button 
                  as={Link}
                  href={`/provider/transactions/${transaction.id}`}
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<FiInfo />}
                >
                  View Details
                </Button>
                <Button 
                  as={Link}
                  href={`/services/${transaction.service?.id}`}
                  size="sm"
                  variant="outline"
                >
                  View Service
                </Button>
              </Flex>
              
              {transactionRequiresAction(transaction.status) && (
                <Flex gap={2}>
                  <Button
                    leftIcon={<FiCheck />}
                    colorScheme="green"
                    size="sm"
                    onClick={() => handleApproveRequest(transaction)}
                  >
                    Approve
                  </Button>
                  <Button
                    leftIcon={<FiX />}
                    colorScheme="red"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineRequest(transaction)}
                  >
                    Decline
                  </Button>
                </Flex>
              )}
            </Flex>
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
  
  if (loading) {
    return (
      <ProviderLayout>
        <Container maxW="container.lg" py={10}>
          <Heading as="h1" mb={6}>My Transactions</Heading>
          <Stack spacing={8}>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </Stack>
        </Container>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
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
          <Text mb={6}>You don't have any transactions yet.</Text>
          <Button 
            as={Link}
            href="/provider/services"
            colorScheme="blue"
          >
            Manage Services
          </Button>
        </Box>
      ) : (
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>All ({transactions.length})</Tab>
            <Tab 
              color={pendingReviewTransactions.length > 0 ? "red.500" : undefined}
              fontWeight={pendingReviewTransactions.length > 0 ? "bold" : undefined}
            >
              Action Required ({pendingReviewTransactions.length})
            </Tab>
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
            
            {/* Pending Review Transactions */}
            <TabPanel px={0}>
              {pendingReviewTransactions.length === 0 ? (
                <Text textAlign="center" py={4}>No requests requiring action</Text>
              ) : (
                pendingReviewTransactions.map(transaction => (
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
        leastDestructiveRef={undefined}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {actionType === 'approve' ? 'Approve Service Request' : 'Decline Service Request'}
            </AlertDialogHeader>

            <AlertDialogBody>
              {actionType === 'approve' 
                ? "You're approving this service request. Payment will be processed and transferred to your PayPal account immediately." 
                : "You're declining this service request. The client will be notified and receive a refund."
              }
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={undefined} onClick={onClose} disabled={processingAction}>
                Cancel
              </Button>
              <Button 
                colorScheme={actionType === 'approve' ? "green" : "red"}
                onClick={handleConfirmAction}
                ml={3}
                isLoading={processingAction}
              >
                {actionType === 'approve' ? 'Approve' : 'Decline'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
    </ProviderLayout>
  );
} 