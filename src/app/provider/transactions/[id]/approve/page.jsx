'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  HStack,
  Card,
  CardBody,
  Divider,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Badge,
  Flex
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { formatCurrency } from '@/lib/utils/formatters';
import React from 'react';
import { transactionRequiresAction } from '@/utils/statusConfig';

/**
 * Page for a provider to approve a transaction
 */
export default function ApproveTransactionPage({ params }) {
  // Use React.use() to unwrap the params promise
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/provider/transactions/${id}/approve`);
      return;
    }
    
    // Check if user is a provider
    if (status === 'authenticated' && session.user.role !== 'PROVIDER') {
      toast({
        title: 'Access denied',
        description: 'Only providers can access this page',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push('/');
      return;
    }
    
    // Fetch transaction data
    const fetchTransaction = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/transactions/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transaction data');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to fetch transaction');
        }
        
        setTransaction(data.data);
        
        // Check if transaction can be approved
        if (!transactionRequiresAction(data.data.status)) {
          setError(`This transaction cannot be approved because its status is ${data.data.status}`);
        }
        
        // Check if user is the provider of this transaction
        if (data.data.offer.providerId !== session.user.id) {
          setError('You are not authorized to approve this transaction');
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchTransaction();
    }
  }, [id, status, session, router, toast]);
  
  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/transactions/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve transaction');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to approve transaction');
      }
      
      setSuccess(true);
      toast({
        title: 'Transaction approved',
        description: 'Payment has been processed and will be transferred directly to your PayPal account',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/provider/transactions');
      }, 3000);
    } catch (error) {
      console.error('Error approving transaction:', error);
      setError(error.message);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  if (isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="blue.500" />
          <Text mt={4}>Loading transaction details...</Text>
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxW="container.md" py={8}>
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
        
        <Button colorScheme="blue" onClick={() => router.push('/provider/transactions')}>
          Return to Transactions
        </Button>
      </Container>
    );
  }
  
  if (success) {
    return (
      <Container maxW="container.md" py={8}>
        <Card borderRadius="lg">
          <CardBody>
            <VStack spacing={6} align="center" py={6}>
              <Icon as={CheckCircleIcon} w={16} h={16} color="green.500" />
              <Heading size="lg">Service Request Approved!</Heading>
              <Text textAlign="center">
                You have successfully approved the service request. The payment has been processed and 
                transferred directly to your PayPal account. The transaction is now marked as completed.
              </Text>
              <Button 
                colorScheme="blue" 
                size="lg"
                onClick={() => router.push('/provider/transactions')}
                mt={4}
              >
                Return to Transactions
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Approve Service Request</Heading>
        
        <Card borderRadius="lg">
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md">{transaction?.offer?.service?.name}</Heading>
                <Badge colorScheme="yellow" p={2} borderRadius="md">
                  Awaiting Approval
                </Badge>
              </Flex>
              
              <Divider />
              
              <Box>
                <Text fontWeight="bold" mb={2}>Service Details</Text>
                <Text>{transaction?.offer?.description}</Text>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Client</Text>
                <Text>{transaction?.offer?.client?.name}</Text>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Payment</Text>
                <HStack>
                  <Text>Amount:</Text>
                  <Text fontWeight="bold">{formatCurrency(transaction?.amount)}</Text>
                </HStack>
                <HStack>
                  <Text>Platform Fee:</Text>
                  <Text>{transaction?.providerFeePercent}%</Text>
                </HStack>
                <HStack>
                  <Text>You will receive:</Text>
                  <Text fontWeight="bold">
                    {formatCurrency(transaction?.amount * (1 - transaction?.providerFeePercent / 100))}
                  </Text>
                </HStack>
              </Box>
              
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Payment Process</AlertTitle>
                  <AlertDescription>
                    By approving this request, you confirm the booking and authorize payment processing.
                    The payment will be immediately transferred to your PayPal account.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <HStack spacing={4} justify="center">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  colorScheme="green" 
                  onClick={handleApprove}
                  isLoading={isSubmitting}
                  loadingText="Approving"
                >
                  Approve Request
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
} 