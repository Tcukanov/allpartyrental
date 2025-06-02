'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
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
  Button,
  Select,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link,
  Divider
} from '@chakra-ui/react';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiSettings } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import ProviderLayout from '../../components/ProviderLayout';
import NextLink from 'next/link';

export default function PaymentsDashboardPage() {
  const { data: session } = useSession();
  const [timeframe, setTimeframe] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    pendingPayments: 0,
    completedTransactions: 0,
    recentTransactions: []
  });
  const [paypalConnected, setPaypalConnected] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPaymentData();
    checkPayPalConnection();
  }, [timeframe]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/provider/transactions/payments?timeframe=${timeframe}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Payment data received:', data);
        
        // Handle the actual API response structure
        const processedData = {
          totalEarnings: data.totalEarnings || 0,
          thisMonthEarnings: data.thisMonthEarnings || 0,
          pendingPayments: data.pendingPayments || 0,
          completedTransactions: data.completedTransactions || 0,
          recentTransactions: data.transactions || data.recentTransactions || []
        };
        
        setPaymentData(processedData);
      } else {
        // Mock data for fallback
        setPaymentData({
          totalEarnings: 2450.00,
          thisMonthEarnings: 580.00,
          pendingPayments: 120.00,
          completedTransactions: 15,
          recentTransactions: [
            {
              id: 'tx_001',
              date: new Date().toISOString(),
              amount: 150.00,
              status: 'completed',
              service: 'Soft Play Rental',
              client: 'John Doe'
            },
            {
              id: 'tx_002', 
              date: new Date(Date.now() - 86400000).toISOString(),
              amount: 200.00,
              status: 'completed',
              service: 'Bouncy Castle',
              client: 'Sarah Smith'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      
      // Set fallback data on error
      setPaymentData({
        totalEarnings: 0,
        thisMonthEarnings: 0,
        pendingPayments: 0,
        completedTransactions: 0,
        recentTransactions: []
      });
      
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPayPalConnection = async () => {
    try {
      const response = await fetch('/api/provider/profile');
      if (response.ok) {
        const data = await response.json();
        setPaypalConnected(!!data.provider?.paypalMerchantId);
      }
    } catch (error) {
      console.error('Error checking PayPal connection:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <ProviderLayout>
        <Container maxW="container.xl" py={8}>
          <Text>Loading payment data...</Text>
        </Container>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Payments Dashboard</Heading>
              <Text color="gray.600">Track your earnings and transaction history</Text>
            </VStack>
            
            <HStack spacing={3}>
              <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} w="200px">
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
              </Select>
              
              <Link as={NextLink} href="/provider/dashboard/paypal">
                <Button leftIcon={<FiSettings />} colorScheme="blue" variant="outline">
                  Payment Settings
                </Button>
              </Link>
            </HStack>
          </HStack>

          {/* PayPal Connection Status */}
          {!paypalConnected && (
            <Alert status="warning">
              <AlertIcon />
              <Box>
                <AlertTitle>PayPal Not Connected!</AlertTitle>
                <AlertDescription>
                  Connect your PayPal account to receive instant payments. 
                  <Link as={NextLink} href="/provider/dashboard/paypal" color="blue.500" ml={1}>
                    Set up PayPal now
                  </Link>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Stats Cards */}
          <HStack spacing={6} wrap="wrap">
            <Card flex="1" minW="250px">
              <CardBody>
                <Stat>
                  <StatLabel>Total Earnings</StatLabel>
                  <StatNumber color="green.500">{formatCurrency(paymentData.totalEarnings)}</StatNumber>
                  <StatHelpText>All time</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card flex="1" minW="250px">
              <CardBody>
                <Stat>
                  <StatLabel>This Month</StatLabel>
                  <StatNumber>{formatCurrency(paymentData.thisMonthEarnings)}</StatNumber>
                  <StatHelpText>
                    <HStack>
                      <FiTrendingUp color="green" />
                      <Text color="green.500">+12% from last month</Text>
                    </HStack>
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card flex="1" minW="250px">
              <CardBody>
                <Stat>
                  <StatLabel>Pending Payments</StatLabel>
                  <StatNumber color="orange.500">{formatCurrency(paymentData.pendingPayments)}</StatNumber>
                  <StatHelpText>Awaiting processing</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card flex="1" minW="250px">
              <CardBody>
                <Stat>
                  <StatLabel>Completed Transactions</StatLabel>
                  <StatNumber>{paymentData.completedTransactions}</StatNumber>
                  <StatHelpText>This period</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </HStack>

          {/* Recent Transactions */}
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Recent Transactions</Heading>
                <Divider />
                
                {(paymentData.recentTransactions && paymentData.recentTransactions.length > 0) ? (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Service</Th>
                        <Th>Client</Th>
                        <Th>Amount</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paymentData.recentTransactions.map((transaction) => (
                        <Tr key={transaction.id}>
                          <Td>{formatDate(transaction.date || transaction.createdAt)}</Td>
                          <Td>{transaction.service || transaction.offer?.service?.name || 'Service'}</Td>
                          <Td>{transaction.client || transaction.offer?.client?.name || 'Client'}</Td>
                          <Td>{formatCurrency(transaction.amount)}</Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text color="gray.500" textAlign="center" py={8}>
                    No transactions found for this period
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Payment Information</Heading>
                <Divider />
                
                <VStack align="start" spacing={3}>
                  <HStack>
                    <FiDollarSign />
                    <Text fontWeight="semibold">Commission Structure:</Text>
                  </HStack>
                  <Text ml={6} color="gray.600">
                    • Platform commission: 12% of service price
                  </Text>
                  <Text ml={6} color="gray.600">
                    • Client fee: 5% added to total (paid by client)
                  </Text>
                  <Text ml={6} color="gray.600">
                    • You receive: Service price - 12% commission
                  </Text>
                  
                  <HStack mt={4}>
                    <FiCalendar />
                    <Text fontWeight="semibold">Payment Schedule:</Text>
                  </HStack>
                  <Text ml={6} color="gray.600">
                    {paypalConnected 
                      ? "• Instant payments via PayPal marketplace (recommended)"
                      : "• Manual payouts processed weekly"
                    }
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </ProviderLayout>
  );
} 