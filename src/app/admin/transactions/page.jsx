"use client";

import { useState, useEffect } from 'react';
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
  Badge,
  Select,
  Input,
  HStack,
  Button,
  Flex,
  useToast,
  Spinner,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SearchIcon, ExternalLinkIcon } from '@chakra-ui/icons';

// Mock transaction data for display while API is being fixed
const MOCK_TRANSACTIONS = [
  {
    id: "tx_mock1",
    amount: 299.99,
    status: "COMPLETED",
    description: "Payment for Birthday Party Decorations",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    partyId: "party_123",
    userId: "user_456",
    partyName: "Alice's Birthday",
    userName: "John Doe",
    userEmail: "john@example.com"
  },
  {
    id: "tx_mock2",
    amount: 149.50,
    status: "PENDING",
    description: "Deposit for Wedding Photography",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    partyId: "party_789",
    userId: "user_101",
    partyName: "Smith Wedding",
    userName: "Sarah Smith",
    userEmail: "sarah@example.com"
  },
  {
    id: "tx_mock3",
    amount: 75.00,
    status: "REFUNDED",
    description: "Cancelled catering service",
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    partyId: "party_456",
    userId: "user_789",
    partyName: "Corporate Event",
    userName: "Michael Johnson",
    userEmail: "michael@example.com"
  },
  {
    id: "tx_mock4",
    amount: 350.00,
    status: "FAILED",
    description: "Failed payment for entertainment services",
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    partyId: "party_321",
    userId: "user_654",
    partyName: "Children's Party",
    userName: "Emily Davis",
    userEmail: "emily@example.com"
  }
];

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalAmount: 0,
    thisMonth: 0,
    avgAmount: 0,
    count: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiError, setApiError] = useState(null);
  const [useMockData, setUseMockData] = useState(false);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (status === 'unauthenticated') {
        router.push('/auth/signin');
        return;
      }

      if (status === 'authenticated' && session.user.role !== 'ADMIN') {
        toast({
          title: 'Access denied',
          description: 'You do not have permission to view this page',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push('/');
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/transactions');
        
        if (!response.ok) {
          // If api returns an error, use mock data
          const errorData = await response.json();
          console.error('API Error:', errorData);
          
          setApiError(errorData.error || 'Failed to fetch transactions');
          
          // Fall back to mock data
          setUseMockData(true);
          setTransactions(MOCK_TRANSACTIONS);
          
          // Calculate statistics from mock data
          const total = MOCK_TRANSACTIONS.reduce((sum, t) => sum + (t.amount || 0), 0);
          setStatistics({
            totalAmount: total.toFixed(2),
            thisMonth: total.toFixed(2),
            avgAmount: (total / MOCK_TRANSACTIONS.length).toFixed(2),
            count: MOCK_TRANSACTIONS.length
          });
          
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setTransactions(data.data || []);
          
          // Calculate statistics
          const total = data.data.reduce((sum, t) => sum + (t.amount || 0), 0);
          const now = new Date();
          const thisMonth = data.data.filter(t => {
            const date = new Date(t.createdAt);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).reduce((sum, t) => sum + (t.amount || 0), 0);
          
          setStatistics({
            totalAmount: total.toFixed(2),
            thisMonth: thisMonth.toFixed(2),
            avgAmount: data.data.length > 0 ? (total / data.data.length).toFixed(2) : 0,
            count: data.data.length
          });
        } else {
          throw new Error(data.error || 'Failed to fetch transactions');
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        
        // Set error message and use mock data
        setApiError(error.message || 'Failed to fetch transactions');
        setUseMockData(true);
        setTransactions(MOCK_TRANSACTIONS);
        
        // Calculate statistics from mock data
        const total = MOCK_TRANSACTIONS.reduce((sum, t) => sum + (t.amount || 0), 0);
        setStatistics({
          totalAmount: total.toFixed(2),
          thisMonth: total.toFixed(2),
          avgAmount: (total / MOCK_TRANSACTIONS.length).toFixed(2),
          count: MOCK_TRANSACTIONS.length
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [session, status, router, toast]);

  // Filter transactions based on status and search term
  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.status === filter;
    const matchesSearch = 
      searchTerm === '' || 
      transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.partyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'green';
      case 'PENDING':
        return 'yellow';
      case 'FAILED':
        return 'red';
      case 'REFUNDED':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading as="h1" size="xl">Transaction Management</Heading>
        <Text color="gray.600" mt={2}>
          Monitor and manage all financial transactions in the system
        </Text>
      </Box>

      {isLoading ? (
        <Flex justify="center" align="center" h="60vh">
          <Spinner size="xl" thickness="4px" color="blue.500" />
        </Flex>
      ) : (
        <>
          {useMockData && (
            <Alert status="warning" mb={6}>
              <AlertIcon />
              <Box>
                <AlertTitle>Using demo data</AlertTitle>
                <AlertDescription>
                  {apiError ? (
                    <>
                      The transaction API returned an error: "{apiError}". We're showing mock data for demonstration purposes.
                      The real transaction data will be available once the database schema is updated.
                    </>
                  ) : (
                    "Showing mock transaction data for demonstration. Real transaction data will be available soon."
                  )}
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Transactions</StatLabel>
                  <StatNumber>{statistics.count}</StatNumber>
                  <StatHelpText>All processed transactions</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Amount</StatLabel>
                  <StatNumber>${statistics.totalAmount}</StatNumber>
                  <StatHelpText>Cumulative transaction value</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>This Month</StatLabel>
                  <StatNumber>${statistics.thisMonth}</StatNumber>
                  <StatHelpText>Current month's transaction value</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Average Transaction</StatLabel>
                  <StatNumber>${statistics.avgAmount}</StatNumber>
                  <StatHelpText>Average transaction value</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filters */}
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" mb={6} gap={4}>
            <HStack>
              <Select 
                w={{ base: 'full', md: '200px' }}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </Select>
            </HStack>
            
            <HStack>
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                width={{ base: 'full', md: '300px' }}
              />
              <Button leftIcon={<SearchIcon />} colorScheme="blue">
                Search
              </Button>
            </HStack>
          </Flex>

          {/* Transactions Table */}
          {filteredTransactions.length > 0 ? (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Date</Th>
                    <Th>Description</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Status</Th>
                    <Th>Party ID</Th>
                    <Th>User ID</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredTransactions.map((transaction) => (
                    <Tr key={transaction.id}>
                      <Td>{transaction.id}</Td>
                      <Td>{formatDate(transaction.createdAt)}</Td>
                      <Td>{transaction.description || 'N/A'}</Td>
                      <Td isNumeric>${transaction.amount?.toFixed(2) || '0.00'} {transaction.currency ? transaction.currency.toUpperCase() : ''}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(transaction.status)}>
                          {transaction.status || 'N/A'}
                        </Badge>
                        {transaction.failureMessage && (
                          <Text fontSize="xs" color="red.500" mt={1}>
                            {transaction.failureMessage}
                          </Text>
                        )}
                      </Td>
                      <Td>{transaction.partyName || transaction.partyId || 'N/A'}</Td>
                      <Td>
                        {transaction.userName || transaction.userId || 'N/A'}
                        {transaction.receiptUrl && (
                          <Button 
                            as="a" 
                            href={transaction.receiptUrl} 
                            target="_blank" 
                            size="xs" 
                            colorScheme="blue" 
                            leftIcon={<ExternalLinkIcon />}
                            ml={2}
                          >
                            Receipt
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Box textAlign="center" py={10}>
              <Text fontSize="lg">No transactions found</Text>
              <Text color="gray.500">
                {filter !== 'all' || searchTerm 
                  ? 'Try changing your filters or search term'
                  : 'There are no transactions in the system yet'}
              </Text>
            </Box>
          )}
        </>
      )}
    </Container>
  );
} 