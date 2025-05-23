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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Avatar,
  VStack,
  Spinner,
  Center
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { FiClock, FiCalendar, FiDollarSign, FiMapPin, FiUsers, FiPackage } from 'react-icons/fi';
import Link from 'next/link';
import { getTransactionStatusConfig } from '@/utils/statusConfig';

const TransactionStatusBadge = ({ status }) => {
  const config = getTransactionStatusConfig(status);
  
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
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Party details modal state
  const [selectedParty, setSelectedParty] = useState(null);
  const [isLoadingParty, setIsLoadingParty] = useState(false);
  const { 
    isOpen: isPartyModalOpen, 
    onOpen: onPartyModalOpen, 
    onClose: onPartyModalClose 
  } = useDisclosure();

  // Function to manually refresh transactions
  const refreshTransactions = () => {
    console.log('Manual refresh triggered');
    setLoading(true);
    setRefreshKey(prevKey => prevKey + 1);
  };

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
        
        // Fetch client transactions with stronger cache-busting parameter
        const timestamp = Date.now();
        console.log(`Fetching transactions with timestamp: ${timestamp}`);
        const response = await fetch(`/api/client/transactions?t=${timestamp}&refresh=${refreshKey}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
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
        
        // Deduplicate transactions by party
        const partyMap = new Map();
        const uniqueTransactions = data.filter(tx => {
          // Get the party ID or name from the transaction's offer
          const partyId = tx.offer?.partyService?.party?.id;
          const partyName = tx.offer?.partyService?.party?.name;
          const transactionId = tx.id;
          
          console.log(`Transaction ${tx.id}: PartyID=${partyId}, PartyName=${partyName}`);
          
          // If we can't identify a party at all, keep the transaction
          if (!partyId && !partyName) {
            console.log(`Transaction ${tx.id}: No party identifier found, keeping transaction`);
            return true;
          }
          
          // Create a unique key using party ID or fall back to party name
          const partyKey = partyId || partyName;
          
          // If we haven't seen this party before, add it to the map and keep the transaction
          if (!partyMap.has(partyKey)) {
            console.log(`Transaction ${tx.id}: First occurrence of party ${partyKey}, keeping transaction`);
            partyMap.set(partyKey, {id: tx.id, status: tx.status});
            return true;
          }
          
          // If we have a newer transaction for this party, replace the old one
          const existingTxInfo = partyMap.get(partyKey);
          const existingTx = data.find(t => t.id === existingTxInfo.id);
          
          // Prioritize transactions with more "advanced" statuses
          // PENDING < PROVIDER_REVIEW < COMPLETED
          const statusPriority = {
            'PENDING': 0,
            'PROVIDER_REVIEW': 1,
            'COMPLETED': 2,
            'DECLINED': 3,
            'REFUNDED': 4,
            'CANCELLED': 5
          };
          
          const currentStatusPriority = statusPriority[tx.status] || 0;
          const existingStatusPriority = statusPriority[existingTx.status] || 0;
          
          // If this transaction has a higher priority status, use it
          if (currentStatusPriority > existingStatusPriority) {
            console.log(`Transaction ${tx.id}: Status ${tx.status} is higher priority than ${existingTx.status} for party ${partyKey}, replacing`);
            partyMap.set(partyKey, {id: tx.id, status: tx.status});
            return true;
          }
          
          // If same priority, use creation date as tiebreaker
          if (currentStatusPriority === existingStatusPriority) {
            const currentTxDate = new Date(tx.createdAt);
            const existingTxDate = new Date(existingTx.createdAt);
            
            console.log(`Transaction ${tx.id}: Comparing dates for party ${partyKey} - current: ${currentTxDate}, existing: ${existingTxDate}`);
            
            if (currentTxDate > existingTxDate) {
              console.log(`Transaction ${tx.id}: Newer transaction found for party ${partyKey}, replacing`);
              partyMap.set(partyKey, {id: tx.id, status: tx.status});
              return true;
            }
          }
          
          // Otherwise, this is a duplicate, so filter it out
          console.log(`Transaction ${tx.id}: Duplicate for party ${partyKey}, filtering out`);
          return false;
        });
        
        console.log(`Filtered ${data.length} transactions to ${uniqueTransactions.length} unique transactions`);
        console.log(`Unique party keys: ${[...partyMap.keys()].join(', ')}`);
        
        // Display filtered transactions
        setTransactions(uniqueTransactions);
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
    
    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing transactions...');
      fetchTransactions();
    }, 30000); // 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [router, toast, refreshKey]);

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

  // Handle opening party details modal
  const handleViewParty = async (party) => {
    if (!party || !party.id) {
      toast({
        title: "Error",
        description: "Unable to load party details: Party ID is missing",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      // Set loading state
      setIsLoadingParty(true);
      
      // Fetch complete party details from API
      console.log(`Fetching detailed party data for ID: ${party.id}`);
      const response = await fetch(`/api/parties/${party.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch party details (${response.status})`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error("Invalid response from server");
      }
      
      console.log("Full party data fetched:", data.data);
      console.log("Available party fields:", Object.keys(data.data));
      
      // Update state with complete party data
      setSelectedParty(data.data);
      
      // Open modal to display party details
      onPartyModalOpen();
    } catch (error) {
      console.error("Error fetching party details:", error);
      toast({
        title: "Error",
        description: `Unable to load party details: ${error.message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingParty(false);
    }
  };

  const TransactionCard = ({ transaction }) => {
    console.log(`Rendering transaction card: ${transaction.id}, Status: ${transaction.status}`);
    
    return (
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
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    onClick={() => handleViewParty(transaction.offer.partyService.party)}
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
              {process.env.NODE_ENV === 'development' || true && (
                <Box mt={4} p={2} bg="gray.100" borderRadius="md" fontSize="xs">
                  <Text as="pre" overflowX="auto">
                    Transaction ID: {transaction.id}<br/>
                    Status: <strong>{transaction.status}</strong><br/>
                    Offer ID: {transaction.offerId}<br/>
                    Created: {transaction.createdAt}<br/>
                    Last Updated: {transaction.updatedAt}<br/>
                    Has escrow time: {transaction.escrowEndTime ? 'Yes' : 'No'}<br/>
                    {transaction.transferId && `Transfer ID: ${transaction.transferId}`}
                  </Text>
                </Box>
              )}
            </Box>
          </Flex>
        </CardBody>
      </Card>
    );
  };
  
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
    <Container maxW="container.xl" py={8}>
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="lg">My Transactions</Heading>
          <Button 
            colorScheme="blue" 
            size="sm" 
            onClick={refreshTransactions}
            isLoading={loading}
          >
            Refresh
          </Button>
        </Flex>
        <Text color="gray.600">
          View and manage your service transactions
        </Text>
      </Box>
      
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
      
      {/* Party Details Modal */}
      <Modal isOpen={isPartyModalOpen} onClose={onPartyModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader borderBottomWidth="1px" display="flex" alignItems="center">
            <Text>{selectedParty?.name || 'Party Details'}</Text>
            {selectedParty && (
              <Badge ml={3} colorScheme={
                selectedParty.status === 'COMPLETED' ? 'green' :
                selectedParty.status === 'IN_PROGRESS' ? 'blue' :
                selectedParty.status === 'DRAFT' ? 'gray' :
                selectedParty.status === 'CANCELLED' ? 'red' : 'yellow'
              } fontSize="md" px={2} py={1}>
                {selectedParty.status?.replace('_', ' ')}
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoadingParty ? (
              <Center py={8}>
                <Spinner size="xl" />
                <Text ml={4}>Loading party details...</Text>
              </Center>
            ) : selectedParty ? (
              <VStack spacing={6} align="stretch">
                {/* Party date and time section */}
                <Box borderWidth="1px" borderRadius="md" p={4}>
                  <Heading as="h3" size="sm" mb={3}>Event Details</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text color="gray.600" fontWeight="medium">Date</Text>
                      <Flex align="center">
                        <Icon as={FiCalendar} mr={2} color="brand.500" />
                        <Text>{formatDate(selectedParty.date)}</Text>
                      </Flex>
                    </Box>
                    
                    <Box>
                      <Text color="gray.600" fontWeight="medium">Time</Text>
                      <Flex align="center">
                        <Icon as={FiClock} mr={2} color="brand.500" />
                        <Text>{selectedParty.startTime || 'Not specified'}</Text>
                      </Flex>
                    </Box>
                    
                    <Box>
                      <Text color="gray.600" fontWeight="medium">Location</Text>
                      <Flex align="center">
                        <Icon as={FiMapPin} mr={2} color="brand.500" />
                        <Text>
                          {selectedParty.city?.name || 'Not specified'} 
                          <Text as="span" color="blue.500" fontSize="sm" ml={2} cursor="pointer" 
                                onClick={() => document.getElementById('locationDetails').scrollIntoView({ behavior: 'smooth' })}>
                            (See full details below)
                          </Text>
                        </Text>
                      </Flex>
                    </Box>
                    
                    <Box>
                      <Text color="gray.600" fontWeight="medium">Guest Count</Text>
                      <Flex align="center">
                        <Icon as={FiUsers} mr={2} color="brand.500" />
                        <Text>{selectedParty.guestCount || 'Not specified'}</Text>
                      </Flex>
                    </Box>
                  </SimpleGrid>
                  
                  {/* Additional party details */}
                  {(selectedParty.type || selectedParty.budget || selectedParty.theme) && (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                      {selectedParty.type && (
                        <Box>
                          <Text color="gray.600" fontWeight="medium">Party Type</Text>
                          <Text>{selectedParty.type}</Text>
                        </Box>
                      )}
                      
                      {selectedParty.budget && (
                        <Box>
                          <Text color="gray.600" fontWeight="medium">Budget</Text>
                          <Text>${Number(selectedParty.budget).toFixed(2)}</Text>
                        </Box>
                      )}
                      
                      {selectedParty.theme && (
                        <Box>
                          <Text color="gray.600" fontWeight="medium">Theme</Text>
                          <Text>{selectedParty.theme}</Text>
                        </Box>
                      )}
                    </SimpleGrid>
                  )}
                </Box>
                
                {/* Party description */}
                {selectedParty.description && (
                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading as="h3" size="sm" mb={3}>Description</Heading>
                    <Text>{selectedParty.description}</Text>
                  </Box>
                )}
                
                {/* Special requests */}
                {selectedParty.specialRequests && (
                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading as="h3" size="sm" mb={3}>Special Requests</Heading>
                    <Text>{selectedParty.specialRequests}</Text>
                  </Box>
                )}
                
                {/* Services section */}
                {selectedParty.partyServices && selectedParty.partyServices.length > 0 && (
                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading as="h3" size="sm" mb={3}>Party Services</Heading>
                    <Divider mb={3} />
                    {selectedParty.partyServices.map((partyService) => (
                      <Card key={partyService.id} mb={3} variant="outline">
                        <CardBody>
                          <Flex gap={3} direction={{base: "column", md: "row"}}>
                            {/* Service image */}
                            {partyService.service?.photos && partyService.service.photos.length > 0 && (
                              <Box minWidth="80px" height="80px" flexShrink={0}>
                                <Image 
                                  src={partyService.service.photos[0]}
                                  alt={partyService.service.name}
                                  borderRadius="md"
                                  objectFit="cover"
                                  width="100%"
                                  height="100%"
                                />
                              </Box>
                            )}
                            
                            {/* Service details */}
                            <Box flex="1">
                              <Flex justify="space-between" align="center" mb={1}>
                                <Text fontWeight="bold">{partyService.service?.name || 'Service'}</Text>
                                {partyService.status && (
                                  <Badge variant="subtle" colorScheme={
                                    partyService.status === 'COMPLETED' ? 'green' :
                                    partyService.status === 'CONFIRMED' ? 'blue' :
                                    'gray'
                                  }>
                                    {partyService.status}
                                  </Badge>
                                )}
                              </Flex>
                              <Text fontSize="sm">{partyService.service?.description || ''}</Text>
                              
                              {/* Service-specific options if available */}
                              {partyService.specificOptions && Object.keys(partyService.specificOptions).length > 0 && (
                                <Box mt={2} p={2} bg="gray.50" borderRadius="md">
                                  <Text fontSize="xs" fontWeight="bold" mb={1}>Specific Requirements:</Text>
                                  <SimpleGrid columns={2} spacing={2} fontSize="xs">
                                    {Object.entries(partyService.specificOptions).map(([key, value]) => (
                                      <Box key={key}>
                                        <Text as="span" fontWeight="medium">{key}: </Text>
                                        <Text as="span">{value.toString()}</Text>
                                      </Box>
                                    ))}
                                  </SimpleGrid>
                                </Box>
                              )}
                              
                              {/* Provider info if available */}
                              {partyService.offers && partyService.offers.some(o => o.status === 'APPROVED') && (
                                <Box mt={2}>
                                  {partyService.offers.filter(o => o.status === 'APPROVED').map(offer => (
                                    <Flex key={offer.id} align="center" mt={1}>
                                      <Text fontSize="xs" fontWeight="medium">Provider: </Text>
                                      <Text fontSize="xs" ml={1}>{offer.provider?.name}</Text>
                                      <Text fontSize="xs" ml={3} fontWeight="medium">Price: </Text>
                                      <Text fontSize="xs" ml={1}>${Number(offer.price).toFixed(2)}</Text>
                                    </Flex>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </Box>
                )}
                
                {/* Transactions section */}
                {selectedParty.partyServices && selectedParty.partyServices.some(s => 
                  s.offers && s.offers.some(o => o.transaction)
                ) && (
                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading as="h3" size="sm" mb={3}>Transaction History</Heading>
                    <Divider mb={3} />
                    
                    {selectedParty.partyServices.flatMap(service => 
                      service.offers
                        .filter(o => o.transaction)
                        .map(offer => (
                          <Card key={offer.transaction.id} mb={3} variant="outline">
                            <CardBody>
                              <Flex justify="space-between" mb={2}>
                                <Text fontWeight="bold">{service.service?.name}</Text>
                                <Badge colorScheme={
                                  offer.transaction.status === 'COMPLETED' ? 'green' :
                                  offer.transaction.status === 'ESCROW' ? 'blue' :
                                  offer.transaction.status === 'PROVIDER_REVIEW' ? 'yellow' :
                                  'gray'
                                }>
                                  {offer.transaction.status.replace('_', ' ')}
                                </Badge>
                              </Flex>
                              
                              <SimpleGrid columns={{base: 1, md: 2}} spacing={2}>
                                <Text fontSize="sm">Amount: ${Number(offer.transaction.amount).toFixed(2)}</Text>
                                <Text fontSize="sm">Created: {formatDate(offer.transaction.createdAt)}</Text>
                                {offer.transaction.updatedAt && (
                                  <Text fontSize="sm">Last Updated: {formatDate(offer.transaction.updatedAt)}</Text>
                                )}
                                {offer.transaction.escrowEndTime && (
                                  <Text fontSize="sm">Escrow End: {formatDate(offer.transaction.escrowEndTime)}</Text>
                                )}
                              </SimpleGrid>
                            </CardBody>
                          </Card>
                        ))
                    )}
                  </Box>
                )}
                
                {/* Comments/Notes Section */}
                {(selectedParty.comments || selectedParty.notes || selectedParty.additionalInfo || 
                  selectedParty.clientNotes || selectedParty.providerNotes || 
                  selectedParty.specialRequests || selectedParty.internalNotes) && (
                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading as="h3" size="sm" mb={3}>Comments & Notes</Heading>
                    
                    {selectedParty.comments && (
                      <Box mb={3}>
                        <Text fontWeight="medium" color="gray.700">Comments</Text>
                        <Text>{selectedParty.comments}</Text>
                      </Box>
                    )}
                    
                    {selectedParty.notes && (
                      <Box mb={3}>
                        <Text fontWeight="medium" color="gray.700">Notes</Text>
                        <Text>{selectedParty.notes}</Text>
                      </Box>
                    )}
                    
                    {selectedParty.additionalInfo && (
                      <Box mb={3}>
                        <Text fontWeight="medium" color="gray.700">Additional Information</Text>
                        <Text>{selectedParty.additionalInfo}</Text>
                      </Box>
                    )}
                    
                    {selectedParty.clientNotes && (
                      <Box mb={3}>
                        <Text fontWeight="medium" color="gray.700">Client Notes</Text>
                        <Text>{selectedParty.clientNotes}</Text>
                      </Box>
                    )}
                    
                    {selectedParty.providerNotes && (
                      <Box mb={3}>
                        <Text fontWeight="medium" color="gray.700">Provider Notes</Text>
                        <Text>{selectedParty.providerNotes}</Text>
                      </Box>
                    )}
                    
                    {selectedParty.specialRequests && (
                      <Box mb={3}>
                        <Text fontWeight="medium" color="gray.700">Special Requests</Text>
                        <Text>{selectedParty.specialRequests}</Text>
                      </Box>
                    )}
                    
                    {selectedParty.internalNotes && (
                      <Box mb={3}>
                        <Text fontWeight="medium" color="gray.700">Internal Notes</Text>
                        <Text>{selectedParty.internalNotes}</Text>
                      </Box>
                    )}
                  </Box>
                )}
                
                {/* Location details section */}
                <Box id="locationDetails" borderWidth="1px" borderRadius="md" p={4}>
                  <Heading as="h3" size="sm" mb={3}>Location Details</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {/* Main location info */}
                    <Box>
                      <Text color="gray.600" fontWeight="medium">Primary Location</Text>
                      <Flex align="start">
                        <Icon as={FiMapPin} mt={1} mr={2} color="brand.500" />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">
                            {selectedParty.city?.name || 'City not specified'}
                          </Text>
                          {selectedParty.location && <Text>{selectedParty.location}</Text>}
                          {selectedParty.venue && <Text>{selectedParty.venue}</Text>}
                          {selectedParty.address && (
                            <Text fontSize="sm" color="gray.600">{selectedParty.address}</Text>
                          )}
                          {selectedParty.addressDetails && (
                            <Text fontSize="sm" color="gray.600">{selectedParty.addressDetails}</Text>
                          )}
                        </VStack>
                      </Flex>
                    </Box>
                    
                    {/* Additional location fields */}
                    <Box>
                      <Text color="gray.600" fontWeight="medium">Additional Details</Text>
                      <VStack align="start" spacing={1}>
                        {selectedParty.zip && (
                          <Text fontSize="sm">ZIP/Postal Code: {selectedParty.zip}</Text>
                        )}
                        {selectedParty.state && (
                          <Text fontSize="sm">State/Province: {selectedParty.state}</Text>
                        )}
                        {selectedParty.country && (
                          <Text fontSize="sm">Country: {selectedParty.country}</Text>
                        )}
                        {selectedParty.coordinates && (
                          <Text fontSize="sm">Coordinates: {selectedParty.coordinates}</Text>
                        )}
                      </VStack>
                    </Box>
                  </SimpleGrid>
                  
                  {/* Location notes or instructions */}
                  {(selectedParty.locationNotes || selectedParty.locationInstructions || selectedParty.directions) && (
                    <Box mt={3}>
                      <Text color="gray.600" fontWeight="medium" mb={1}>Directions/Notes</Text>
                      {selectedParty.locationNotes && <Text fontSize="sm">{selectedParty.locationNotes}</Text>}
                      {selectedParty.locationInstructions && <Text fontSize="sm">{selectedParty.locationInstructions}</Text>}
                      {selectedParty.directions && <Text fontSize="sm">{selectedParty.directions}</Text>}
                    </Box>
                  )}
                </Box>
                
                {/* Debug section - only shown in development */}
                {process.env.NODE_ENV !== 'production' && (
                  <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50">
                    <Heading as="h3" size="sm" mb={3}>Debug - All Party Fields</Heading>
                    <Text as="pre" fontSize="xs" overflowX="auto" maxHeight="200px" overflowY="auto">
                      {JSON.stringify(selectedParty, null, 2)}
                    </Text>
                  </Box>
                )}
              </VStack>
            ) : (
              <Text>No party details available</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onPartyModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Cancel Transaction Dialog */}
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