'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  SimpleGrid,
  Badge,
  Button,
  Divider,
  HStack,
  Icon,
  Spinner,
  useToast,
  Card,
  CardBody,
  Flex,
  Image,
  Avatar,
  Skeleton
} from '@chakra-ui/react';
import { MdPayment, MdPending, MdLock, MdAccountBalance, MdCheckCircle, MdCancel, MdErrorOutline } from 'react-icons/md';
import { formatCurrency, formatDateTime, getRelativeTimeString } from '@/lib/utils/formatters';
import Link from 'next/link';

// Status badge mapper
const getStatusBadge = (status) => {
  const statusConfig = {
    'PENDING': { text: 'Pending', colorScheme: 'gray', icon: MdPending },
    'PROVIDER_REVIEW': { text: 'Pending Approval', colorScheme: 'yellow', icon: MdPending },
    'COMPLETED': { text: 'Completed', colorScheme: 'green', icon: MdCheckCircle },
    'REFUNDED': { text: 'Refunded', colorScheme: 'purple', icon: MdAccountBalance },
    'DECLINED': { text: 'Declined', colorScheme: 'red', icon: MdCancel },
    'DISPUTED': { text: 'Disputed', colorScheme: 'orange', icon: MdErrorOutline },
    'default': { text: 'Unknown', colorScheme: 'gray', icon: MdPending }
  };

  const config = statusConfig[status] || statusConfig.default;
  
  return (
    <Badge 
      colorScheme={config.colorScheme}
      display="flex"
      alignItems="center"
      px={2}
      py={1}
      borderRadius="md"
    >
      <Icon as={config.icon} mr={1} />
      {config.text}
    </Badge>
  );
};

const TransactionCard = ({ transaction, userRole }) => {
  const isProvider = userRole === 'PROVIDER';
  const isClient = userRole === 'CLIENT';
  
  // Get service name
  const serviceName = transaction.offer.service.name;
  
  // Get counterparty (the other person in transaction)
  const counterparty = isProvider 
    ? transaction.offer.client 
    : transaction.offer.provider;
  
  // Get party details
  const partyName = transaction.party?.name || 'Direct Booking';
  const partyDate = transaction.party?.date;
  
  // Get important timestamps
  const reviewDeadline = transaction.reviewDeadline;
  const escrowEndTime = transaction.escrowEndTime;
  
  // Determine if action buttons should be shown
  const showApproveButton = isProvider && transaction.status === 'PROVIDER_REVIEW';
  const showChatButton = transaction.status !== 'PENDING';
  
  return (
    <Card borderRadius="lg" overflow="hidden" variant="outline">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Header with service info and status */}
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Box 
                bg="blue.100" 
                p={2} 
                borderRadius="md"
                color="blue.600"
              >
                <Icon as={MdPayment} boxSize={5} />
              </Box>
              <Box>
                <Text fontWeight="bold">{serviceName}</Text>
                <Text fontSize="sm" color="gray.600">{partyName}</Text>
              </Box>
            </HStack>
            {getStatusBadge(transaction.status)}
          </Flex>
          
          <Divider />
          
          {/* Transaction details */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">Amount</Text>
              <Text fontWeight="bold">{formatCurrency(transaction.amount)}</Text>
            </VStack>
            
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">Date</Text>
              <Text>{formatDateTime(transaction.createdAt)}</Text>
            </VStack>
            
            {(reviewDeadline && transaction.status === 'PROVIDER_REVIEW') && (
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.500">Review Deadline</Text>
                <Text>{getRelativeTimeString(reviewDeadline)}</Text>
              </VStack>
            )}
            
            {(escrowEndTime && transaction.status === 'COMPLETED') && (
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.500">Payment Release</Text>
                <Text>{getRelativeTimeString(escrowEndTime)}</Text>
              </VStack>
            )}
            
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">
                {isProvider ? 'Client' : 'Provider'}
              </Text>
              <HStack>
                <Avatar 
                  size="xs" 
                  name={counterparty?.name}
                  src={counterparty?.profile?.avatar} 
                />
                <Text>{counterparty?.name}</Text>
              </HStack>
            </VStack>
          </SimpleGrid>
          
          {/* Action buttons */}
          {(showApproveButton || showChatButton) && (
            <>
              <Divider />
              <HStack justify="flex-end" spacing={3}>
                {showChatButton && (
                  <Link href={`/chats/${transaction.offer.id}`} passHref>
                    <Button size="sm" variant="outline">
                      Message
                    </Button>
                  </Link>
                )}
                
                {showApproveButton && (
                  <>
                    <Link href={`/provider/transactions/${transaction.id}/decline`} passHref>
                      <Button size="sm" variant="outline" colorScheme="red">
                        Decline
                      </Button>
                    </Link>
                    
                    <Link href={`/provider/transactions/${transaction.id}/approve`} passHref>
                      <Button size="sm" colorScheme="green">
                        Approve
                      </Button>
                    </Link>
                  </>
                )}
              </HStack>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

const TransactionsList = ({ userRole }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/transactions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setTransactions(data.data);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch transactions');
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [toast]);
  
  // Filter transactions that need attention
  const pendingTransactions = transactions.filter(
    t => t.status === 'PROVIDER_REVIEW' || t.status === 'PENDING'
  );
  
  // Other transactions
  const otherTransactions = transactions.filter(
    t => t.status !== 'PROVIDER_REVIEW' && t.status !== 'PENDING'
  );
  
  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Heading size="md" mb={2}>Your Transactions</Heading>
        
        {isLoading ? (
          // Loading skeleton
          <VStack spacing={4} align="stretch">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} height="200px" borderRadius="lg" />
            ))}
          </VStack>
        ) : error ? (
          // Error state
          <Box p={4} borderRadius="md" bg="red.50">
            <Text color="red.500">{error}</Text>
            <Button 
              mt={2} 
              onClick={() => window.location.reload()}
              colorScheme="red"
              size="sm"
            >
              Try Again
            </Button>
          </Box>
        ) : transactions.length === 0 ? (
          // Empty state
          <Box textAlign="center" py={8}>
            <Icon as={MdPayment} boxSize={12} color="gray.300" mb={4} />
            <Heading size="md" mb={2} color="gray.500">No Transactions Yet</Heading>
            <Text color="gray.500">
              {userRole === 'PROVIDER' 
                ? 'When clients book your services, transactions will appear here.'
                : 'When you book services, your transactions will appear here.'}
            </Text>
            {userRole === 'CLIENT' && (
              <Button 
                mt={4} 
                colorScheme="blue"
                as={Link}
                href="/services"
              >
                Browse Services
              </Button>
            )}
          </Box>
        ) : (
          <VStack spacing={6} align="stretch">
            {/* Pending transactions section */}
            {pendingTransactions.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb={3}>Needs Attention</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {pendingTransactions.map(transaction => (
                    <TransactionCard 
                      key={transaction.id} 
                      transaction={transaction}
                      userRole={userRole}
                    />
                  ))}
                </SimpleGrid>
              </Box>
            )}
            
            {/* Other transactions section */}
            {otherTransactions.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb={3}>
                  {pendingTransactions.length > 0 ? 'Other Transactions' : 'All Transactions'}
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {otherTransactions.map(transaction => (
                    <TransactionCard 
                      key={transaction.id} 
                      transaction={transaction}
                      userRole={userRole}
                    />
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default TransactionsList; 