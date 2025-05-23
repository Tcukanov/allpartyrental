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
  ButtonGroup,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  VStack
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  SearchIcon, 
  ExternalLinkIcon, 
  ChevronDownIcon, 
  InfoIcon,
  ViewIcon,
  EditIcon,
  CheckIcon
} from '@chakra-ui/icons';
import { FiRefreshCw, FiDownload, FiEye, FiTool } from 'react-icons/fi';
import NextLink from 'next/link';

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch transactions
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
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
      toast({
        title: 'Error',
        description: `Failed to fetch transactions: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [session, status, router, toast]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions();
  };

  // Filter transactions based on status and search term
  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.status === filter;
    const matchesSearch = 
      searchTerm === '' || 
      transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.partyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.serviceName?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      case 'ESCROW':
        return 'blue';
      case 'PROVIDER_REVIEW':
        return 'orange';
      case 'APPROVED':
        return 'green';
      case 'DECLINED':
        return 'red';
      case 'FAILED':
        return 'red';
      case 'REFUNDED':
        return 'purple';
      case 'DISPUTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Generate PayPal dashboard URL
  const getPayPalDashboardUrl = () => {
    return 'https://sandbox.paypal.com/merchantapps/home#/activity/all';
  };

  // Export transactions to CSV
  const exportToCsv = () => {
    const csvData = filteredTransactions.map(t => ({
      ID: t.id,
      Date: formatDate(t.createdAt),
      Amount: t.amount,
      Status: t.status,
      Client: t.userName || 'N/A',
      Provider: t.providerName || 'N/A',
      Service: t.serviceName || 'N/A',
      Party: t.partyName || 'N/A',
      PaymentIntentId: t.paymentIntentId || 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <VStack align="start" spacing={1}>
            <Heading as="h1" size="xl">Transaction Management</Heading>
            <Text color="gray.600">
              Monitor and manage all financial transactions in the system
            </Text>
          </VStack>
          
          <ButtonGroup>
            <Tooltip label="Refresh data">
              <IconButton
                icon={<FiRefreshCw />}
                onClick={handleRefresh}
                isLoading={isRefreshing}
                aria-label="Refresh"
                variant="outline"
              />
            </Tooltip>
            <Tooltip label="Export to CSV">
              <IconButton
                icon={<FiDownload />}
                onClick={exportToCsv}
                aria-label="Export"
                variant="outline"
                isDisabled={filteredTransactions.length === 0}
              />
            </Tooltip>
            <Button
              as="a"
              href={getPayPalDashboardUrl()}
              target="_blank"
              rightIcon={<ExternalLinkIcon />}
              colorScheme="blue"
              variant="outline"
            >
              PayPal Dashboard
            </Button>
            <Button
              as={NextLink}
              href="/debug/payment-tracker"
              rightIcon={<FiTool />}
              colorScheme="purple"
              variant="outline"
            >
              Payment Tracker
            </Button>
          </ButtonGroup>
        </Flex>
      </Box>

      {isLoading ? (
        <Flex justify="center" align="center" h="60vh">
          <Spinner size="xl" thickness="4px" color="blue.500" />
        </Flex>
      ) : (
        <>
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
                <option value="PENDING">Pending</option>
                <option value="ESCROW">Escrow</option>
                <option value="PROVIDER_REVIEW">Provider Review</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
                <option value="DECLINED">Declined</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="DISPUTED">Disputed</option>
              </Select>
            </HStack>
            
            <HStack>
              <Input
                placeholder="Search transactions, users, services..."
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
                    <Th>Transaction ID</Th>
                    <Th>Date</Th>
                    <Th>Service</Th>
                    <Th>Client</Th>
                    <Th>Provider</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Status</Th>
                    <Th>PayPal ID</Th>
                    <Th width="200px">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredTransactions.map((transaction) => (
                    <Tr key={transaction.id}>
                      <Td>
                        <Text fontFamily="mono" fontSize="sm">
                          {transaction.id.substring(0, 8)}...
                        </Text>
                      </Td>
                      <Td>{formatDate(transaction.createdAt)}</Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{transaction.serviceName || 'N/A'}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {transaction.partyName || 'Unknown Party'}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{transaction.userName || 'N/A'}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {transaction.userEmail || 'unknown@example.com'}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontWeight="medium">{transaction.providerName || 'N/A'}</Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontWeight="bold">${transaction.amount?.toFixed(2) || '0.00'}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(transaction.status)} size="sm">
                          {transaction.status || 'N/A'}
                        </Badge>
                      </Td>
                      <Td>
                        {transaction.paymentIntentId ? (
                          <Text fontFamily="mono" fontSize="xs">
                            {transaction.paymentIntentId.substring(0, 12)}...
                          </Text>
                        ) : (
                          <Text fontSize="xs" color="gray.400">No PayPal ID</Text>
                        )}
                      </Td>
                      <Td>
                        <ButtonGroup size="sm" spacing={2}>
                          <Tooltip label="View Details">
                            <IconButton
                              as={NextLink}
                              href={`/admin/transactions/${transaction.id}`}
                              icon={<ViewIcon />}
                              variant="outline"
                              colorScheme="blue"
                              aria-label="View details"
                            />
                          </Tooltip>
                          
                          <Menu>
                            <MenuButton as={IconButton} icon={<ChevronDownIcon />} variant="outline" size="sm">
                            </MenuButton>
                            <MenuList>
                              <MenuItem 
                                icon={<FiTool />}
                                as={NextLink}
                                href={`/debug/payment-tracker?transactionId=${transaction.id}`}
                              >
                                Debug Payment
                              </MenuItem>
                              
                              {transaction.paymentIntentId && (
                                <MenuItem 
                                  icon={<InfoIcon />}
                                  as={NextLink}
                                  href={`/debug/payment-tracker?orderId=${transaction.paymentIntentId}`}
                                >
                                  Debug PayPal Order
                                </MenuItem>
                              )}
                              
                              <MenuItem 
                                icon={<ExternalLinkIcon />}
                                as="a"
                                href={`/api/transactions/${transaction.id}/approve`}
                                target="_blank"
                              >
                                Approve Transaction
                              </MenuItem>
                              
                              <MenuItem 
                                icon={<ExternalLinkIcon />}
                                as="a"
                                href={getPayPalDashboardUrl()}
                                target="_blank"
                              >
                                View in PayPal
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Card>
              <CardBody textAlign="center" py={10}>
                <Text fontSize="lg" color="gray.500">
                  {searchTerm || filter !== 'all' 
                    ? 'No transactions match your current filters' 
                    : 'No transactions found'
                  }
                </Text>
                {(searchTerm || filter !== 'all') && (
                  <Button 
                    mt={4} 
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}
    </Container>
  );
} 