'use client';

import React, { useState, useEffect, use } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Skeleton,
  useToast,
  IconButton,
  Flex,
  HStack,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { FiExternalLink, FiInfo, FiDollarSign } from 'react-icons/fi';
import ProviderLayout from '../../components/ProviderLayout';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'PAID_PENDING_PROVIDER_ACCEPTANCE': return 'yellow';
      case 'PENDING_PAYMENT': return 'orange';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box
      bg={`${getStatusColor(status)}.100`}
      color={`${getStatusColor(status)}.800`}
      px={3}
      py={1}
      borderRadius="md"
      fontSize="sm"
      fontWeight="bold"
      display="inline-block"
    >
      {status}
    </Box>
  );
};

export default function TransactionDetailsPage({ params }) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Unwrap params using React.use() as required by Next.js 15
  const { id } = use(params);

  const formatAmount = (amount) => {
    return Number(amount).toFixed(2);
  };

  const canRefund = (transaction) => {
    if (!transaction) return false;
    const refundableStatuses = ['COMPLETED', 'ESCROW', 'PAID_PENDING_PROVIDER_ACCEPTANCE'];
    return refundableStatuses.includes(transaction.status) && 
           transaction.paypalCaptureId &&
           transaction.status !== 'REFUNDED';
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for the refund',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsRefunding(true);

    try {
      const response = await fetch(`/api/provider/transactions/${id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: refundReason }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process refund');
      }

      toast({
        title: 'Refund Issued',
        description: `Refund of $${formatAmount(data.data.amount)} has been issued successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh transaction data
      const refreshResponse = await fetch(`/api/provider/transactions/${id}`);
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setTransaction(refreshedData);
      }

      onClose();
      setRefundReason('');
    } catch (err) {
      console.error('Refund error:', err);
      toast({
        title: 'Refund Failed',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRefunding(false);
    }
  };

  useEffect(() => {
    async function fetchTransaction() {
      try {
        setLoading(true);
        
        // Check session
        const session = await getSession();
        if (!session || !session.user) {
          router.push('/login');
          return;
        }
        
        // Fetch transaction details
        const response = await fetch(`/api/provider/transactions/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transaction details');
        }
        
        const data = await response.json();
        setTransaction(data);
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
    
    fetchTransaction();
  }, [id, router, toast]);

  if (loading) {
    return (
      <ProviderLayout>
        <Container maxW="container.lg" py={8}>
          <Skeleton height="300px" />
        </Container>
      </ProviderLayout>
    );
  }

  if (error || !transaction) {
    return (
      <ProviderLayout>
        <Container maxW="container.lg" py={8}>
          <Card>
            <CardBody>
              <Text color="red.500">
                {error || 'Transaction not found'}
              </Text>
            </CardBody>
          </Card>
        </Container>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <Container maxW="container.lg" py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>Transaction Details</Heading>
        {canRefund(transaction) && (
          <Button
            colorScheme="red"
            leftIcon={<FiDollarSign />}
            onClick={onOpen}
          >
            Issue Refund
          </Button>
        )}
      </Flex>
      
      {/* Basic Transaction Information */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Transaction Information</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box>
              <Text fontWeight="bold" mb={1}>Transaction ID:</Text>
              <Text mb={4}>{transaction.id}</Text>
              
              <Text fontWeight="bold" mb={1}>Status:</Text>
              <StatusBadge status={transaction.status} />
            </Box>
            
            <Box>
              <Text fontWeight="bold" mb={1}>Amount:</Text>
              <Text fontSize="xl" fontWeight="bold" color="green.500" mb={4}>
                ${formatAmount(transaction.amount)}
              </Text>
              
              <Text fontWeight="bold" mb={1}>Created:</Text>
              <Text>{new Date(transaction.createdAt).toLocaleDateString()}</Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Client Information */}
      {transaction.offer?.client && (
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Client Information</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Text fontWeight="bold" mb={1}>Name:</Text>
                <Text mb={4}>{transaction.offer.client.name || 'N/A'}</Text>
                
                <Text fontWeight="bold" mb={1}>Email:</Text>
                <Text mb={4}>{transaction.offer.client.email || 'N/A'}</Text>
              </Box>
              <Box>
                {transaction.party && (
                  <>
                    <Text fontWeight="bold" mb={1}>Party Name:</Text>
                    <Text mb={4}>{transaction.party.name || 'N/A'}</Text>
                    
                    <Text fontWeight="bold" mb={1}>Party Date:</Text>
                    <Text mb={4}>{transaction.party.date ? new Date(transaction.party.date).toLocaleDateString() : 'N/A'}</Text>
                  </>
                )}
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Service Information */}
      {transaction.offer?.service && (
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Service Information</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Text fontWeight="bold" mb={1}>Service Name:</Text>
                <Text mb={4}>{transaction.offer.service.name || 'N/A'}</Text>
                
                <Text fontWeight="bold" mb={1}>Service Price:</Text>
                <Text fontSize="lg" fontWeight="bold" color="blue.500" mb={4}>
                  ${transaction.offer.price ? formatAmount(transaction.offer.price) : '0.00'}
                </Text>
              </Box>
              <Box>
                {transaction.offer.partyService?.specificOptions && (
                  <>
                    {transaction.offer.partyService.specificOptions.duration && (
                      <>
                        <Text fontWeight="bold" mb={1}>Duration:</Text>
                        <Text mb={4}>{transaction.offer.partyService.specificOptions.duration} hours</Text>
                      </>
                    )}
                    
                    {transaction.offer.partyService.specificOptions.guestCount && (
                      <>
                        <Text fontWeight="bold" mb={1}>Guest Count:</Text>
                        <Text mb={4}>{transaction.offer.partyService.specificOptions.guestCount}</Text>
                      </>
                    )}
                  </>
                )}
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Booking Details */}
      {transaction.offer?.partyService?.specificOptions && (
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Booking Details</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                {transaction.offer.partyService.specificOptions.bookingDate && (
                  <>
                    <Text fontWeight="bold" mb={1}>Event Date:</Text>
                    <Text mb={4}>{new Date(transaction.offer.partyService.specificOptions.bookingDate).toLocaleDateString()}</Text>
                  </>
                )}
                
                {transaction.offer.partyService.specificOptions.address && (
                  <>
                    <Text fontWeight="bold" mb={1}>Address:</Text>
                    <Text mb={4}>{transaction.offer.partyService.specificOptions.address}</Text>
                  </>
                )}
                
                {transaction.offer.partyService.specificOptions.city && (
                  <>
                    <Text fontWeight="bold" mb={1}>City:</Text>
                    <Text mb={4}>{transaction.offer.partyService.specificOptions.city}</Text>
                  </>
                )}
                
                {transaction.offer.partyService.specificOptions.zipCode && (
                  <>
                    <Text fontWeight="bold" mb={1}>Zip Code:</Text>
                    <Text mb={4}>{transaction.offer.partyService.specificOptions.zipCode}</Text>
                  </>
                )}
              </Box>
              
              <Box>
                {transaction.offer.partyService.specificOptions.contactPhone && (
                  <>
                    <Text fontWeight="bold" mb={1}>Contact Phone:</Text>
                    <Text mb={4}>{transaction.offer.partyService.specificOptions.contactPhone}</Text>
                  </>
                )}
                
                {transaction.offer.partyService.specificOptions.contactEmail && (
                  <>
                    <Text fontWeight="bold" mb={1}>Contact Email:</Text>
                    <Text mb={4}>{transaction.offer.partyService.specificOptions.contactEmail}</Text>
                  </>
                )}
                
                {transaction.offer.partyService.specificOptions.comments && (
                  <>
                    <Text fontWeight="bold" mb={1}>Special Requests:</Text>
                    <Text mb={4}>{transaction.offer.partyService.specificOptions.comments}</Text>
                  </>
                )}
              </Box>
            </SimpleGrid>
            
            {/* Pricing Breakdown */}
            {transaction.offer.partyService.specificOptions.pricing && (
              <>
                <Box mt={6} pt={6} borderTop="1px solid" borderColor="gray.200">
                  <Heading size="sm" mb={4}>Pricing Breakdown</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Flex justify="space-between">
                      <Text>Base Price:</Text>
                      <Text fontWeight="bold">${formatAmount(transaction.offer.partyService.specificOptions.pricing.basePrice || 0)}</Text>
                    </Flex>
                    
                    <Flex justify="space-between">
                      <Text>Service Fee:</Text>
                      <Text fontWeight="bold">${formatAmount(transaction.offer.partyService.specificOptions.pricing.serviceFee || 0)}</Text>
                    </Flex>
                    
                    <Flex justify="space-between" gridColumn={{ md: "span 2" }} pt={2} borderTop="1px solid" borderColor="gray.200">
                      <Text fontWeight="bold" fontSize="lg">Total:</Text>
                      <Text fontWeight="bold" fontSize="lg" color="green.500">${formatAmount(transaction.offer.partyService.specificOptions.pricing.total || 0)}</Text>
                    </Flex>
                  </SimpleGrid>
                </Box>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* PayPal Payment Information */}
      {(transaction.paypalOrderId || transaction.paypalCaptureId) && (
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">PayPal Payment Information</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                {transaction.paypalOrderId && (
                  <>
                    <Text fontWeight="bold" mb={1}>PayPal Order ID:</Text>
                    <Text mb={4} fontFamily="monospace" fontSize="sm">{transaction.paypalOrderId}</Text>
                  </>
                )}
                
                {transaction.paypalCaptureId && (
                  <>
                    <Text fontWeight="bold" mb={1}>PayPal Capture ID:</Text>
                    <Text mb={4} fontFamily="monospace" fontSize="sm">{transaction.paypalCaptureId}</Text>
                  </>
                )}

                {transaction.paypalTransactionId && (
                  <>
                    <Text fontWeight="bold" mb={1}>PayPal Transaction ID:</Text>
                    <Text mb={4} fontFamily="monospace" fontSize="sm">{transaction.paypalTransactionId}</Text>
                  </>
                )}
                
                <Text fontWeight="bold" mb={1}>Payment Status:</Text>
                <StatusBadge status={transaction.status} />
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={1}>Amount:</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.500" mb={4}>
                  ${formatAmount(transaction.amount)}
                </Text>

                {transaction.paypalPayerId && (
                  <>
                    <Text fontWeight="bold" mb={1}>Payer ID:</Text>
                    <Text mb={4} fontFamily="monospace" fontSize="sm">{transaction.paypalPayerId}</Text>
                  </>
                )}

                {transaction.paypalStatus && (
                  <>
                    <Text fontWeight="bold" mb={1}>PayPal Status:</Text>
                    <Text mb={4}>{transaction.paypalStatus}</Text>
                  </>
                )}
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Refund Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Issue Refund</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <AlertDescription>
                This will refund ${formatAmount(transaction?.amount || 0)} to the customer. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <FormControl isRequired>
              <FormLabel>Refund Reason</FormLabel>
              <Textarea
                placeholder="Please provide a reason for issuing this refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
              />
              <Text fontSize="sm" color="gray.500" mt={2}>
                This reason will be shared with the customer and recorded in the transaction history.
              </Text>
            </FormControl>

            <Alert status="info" mt={4}>
              <AlertIcon />
              <AlertDescription fontSize="sm">
                <strong>Note:</strong> If you have insufficient funds in your PayPal account, the refund will fail. 
                Please ensure you have at least ${formatAmount(transaction?.amount || 0)} available in your PayPal account.
              </AlertDescription>
            </Alert>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isRefunding}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleRefund}
              isLoading={isRefunding}
              loadingText="Processing Refund..."
            >
              Issue Refund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
    </ProviderLayout>
  );
} 