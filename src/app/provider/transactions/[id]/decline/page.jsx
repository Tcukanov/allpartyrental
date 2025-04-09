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
  Flex,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { formatCurrency } from '@/lib/utils/formatters';
import React from 'react';

export default function DeclineTransactionPage({ params }) {
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
  const [reason, setReason] = useState('');
  
  useEffect(() => {
    // Check if user is logged in
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/provider/transactions/${id}/decline`);
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
        
        // Check if transaction can be declined
        if (data.data.status !== 'PROVIDER_REVIEW') {
          setError(`This transaction cannot be declined because its status is ${data.data.status}`);
        }
        
        // Check if user is the provider of this transaction
        if (data.data.offer.providerId !== session.user.id) {
          setError('You are not authorized to decline this transaction');
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
  
  const handleDecline = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Required field',
        description: 'Please provide a reason for declining this request',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/transactions/${id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to decline transaction');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to decline transaction');
      }
      
      setSuccess(true);
      toast({
        title: 'Request declined',
        description: 'The service request has been declined and the client will be refunded',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/provider/transactions');
      }, 3000);
    } catch (error) {
      console.error('Error declining transaction:', error);
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
              <Icon as={CheckCircleIcon} w={16} h={16} color="blue.500" />
              <Heading size="lg">Service Request Declined</Heading>
              <Text textAlign="center">
                You have declined this service request. The client's payment will be refunded automatically.
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
        <Heading size="lg">Decline Service Request</Heading>
        
        <Card borderRadius="lg">
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md">{transaction?.offer?.service?.name}</Heading>
                <Badge colorScheme="yellow" p={2} borderRadius="md">
                  Awaiting Your Decision
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
                <Text>{formatCurrency(transaction?.amount)}</Text>
              </Box>
              
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Declining this request will result in a full refund to the client. 
                    Please provide a reason for your decision.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <FormControl isRequired>
                <FormLabel>Reason for declining</FormLabel>
                <Textarea 
                  placeholder="Please explain why you're declining this service request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  minH="120px"
                />
                <FormHelperText>
                  This reason will be shared with the client to help them understand your decision.
                </FormHelperText>
              </FormControl>
              
              <HStack spacing={4} justify="center">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleDecline}
                  isLoading={isSubmitting}
                  loadingText="Declining"
                  isDisabled={!reason.trim()}
                >
                  Decline Request
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
} 