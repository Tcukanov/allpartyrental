'use client';

import React, { useState, useEffect } from 'react';
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
  Button
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { FiExternalLink, FiInfo } from 'react-icons/fi';

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
  const router = useRouter();
  const toast = useToast();

  const formatAmount = (amount) => {
    return Number(amount).toFixed(2);
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
        const response = await fetch(`/api/provider/transactions/${params.id}`);
        
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
  }, [params.id, router, toast]);

  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Skeleton height="300px" />
      </Container>
    );
  }

  if (error || !transaction) {
    return (
      <Container maxW="container.lg" py={8}>
        <Card>
          <CardBody>
            <Text color="red.500">
              {error || 'Transaction not found'}
            </Text>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <Heading mb={6}>Transaction Details</Heading>
      
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

      {/* Transaction Payment Information */}
      {transaction.paymentIntentId && (
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Payment Information</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Text fontWeight="bold" mb={1}>Payment ID:</Text>
                <Text mb={4}>{transaction.paymentIntentId}</Text>
                
                <Text fontWeight="bold" mb={1}>Payment Status:</Text>
                <StatusBadge status={transaction.status} />

                {transaction.transferId && (
                  <>
                    <Text fontWeight="bold" mt={4} mb={1}>Transfer ID:</Text>
                    <Flex align="center">
                      <Text>{transaction.transferId}</Text>
                      <IconButton
                        aria-label="View in PayPal"
                        icon={<FiExternalLink />}
                        size="sm"
                        variant="ghost"
                        ml={2}
                        onClick={() => {
                          // Use same link function as dashboard
                          const usesSandbox = transaction.provider?.paypalEnvironment === 'SANDBOX';
                          const baseUrl = usesSandbox
                            ? 'https://sandbox.paypal.com/merchantapps/home#/activity/all'
                            : 'https://paypal.com/merchantapps/home#/activity/all';
                          window.open(baseUrl, '_blank');
                        }}
                      />
                    </Flex>
                  </>
                )}
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={1}>Amount:</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.500" mb={4}>
                  ${formatAmount(transaction.amount)}
                </Text>
                
                <Text fontWeight="bold" mb={1}>Debug Information:</Text>
                <HStack>
                  <Button 
                    size="sm" 
                    leftIcon={<FiInfo />}
                    onClick={() => window.open(`/api/debug/paypal-order?transactionId=${transaction.id}`, '_blank')}
                  >
                    View PayPal Details
                  </Button>
                </HStack>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}
    </Container>
  );
} 