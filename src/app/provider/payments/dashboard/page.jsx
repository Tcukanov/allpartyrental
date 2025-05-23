'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  Box,
  Text,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Grid,
  GridItem,
  Button,
  Link,
  HStack,
  Select,
  Icon,
  Tooltip,
  Alert,
  AlertIcon,
  Tag
} from '@chakra-ui/react';
import { FiCalendar, FiDollarSign, FiClock, FiArrowUp, FiArrowDown, FiExternalLink } from 'react-icons/fi';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import NextLink from 'next/link';

export default function ProviderPaymentDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState('current');
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    completedAmount: 0, 
    transactionCount: 0,
    averageTransaction: 0
  });
  const [error, setError] = useState(null);
  const [isSandbox, setIsSandbox] = useState(true); // Default to sandbox mode
  const [paypalDetails, setPaypalDetails] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      let startDate, endDate;
      const now = new Date();
      
      switch(dateRange) {
        case 'current':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'last':
          startDate = startOfMonth(subMonths(now, 1));
          endDate = endOfMonth(subMonths(now, 1));
          break;
        case 'last3':
          startDate = startOfMonth(subMonths(now, 3));
          endDate = now;
          break;
        case 'all':
          startDate = new Date(2020, 0, 1); // some far back date
          endDate = now;
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }

      // Convert to ISO strings
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Fetch transactions from API
      const response = await fetch(`/api/provider/transactions/payments?startDate=${startDateStr}&endDate=${endDateStr}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process the data
      if (data.success) {
        setTransactions(data.transactions || []);
        
        // Set sandbox status if available
        if (data.transactions?.length > 0) {
          setIsSandbox(data.transactions[0].isSandbox || true);
        }

        // Save PayPal details if available
        if (data.paypalDetails) {
          setPaypalDetails(data.paypalDetails);
          setIsSandbox(data.paypalDetails.isSandbox || true);
        }
        
        // Calculate statistics - fix total calculation to exclude rejected/cancelled transactions
        const validStatuses = ['COMPLETED', 'PENDING', 'PROVIDER_REVIEW', 'ESCROW'];
        
        // Filter transactions with valid statuses for total earnings
        const validTransactions = data.transactions.filter(tx => 
          validStatuses.includes(tx.status)
        );
        
        const total = validTransactions.reduce((sum, tx) => sum + Number(tx.providerAmount || 0), 0);
        
        const pending = data.transactions
          .filter(tx => tx.status === 'PROVIDER_REVIEW' || tx.status === 'PENDING')
          .reduce((sum, tx) => sum + Number(tx.providerAmount || 0), 0);
          
        const completed = data.transactions
          .filter(tx => tx.status === 'COMPLETED')
          .reduce((sum, tx) => sum + Number(tx.providerAmount || 0), 0);
          
        setStats({
          totalEarned: total,
          pendingAmount: pending,
          completedAmount: completed,
          transactionCount: validTransactions.length,
          averageTransaction: validTransactions.length ? total / validTransactions.length : 0
        });
      } else {
        throw new Error(data.error || 'Failed to fetch transaction data');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    let color;
    let label = status;
    
    switch(status) {
      case 'COMPLETED':
        color = 'green';
        break;
      case 'PENDING':
      case 'PROVIDER_REVIEW':
        color = 'yellow';
        label = 'Pending';
        break;
      case 'DECLINED':
      case 'CANCELLED':
        color = 'red';
        break;
      case 'REFUNDED':
        color = 'purple';
        break;
      default:
        color = 'gray';
    }
    
    return <Badge colorScheme={color}>{label}</Badge>;
  };

  const getPaymentStatus = (transaction) => {
    if (transaction.status === 'COMPLETED' && transaction.transferId) {
      return <Badge colorScheme="green">Paid</Badge>;
    } else if (transaction.status === 'COMPLETED' && !transaction.transferId) {
      return <Badge colorScheme="blue">Processing</Badge>;
    } else {
      return <Badge colorScheme="yellow">Pending</Badge>;
    }
  };
  
  // Get the PayPal activity URL for a transaction (sandbox or production)
  const getPayPalActivityUrl = (transferId) => {
    if (!transferId) return null;
    
    // Determine if this is a sandbox transaction
    const usesSandbox = isSandbox || 
                        transferId?.startsWith('SANDBOX-') || 
                        transferId?.includes('sandbox') ||
                        (paypalDetails?.paypalEnvironment === 'SANDBOX');
    
    // Remove any 'SANDBOX-' prefix from the ID before building URL
    const cleanId = transferId.replace('SANDBOX-', '');
    
    // For batch payouts (starting with batch_)
    if (transferId.startsWith('batch_')) {
      const baseUrl = usesSandbox
        ? 'https://sandbox.paypal.com/merchantapps/home#/reporting/payouts-batch/details/'
        : 'https://paypal.com/merchantapps/home#/reporting/payouts-batch/details/';
      
      return `${baseUrl}${cleanId}`;
    } 
    
    // For capture IDs (no specific pattern, but not batch_)
    else if (transferId.includes('CAP-')) {
      const baseUrl = usesSandbox
        ? 'https://sandbox.paypal.com/merchantapps/home#/activity/payments/details/'
        : 'https://paypal.com/merchantapps/home#/activity/payments/details/';
      
      return `${baseUrl}${cleanId}`;
    }
    
    // For other transaction IDs
    else {
      const baseUrl = usesSandbox
        ? 'https://sandbox.paypal.com/merchantapps/home#/activity/all'
        : 'https://paypal.com/merchantapps/home#/activity/all';
      
      return baseUrl; // Just link to activity page as fallback
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Payment Dashboard</Heading>
          <HStack spacing={2}>
            <Text color="gray.600">Track your earnings and payment history</Text>
            {isSandbox && (
              <Tag size="sm" colorScheme="purple" borderRadius="full">
                Sandbox Mode
              </Tag>
            )}
          </HStack>
        </Box>
        <HStack>
          <Text>Time period:</Text>
          <Select 
            value={dateRange} 
            onChange={e => setDateRange(e.target.value)}
            w="180px"
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="last3">Last 3 Months</option>
            <option value="all">All Time</option>
          </Select>
        </HStack>
      </Flex>

      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Earnings</StatLabel>
              <StatNumber fontSize="2xl" color="green.500">{formatCurrency(stats.totalEarned)}</StatNumber>
              <StatHelpText>
                <Icon as={FiArrowUp} mr={1} color="green.400" />
                Valid transactions only
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Pending Payments</StatLabel>
              <StatNumber fontSize="2xl" color="yellow.500">{formatCurrency(stats.pendingAmount)}</StatNumber>
              <StatHelpText>
                <Icon as={FiClock} mr={1} color="yellow.400" />
                Awaiting completion
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Completed Payments</StatLabel>
              <StatNumber fontSize="2xl" color="blue.500">{formatCurrency(stats.completedAmount)}</StatNumber>
              <StatHelpText>
                <Icon as={FiDollarSign} mr={1} color="blue.400" />
                Received in account
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Average Transaction</StatLabel>
              <StatNumber fontSize="2xl" color="purple.500">{formatCurrency(stats.averageTransaction)}</StatNumber>
              <StatHelpText>
                <Icon as={FiArrowUp} mr={1} color="purple.400" />
                {stats.transactionCount} transactions
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Payment Account Status */}
      {!isLoading && (
        <Alert 
          status={paypalDetails?.paypalEmail ? "success" : "info"} 
          variant="left-accent" 
          mb={6}
        >
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">
              {paypalDetails?.paypalEmail 
                ? `Payment Account: ${paypalDetails.paypalEmail}` 
                : "Payment Account Setup"
              }
            </Text>
            <Text>
              {paypalDetails?.paypalEmail
                ? `Your PayPal ${isSandbox ? 'Sandbox' : ''} account is connected.`
                : "Configure your payment account settings to receive payments directly."
              }{' '}
              <Link as={NextLink} href="/provider/settings/payments" color="blue.500" fontWeight="bold">
                Manage Payment Settings
              </Link>
            </Text>
          </Box>
        </Alert>
      )}

      {/* Transaction List */}
      <Card mb={8}>
        <CardBody>
          <Heading size="md" mb={4}>Transaction History</Heading>
          
          {isLoading ? (
            <Flex justify="center" py={8}>
              <Spinner size="xl" />
            </Flex>
          ) : transactions.length === 0 ? (
            <Text textAlign="center" py={6} color="gray.500">
              No transaction history found for the selected period.
            </Text>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Service</Th>
                    <Th>Client</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Status</Th>
                    <Th>Payment</Th>
                    <Th>Payment ID</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.map(tx => (
                    <Tr key={tx.id}>
                      <Td>{formatDate(tx.createdAt)}</Td>
                      <Td>
                        <Link 
                          as={NextLink} 
                          href={`/provider/transactions/${tx.id}`}
                          color="blue.500"
                        >
                          {tx.serviceName || 'Service'}
                        </Link>
                      </Td>
                      <Td>{tx.clientName || 'Client'}</Td>
                      <Td isNumeric fontWeight="bold">
                        {formatCurrency(tx.providerAmount || 0)}
                      </Td>
                      <Td>{getStatusBadge(tx.status)}</Td>
                      <Td>{getPaymentStatus(tx)}</Td>
                      <Td>
                        {tx.transferId ? (
                          <Tooltip label={`View in PayPal ${isSandbox ? 'Sandbox' : ''}`}>
                            <Link 
                              href={getPayPalActivityUrl(tx.transferId)}
                              isExternal
                              color="blue.500"
                              display="flex"
                              alignItems="center"
                            >
                              <Text isTruncated maxW="120px">
                                {tx.transferId.substring(0, 12)}...
                              </Text>
                              <Icon as={FiExternalLink} ml={1} />
                            </Link>
                          </Tooltip>
                        ) : tx.paymentIntentId ? (
                          <Tooltip label="Payment ID (not yet transferred)">
                            <Text color="gray.500" isTruncated maxW="120px">
                              {tx.paymentIntentId.substring(0, 12)}...
                            </Text>
                          </Tooltip>
                        ) : (
                          <Text color="gray.400">—</Text>
                        )}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {tx.paymentIntentId && (
                            <Tooltip label="Debug PayPal Order">
                              <Link 
                                href={`/api/debug/paypal-order?orderId=${tx.paymentIntentId}`} 
                                isExternal
                                fontSize="sm"
                                color="gray.500"
                              >
                                Debug
                              </Link>
                            </Tooltip>
                          )}
                          {tx.status === 'PROVIDER_REVIEW' && (
                            <Button 
                              size="xs" 
                              colorScheme="green"
                              onClick={() => window.open(`/provider/transactions/${tx.id}`, '_blank')}
                            >
                              Review
                            </Button>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>Payment Integration</Heading>
          <HStack spacing={4}>
            <Button
              as={NextLink}
              href="/provider/settings/payments"
              colorScheme="blue"
            >
              Manage PayPal Account
            </Button>
            
            <Button
              as="a"
              href={isSandbox ? 
                "https://www.sandbox.paypal.com/businessapp/transactions" : 
                "https://www.paypal.com/businessapp/transactions"
              }
              target="_blank"
              rel="noopener noreferrer"
              rightIcon={<FiExternalLink />}
              variant="outline"
            >
              View PayPal {isSandbox && "Sandbox"} Dashboard
            </Button>
          </HStack>
        </CardBody>
      </Card>
    </Container>
  );
} 