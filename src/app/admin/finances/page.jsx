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
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiCreditCard,
  FiPercent,
  FiDownload,
  FiArrowDown,
  FiArrowUp,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';

export default function AdminFinancesPage() {
  const [financesData, setFinancesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const cardBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    async function fetchFinancesData() {
      try {
        setLoading(true);
        
        // Simulated data for demonstration
        // In a real application, you would fetch this data from an API
        const mockData = {
          revenue: {
            total: 12580,
            fees: 4250,
            month: 1850,
            lastMonth: 1650,
            week: 450,
            lastWeek: 400,
            today: 75,
            yesterday: 120,
          },
          transactions: {
            total: 230,
            completed: 180,
            inEscrow: 35,
            pending: 15,
            refunded: 10,
            cancelled: 5,
            avgValue: 350,
          },
          recentTransactions: [
            { id: 'TR-1001', date: '2023-06-02T14:30:00Z', customer: 'John Smith', amount: 250, status: 'COMPLETED', fee: 12.5 },
            { id: 'TR-1002', date: '2023-06-02T09:15:00Z', customer: 'Sarah Johnson', amount: 175, status: 'ESCROW', fee: 8.75 },
            { id: 'TR-1003', date: '2023-06-01T16:45:00Z', customer: 'Michael Brown', amount: 300, status: 'COMPLETED', fee: 15 },
            { id: 'TR-1004', date: '2023-06-01T11:20:00Z', customer: 'Emma Wilson', amount: 120, status: 'COMPLETED', fee: 6 },
            { id: 'TR-1005', date: '2023-05-31T15:10:00Z', customer: 'David Lee', amount: 90, status: 'REFUNDED', fee: 0 },
            { id: 'TR-1006', date: '2023-05-31T10:35:00Z', customer: 'Jessica Clark', amount: 200, status: 'COMPLETED', fee: 10 },
            { id: 'TR-1007', date: '2023-05-30T13:50:00Z', customer: 'Daniel Martin', amount: 150, status: 'ESCROW', fee: 7.5 },
            { id: 'TR-1008', date: '2023-05-30T09:25:00Z', customer: 'Olivia Rodriguez', amount: 280, status: 'COMPLETED', fee: 14 },
          ],
          monthlyRevenue: [
            { month: 'Jan', revenue: 950, fees: 47.5 },
            { month: 'Feb', revenue: 1100, fees: 55 },
            { month: 'Mar', revenue: 1250, fees: 62.5 },
            { month: 'Apr', revenue: 1400, fees: 70 },
            { month: 'May', revenue: 1650, fees: 82.5 },
            { month: 'Jun', revenue: 1850, fees: 92.5 },
          ],
        };
        
        setFinancesData(mockData);
      } catch (err) {
        console.error('Error fetching finances data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFinancesData();
  }, []);
  
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
      year: 'numeric',
    });
  };
  
  // Get percentage change
  const getPercentageChange = (current, previous) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };
  
  // Get revenue data based on selected timeframe
  const getRevenueData = () => {
    if (!financesData) return { current: 0, previous: 0, change: 0 };
    
    let current, previous;
    
    switch (timeframe) {
      case 'today':
        current = financesData.revenue.today;
        previous = financesData.revenue.yesterday;
        break;
      case 'week':
        current = financesData.revenue.week;
        previous = financesData.revenue.lastWeek;
        break;
      case 'month':
        current = financesData.revenue.month;
        previous = financesData.revenue.lastMonth;
        break;
      default:
        current = financesData.revenue.total;
        previous = financesData.revenue.total;
    }
    
    const change = getPercentageChange(current, previous);
    return { current, previous, change };
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'green';
      case 'ESCROW':
        return 'blue';
      case 'PENDING':
        return 'yellow';
      case 'CANCELLED':
        return 'red';
      case 'REFUNDED':
        return 'purple';
      default:
        return 'gray';
    }
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
          <Text>Error loading finances data: {error}</Text>
        </Alert>
      </Container>
    );
  }
  
  const revenueData = getRevenueData();
  
  return (
    <Container maxW="container.xl">
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>Finances</Heading>
          <Text color="gray.600">Platform revenue and transaction metrics</Text>
        </Box>
        
        {/* Period Selector */}
        <Flex justify="flex-end">
          <Select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            w="200px"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </Select>
        </Flex>
        
        {/* Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <RevenueCard
            title="Platform Revenue"
            value={formatCurrency(revenueData.current)}
            icon={FiDollarSign}
            iconColor="green.500"
            change={revenueData.change}
            helperText={`vs. ${timeframe === 'today' ? 'yesterday' : timeframe === 'week' ? 'last week' : 'last month'}`}
          />
          
          <StatCard
            title="Active Transactions"
            value={financesData.transactions.inEscrow + financesData.transactions.pending}
            icon={FiClock}
            iconColor="blue.500"
            helperText={`${financesData.transactions.inEscrow} in escrow, ${financesData.transactions.pending} pending`}
          />
          
          <StatCard
            title="Transaction Success Rate"
            value={`${((financesData.transactions.completed / (financesData.transactions.total - financesData.transactions.pending)) * 100).toFixed(1)}%`}
            icon={FiPercent}
            iconColor="purple.500"
            helperText={`${financesData.transactions.completed} completed, ${financesData.transactions.refunded + financesData.transactions.cancelled} failed`}
          />
        </SimpleGrid>
        
        {/* Tabs */}
        <Tabs colorScheme="blue" isLazy>
          <TabList>
            <Tab>Transactions</Tab>
            <Tab>Revenue Reports</Tab>
          </TabList>
          
          <TabPanels>
            {/* Transactions Tab */}
            <TabPanel px={0}>
              <Card bg={cardBg}>
                <CardBody>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Recent Transactions</Heading>
                    <Button 
                      leftIcon={<FiDownload />} 
                      size="sm" 
                      variant="outline"
                    >
                      Export CSV
                    </Button>
                  </Flex>
                  
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Transaction ID</Th>
                          <Th>Date</Th>
                          <Th>Customer</Th>
                          <Th isNumeric>Amount</Th>
                          <Th isNumeric>Platform Fee</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {financesData.recentTransactions.map((tx) => (
                          <Tr key={tx.id}>
                            <Td fontWeight="medium">{tx.id}</Td>
                            <Td>{formatDate(tx.date)}</Td>
                            <Td>{tx.customer}</Td>
                            <Td isNumeric>{formatCurrency(tx.amount)}</Td>
                            <Td isNumeric>{formatCurrency(tx.fee)}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(tx.status)}>
                                {tx.status}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                  
                  <Button 
                    variant="link" 
                    colorScheme="blue" 
                    size="sm"
                    mt={4}
                  >
                    View All Transactions
                  </Button>
                </CardBody>
              </Card>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                <Card bg={cardBg}>
                  <CardBody>
                    <Heading size="md" mb={4}>Transaction Summary</Heading>
                    <Stack spacing={4}>
                      <HStack justify="space-between">
                        <Text>Total Transactions</Text>
                        <Text fontWeight="bold">{financesData.transactions.total}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Completed</Text>
                        <HStack>
                          <Icon as={FiCheckCircle} color="green.500" />
                          <Text fontWeight="bold">{financesData.transactions.completed}</Text>
                        </HStack>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>In Escrow</Text>
                        <HStack>
                          <Icon as={FiClock} color="blue.500" />
                          <Text fontWeight="bold">{financesData.transactions.inEscrow}</Text>
                        </HStack>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Pending</Text>
                        <HStack>
                          <Icon as={FiClock} color="yellow.500" />
                          <Text fontWeight="bold">{financesData.transactions.pending}</Text>
                        </HStack>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Refunded</Text>
                        <HStack>
                          <Icon as={FiXCircle} color="purple.500" />
                          <Text fontWeight="bold">{financesData.transactions.refunded}</Text>
                        </HStack>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Cancelled</Text>
                        <HStack>
                          <Icon as={FiXCircle} color="red.500" />
                          <Text fontWeight="bold">{financesData.transactions.cancelled}</Text>
                        </HStack>
                      </HStack>
                    </Stack>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg}>
                  <CardBody>
                    <Heading size="md" mb={4}>Financial Metrics</Heading>
                    <Stack spacing={4}>
                      <HStack justify="space-between">
                        <Text>Total Revenue</Text>
                        <Text fontWeight="bold">{formatCurrency(financesData.revenue.total)}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Platform Fees</Text>
                        <Text fontWeight="bold">{formatCurrency(financesData.revenue.fees)}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Average Transaction</Text>
                        <Text fontWeight="bold">{formatCurrency(financesData.transactions.avgValue)}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Fee Rate</Text>
                        <Text fontWeight="bold">5.0%</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Average Fee</Text>
                        <Text fontWeight="bold">{formatCurrency(financesData.transactions.avgValue * 0.05)}</Text>
                      </HStack>
                    </Stack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>
            
            {/* Revenue Reports Tab */}
            <TabPanel px={0}>
              <Card bg={cardBg}>
                <CardBody>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Monthly Revenue</Heading>
                    <Button 
                      leftIcon={<FiDownload />} 
                      size="sm" 
                      variant="outline"
                    >
                      Export Report
                    </Button>
                  </Flex>
                  
                  {/* Simple visual representation of monthly revenue */}
                  <Box>
                    {financesData.monthlyRevenue.map((month, index) => (
                      <Box key={index} mb={4}>
                        <Flex justify="space-between" mb={1}>
                          <Text fontWeight="medium">{month.month}</Text>
                          <Text fontWeight="medium">{formatCurrency(month.revenue)}</Text>
                        </Flex>
                        <Flex>
                          <Box
                            h="10px"
                            bg="blue.500"
                            flex={month.revenue}
                            borderLeftRadius="full"
                            mr="2px"
                          />
                          <Box
                            h="10px"
                            bg="green.500"
                            flex={month.fees}
                            borderRightRadius="full"
                          />
                        </Flex>
                        <Flex justify="space-between" mt={1}>
                          <Text fontSize="sm" color="gray.500">Total Volume</Text>
                          <Text fontSize="sm" color="gray.500">Platform Fees: {formatCurrency(month.fees)}</Text>
                        </Flex>
                      </Box>
                    ))}
                  </Box>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={8}>
                    <Card bg={useColorModeValue('gray.50', 'gray.800')} p={4}>
                      <CardBody>
                        <Heading size="sm" mb={4}>Revenue Growth</Heading>
                        <HStack>
                          <Icon 
                            as={FiTrendingUp} 
                            color="green.500" 
                            boxSize={8} 
                          />
                          <Stack spacing={0}>
                            <Stat>
                              <StatNumber>{formatCurrency(financesData.revenue.month)}</StatNumber>
                              <StatHelpText>
                                <Flex align="center">
                                  <Icon 
                                    as={getPercentageChange(financesData.revenue.month, financesData.revenue.lastMonth) >= 0 ? FiArrowUp : FiArrowDown} 
                                    color={getPercentageChange(financesData.revenue.month, financesData.revenue.lastMonth) >= 0 ? 'green.500' : 'red.500'} 
                                    mr={1} 
                                  />
                                  {Math.abs(getPercentageChange(financesData.revenue.month, financesData.revenue.lastMonth)).toFixed(1)}% vs last month
                                </Flex>
                              </StatHelpText>
                            </Stat>
                          </Stack>
                        </HStack>
                      </CardBody>
                    </Card>
                    
                    <Card bg={useColorModeValue('gray.50', 'gray.800')} p={4}>
                      <CardBody>
                        <Heading size="sm" mb={4}>Annual Projection</Heading>
                        <HStack>
                          <Icon 
                            as={FiCalendar} 
                            color="purple.500" 
                            boxSize={8} 
                          />
                          <Stack spacing={0}>
                            <Stat>
                              <StatNumber>{formatCurrency(financesData.revenue.month * 12)}</StatNumber>
                              <StatHelpText>
                                Based on current monthly revenue
                              </StatHelpText>
                            </Stat>
                          </Stack>
                        </HStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Container>
  );
}

// Revenue card component with change indicator
const RevenueCard = ({ title, value, icon, iconColor, change, helperText }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const isPositive = change >= 0;
  
  return (
    <Card bg={cardBg}>
      <CardBody>
        <Flex justify="space-between" align="flex-start">
          <Stat>
            <StatLabel fontSize="lg" fontWeight="medium">{title}</StatLabel>
            <StatNumber fontSize="3xl" my={2}>{value}</StatNumber>
            <StatHelpText>
              <Flex align="center">
                <Icon 
                  as={isPositive ? FiArrowUp : FiArrowDown} 
                  color={isPositive ? 'green.500' : 'red.500'} 
                  mr={1} 
                />
                {Math.abs(change).toFixed(1)}% {helperText}
              </Flex>
            </StatHelpText>
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
      </CardBody>
    </Card>
  );
};

// Simple stat card component
const StatCard = ({ title, value, icon, iconColor, helperText }) => {
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
      </CardBody>
    </Card>
  );
}; 