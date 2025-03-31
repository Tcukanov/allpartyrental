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
  Button,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  ButtonGroup,
  Tooltip,
  HStack,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Code,
  FormControl,
  FormLabel,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { 
  FiRefreshCw, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiCalendar, 
  FiDollarSign,
  FiSend,
  FiFile,
  FiInfo
} from 'react-icons/fi';

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Badge component for transaction status
const StatusBadge = ({ status }) => {
  const statusConfig = {
    'PENDING': { color: 'gray', label: 'Pending' },
    'PROVIDER_REVIEW': { color: 'yellow', label: 'Provider Review' },
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

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingTxs, setProcessingTxs] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [processorResult, setProcessorResult] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isProcessorOpen, 
    onOpen: onProcessorOpen, 
    onClose: onProcessorClose 
  } = useDisclosure();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all transactions
      const response = await fetch('/api/admin/transactions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
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
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    onOpen();
  };

  const handleProcessTransactions = async () => {
    try {
      setProcessingTxs(true);
      setProcessorResult(null);
      
      const response = await fetch('/api/system/process-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to process transactions');
      }
      
      const result = await response.json();
      setProcessorResult(result.data);
      onProcessorOpen();
      
      // Refresh transactions list
      fetchTransactions();
      
      toast({
        title: 'Success',
        description: 'Transactions processed successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error processing transactions:', err);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingTxs(false);
    }
  };

  // Filter transactions by status
  const pendingReviewTransactions = transactions.filter(
    tx => tx.status === 'PROVIDER_REVIEW'
  );
  
  const escrowTransactions = transactions.filter(
    tx => tx.status === 'ESCROW'
  );
  
  const completedTransactions = transactions.filter(
    tx => tx.status === 'COMPLETED'
  );
  
  const cancelledTransactions = transactions.filter(
    tx => tx.status === 'DECLINED' || tx.status === 'REFUNDED' || tx.status === 'CANCELLED'
  );

  if (loading) {
    return (
      <Container maxW="container.xl">
        <Flex justify="center" align="center" height="50vh" direction="column">
          <Spinner size="xl" mb={4} color="blue.500" />
          <Text>Loading transactions...</Text>
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl">
      <Stack spacing={6}>
        <Flex justify="space-between" align="center" wrap="wrap">
          <Box>
            <Heading as="h1" size="xl" mb={2}>Transaction Management</Heading>
            <Text color="gray.600">Monitor and manage all transactions in the system</Text>
          </Box>
          
          <HStack>
            <Button 
              leftIcon={<FiRefreshCw />} 
              onClick={fetchTransactions}
              colorScheme="blue"
              variant="outline"
            >
              Refresh
            </Button>
            <Button 
              leftIcon={<FiClock />} 
              onClick={handleProcessTransactions}
              colorScheme="green"
              isLoading={processingTxs}
              loadingText="Processing"
            >
              Process Deadlines
            </Button>
          </HStack>
        </Flex>
        
        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>All ({transactions.length})</Tab>
            <Tab 
              color={pendingReviewTransactions.length > 0 ? "yellow.500" : undefined}
              fontWeight={pendingReviewTransactions.length > 0 ? "bold" : undefined}
            >
              Provider Review ({pendingReviewTransactions.length})
            </Tab>
            <Tab>In Escrow ({escrowTransactions.length})</Tab>
            <Tab>Completed ({completedTransactions.length})</Tab>
            <Tab>Cancelled/Refunded ({cancelledTransactions.length})</Tab>
          </TabList>
          
          <TabPanels>
            {/* All Transactions */}
            <TabPanel px={0}>
              <TransactionsTable 
                transactions={transactions} 
                onViewDetails={handleViewDetails} 
              />
            </TabPanel>
            
            {/* Provider Review */}
            <TabPanel px={0}>
              {pendingReviewTransactions.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text>No transactions awaiting provider review</Text>
                </Box>
              ) : (
                <TransactionsTable 
                  transactions={pendingReviewTransactions} 
                  onViewDetails={handleViewDetails} 
                />
              )}
            </TabPanel>
            
            {/* In Escrow */}
            <TabPanel px={0}>
              {escrowTransactions.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text>No transactions in escrow</Text>
                </Box>
              ) : (
                <TransactionsTable 
                  transactions={escrowTransactions} 
                  onViewDetails={handleViewDetails} 
                />
              )}
            </TabPanel>
            
            {/* Completed */}
            <TabPanel px={0}>
              {completedTransactions.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text>No completed transactions</Text>
                </Box>
              ) : (
                <TransactionsTable 
                  transactions={completedTransactions} 
                  onViewDetails={handleViewDetails} 
                />
              )}
            </TabPanel>
            
            {/* Cancelled/Refunded */}
            <TabPanel px={0}>
              {cancelledTransactions.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text>No cancelled or refunded transactions</Text>
                </Box>
              ) : (
                <TransactionsTable 
                  transactions={cancelledTransactions} 
                  onViewDetails={handleViewDetails} 
                />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
      
      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Transaction Details</ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              <Stack spacing={4}>
                <HStack justify="space-between">
                  <Text fontWeight="bold">ID:</Text>
                  <Text>{selectedTransaction.id}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Status:</Text>
                  <StatusBadge status={selectedTransaction.status} />
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Amount:</Text>
                  <Text fontWeight="bold" color="green.500">
                    ${Number(selectedTransaction.amount).toFixed(2)}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Service:</Text>
                  <Text>{selectedTransaction.service?.name || 'N/A'}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Client:</Text>
                  <Text>{selectedTransaction.client?.name || 'N/A'}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Provider:</Text>
                  <Text>{selectedTransaction.provider?.name || 'N/A'}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Created:</Text>
                  <Text>{formatDate(selectedTransaction.createdAt)}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Updated:</Text>
                  <Text>{formatDate(selectedTransaction.updatedAt)}</Text>
                </HStack>
                
                {selectedTransaction.reviewDeadline && (
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Review Deadline:</Text>
                    <Text>{formatDate(selectedTransaction.reviewDeadline)}</Text>
                  </HStack>
                )}
                
                {selectedTransaction.escrowEndTime && (
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Escrow End:</Text>
                    <Text>{formatDate(selectedTransaction.escrowEndTime)}</Text>
                  </HStack>
                )}
                
                {selectedTransaction.paymentIntentId && (
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Payment Intent ID:</Text>
                    <Text fontSize="sm" fontFamily="mono">
                      {selectedTransaction.paymentIntentId}
                    </Text>
                  </HStack>
                )}
              </Stack>
            </ModalBody>
            
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      
      {/* Processor Results Modal */}
      <Modal isOpen={isProcessorOpen} onClose={onProcessorClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction Processing Results</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {processorResult ? (
              <Stack spacing={4}>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Timestamp:</Text>
                  <Text>{formatDate(processorResult.timestamp)}</Text>
                </HStack>
                
                <Box>
                  <Heading size="sm" mb={2}>Review Deadlines</Heading>
                  <Card variant="outline">
                    <CardBody>
                      <HStack justify="space-between" mb={2}>
                        <Text>Total Processed:</Text>
                        <Text>{processorResult.reviewDeadlines.processed}</Text>
                      </HStack>
                      <HStack justify="space-between" mb={2}>
                        <Text>Successful:</Text>
                        <Text color="green.500">{processorResult.reviewDeadlines.successful}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Failed:</Text>
                        <Text color="red.500">{processorResult.reviewDeadlines.failed}</Text>
                      </HStack>
                    </CardBody>
                  </Card>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={2}>Escrow Releases</Heading>
                  <Card variant="outline">
                    <CardBody>
                      <HStack justify="space-between" mb={2}>
                        <Text>Total Processed:</Text>
                        <Text>{processorResult.escrowReleases.processed}</Text>
                      </HStack>
                      <HStack justify="space-between" mb={2}>
                        <Text>Successful:</Text>
                        <Text color="green.500">{processorResult.escrowReleases.successful}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Failed:</Text>
                        <Text color="red.500">{processorResult.escrowReleases.failed}</Text>
                      </HStack>
                    </CardBody>
                  </Card>
                </Box>
              </Stack>
            ) : (
              <Flex justify="center" py={4}>
                <Text>No processing results available</Text>
              </Flex>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button colorScheme="blue" onClick={onProcessorClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

// Table component for displaying transactions
const TransactionsTable = ({ transactions, onViewDetails }) => {
  if (transactions.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text>No transactions found</Text>
      </Box>
    );
  }
  
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Service</Th>
            <Th>Amount</Th>
            <Th>Client</Th>
            <Th>Provider</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th>Deadlines</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {transactions.map(transaction => (
            <Tr key={transaction.id}>
              <Td fontSize="xs" fontFamily="mono">{transaction.id.substring(0, 10)}...</Td>
              <Td maxW="200px" isTruncated>{transaction.service?.name || 'N/A'}</Td>
              <Td isNumeric fontWeight="medium">${Number(transaction.amount).toFixed(2)}</Td>
              <Td>{transaction.client?.name || 'N/A'}</Td>
              <Td>{transaction.provider?.name || 'N/A'}</Td>
              <Td><StatusBadge status={transaction.status} /></Td>
              <Td fontSize="xs">{formatDate(transaction.createdAt)}</Td>
              <Td fontSize="xs">
                {transaction.status === 'PROVIDER_REVIEW' && transaction.reviewDeadline && (
                  <Tooltip label={`Review Deadline: ${formatDate(transaction.reviewDeadline)}`}>
                    <Text color={new Date(transaction.reviewDeadline) < new Date() ? 'red.500' : undefined}>
                      {formatDate(transaction.reviewDeadline)}
                    </Text>
                  </Tooltip>
                )}
                {transaction.status === 'ESCROW' && transaction.escrowEndTime && (
                  <Tooltip label={`Escrow End: ${formatDate(transaction.escrowEndTime)}`}>
                    <Text color={new Date(transaction.escrowEndTime) < new Date() ? 'red.500' : undefined}>
                      {formatDate(transaction.escrowEndTime)}
                    </Text>
                  </Tooltip>
                )}
              </Td>
              <Td>
                <ButtonGroup size="sm" variant="ghost">
                  <Tooltip label="View Details">
                    <Button
                      icon={<FiInfo />}
                      aria-label="View Details"
                      onClick={() => onViewDetails(transaction)}
                    >
                      Details
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}; 