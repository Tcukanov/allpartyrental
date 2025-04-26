'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Button,
  Card,
  CardHeader,
  CardBody,
  Select,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  FormControl,
  FormLabel,
  Icon,
} from '@chakra-ui/react';
import { FiDownload, FiPieChart, FiBarChart2, FiTrendingUp, FiDollarSign, FiUsers, FiCalendar } from 'react-icons/fi';

interface ReportData {
  transactions: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  users: {
    total: number;
    newThisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  services: {
    total: number;
    active: number;
    inactive: number;
    pending: number;
  };
  topServices: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  topCities: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  monthlyData: Array<{
    month: string;
    transactions: number;
    revenue: number;
  }>;
}

export default function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState('last30days');
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchReportData();
  }, [timeRange, reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports?timeRange=${timeRange}&type=${reportType}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch report data');
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setData(null);
      
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch report data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleExportReport = () => {
    toast({
      title: 'Export initiated',
      description: 'Your report is being generated and will download shortly.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    
    // In a real implementation, this would trigger the actual report download
    setTimeout(() => {
      toast({
        title: 'Report ready',
        description: 'Your report has been generated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 2000);
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
          <Text color="red.500">{error}</Text>
          <Button mt={4} onClick={fetchReportData}>Retry</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading as="h1" size="xl">Reports & Analytics</Heading>
          <Text color="gray.600">Track platform performance and generate reports</Text>
        </Box>
        
        <HStack>
          <FormControl maxW="200px">
            <Select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="thisYear">This Year</option>
              <option value="allTime">All Time</option>
            </Select>
          </FormControl>
          
          <Button
            leftIcon={<Icon as={FiDownload} />}
            colorScheme="blue"
            onClick={handleExportReport}
          >
            Export
          </Button>
        </HStack>
      </Flex>
      
      {/* Key Metrics Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <Flex justify="space-between">
                <Box>
                  <StatLabel>Total Revenue</StatLabel>
                  <StatNumber>{formatCurrency(data?.revenue.total || 0)}</StatNumber>
                  <StatHelpText>
                    {data?.revenue.percentChange || 0}% increase
                  </StatHelpText>
                </Box>
                <Flex
                  align="center"
                  justify="center"
                  rounded="full"
                  bg="green.100"
                  color="green.500"
                  boxSize="50px"
                >
                  <Icon as={FiDollarSign} boxSize="24px" />
                </Flex>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <Flex justify="space-between">
                <Box>
                  <StatLabel>Transactions</StatLabel>
                  <StatNumber>{data?.transactions.total || 0}</StatNumber>
                  <StatHelpText>
                    {data?.transactions.percentChange || 0}% increase
                  </StatHelpText>
                </Box>
                <Flex
                  align="center"
                  justify="center"
                  rounded="full"
                  bg="blue.100"
                  color="blue.500"
                  boxSize="50px"
                >
                  <Icon as={FiBarChart2} boxSize="24px" />
                </Flex>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <Flex justify="space-between">
                <Box>
                  <StatLabel>Total Users</StatLabel>
                  <StatNumber>{data?.users.total || 0}</StatNumber>
                  <StatHelpText>
                    {data?.users.percentChange || 0}% increase
                  </StatHelpText>
                </Box>
                <Flex
                  align="center"
                  justify="center"
                  rounded="full"
                  bg="purple.100"
                  color="purple.500"
                  boxSize="50px"
                >
                  <Icon as={FiUsers} boxSize="24px" />
                </Flex>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <Flex justify="space-between">
                <Box>
                  <StatLabel>Active Services</StatLabel>
                  <StatNumber>{data?.services.active || 0}</StatNumber>
                  <StatHelpText>
                    Out of {data?.services.total || 0} total
                  </StatHelpText>
                </Box>
                <Flex
                  align="center"
                  justify="center"
                  rounded="full"
                  bg="orange.100"
                  color="orange.500"
                  boxSize="50px"
                >
                  <Icon as={FiTrendingUp} boxSize="24px" />
                </Flex>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      <Tabs variant="enclosed" colorScheme="blue" mb={6}>
        <TabList>
          <Tab>Performance</Tab>
          <Tab>Top Services</Tab>
          <Tab>Top Locations</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel p={0} pt={4}>
            <Card>
              <CardHeader>
                <Heading size="md">Monthly Performance</Heading>
              </CardHeader>
              <CardBody>
                <Text>Revenue and Transaction Trend</Text>
                {/* In a real implementation, this would be a chart component */}
                <Box height="300px" bg="gray.100" borderRadius="md" p={4} mt={4}>
                  <Flex justify="center" align="center" h="100%">
                    <Text>Chart visualization would appear here</Text>
                  </Flex>
                </Box>
                <SimpleGrid columns={{ base: 1, md: 2 }} mt={4}>
                  <Box>
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Month</Th>
                          <Th isNumeric>Transactions</Th>
                          <Th isNumeric>Revenue</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {data?.monthlyData.map((item, index) => (
                          <Tr key={index}>
                            <Td>{item.month}</Td>
                            <Td isNumeric>{item.transactions}</Td>
                            <Td isNumeric>{formatCurrency(item.revenue)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>
          </TabPanel>
          
          <TabPanel p={0} pt={4}>
            <Card>
              <CardHeader>
                <Heading size="md">Top Performing Services</Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Service</Th>
                      <Th isNumeric>Bookings</Th>
                      <Th isNumeric>Revenue</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data?.topServices.map((service) => (
                      <Tr key={service.id}>
                        <Td>{service.name}</Td>
                        <Td isNumeric>{service.bookings}</Td>
                        <Td isNumeric>{formatCurrency(service.revenue)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>
          
          <TabPanel p={0} pt={4}>
            <Card>
              <CardHeader>
                <Heading size="md">Top Performing Locations</Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Location</Th>
                      <Th isNumeric>Bookings</Th>
                      <Th isNumeric>Revenue</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data?.topCities.map((city) => (
                      <Tr key={city.id}>
                        <Td>{city.name}</Td>
                        <Td isNumeric>{city.bookings}</Td>
                        <Td isNumeric>{formatCurrency(city.revenue)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <HStack justify="flex-end">
        <Text fontSize="sm" color="gray.500">
          * Report data last updated: {new Date().toLocaleString()}
        </Text>
      </HStack>
    </Container>
  );
} 