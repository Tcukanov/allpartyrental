'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Button,
  ButtonGroup,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  Code,
  useToast,
  Flex,
  IconButton,
  Tooltip,
  Link
} from '@chakra-ui/react';
import { 
  ArrowBackIcon, 
  ExternalLinkIcon, 
  InfoIcon,
  CheckIcon,
  CloseIcon
} from '@chakra-ui/icons';
import { FiTool, FiRefreshCw, FiEye } from 'react-icons/fi';
import NextLink from 'next/link';

export default function AdminTransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();
  
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState(null);

  const transactionId = params?.id;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session.user.role !== 'ADMIN') {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to view this page',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push('/');
      return;
    }

    if (transactionId) {
      fetchTransactionDetails();
    }
  }, [transactionId, session, status]);

  const fetchTransactionDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transactions/${transactionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch transaction details');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTransaction(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch transaction details');
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      setError(error.message);
      toast({
        title: 'Error',
        description: `Failed to fetch transaction details: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTransaction = async () => {
    try {
      setIsApproving(true);
      
      const response = await fetch(`/api/transactions/${transaction.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to approve transaction');
      }
      
      // Update local state
      setTransaction(data.data.transaction);
      
      toast({
        title: 'Transaction Approved',
        description: 'The transaction has been approved and payment has been processed.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh transaction data
      await fetchTransactionDetails();
      
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({
        title: 'Approval Failed',
        description: error.message,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsApproving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'green';
      case 'PENDING':
        return 'yellow';
      case 'ESCROW':
        return 'blue';
      case 'PROVIDER_REVIEW':
        return 'orange';
      case 'APPROVED':
        return 'green';
      case 'DECLINED':
        return 'red';
      case 'FAILED':
        return 'red';
      case 'REFUNDED':
        return 'purple';
      case 'DISPUTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getPayPalDashboardUrl = () => {
    return 'https://sandbox.paypal.com/merchantapps/home#/activity/all';
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" h="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" thickness="4px" color="blue.500" />
            <Text>Loading transaction details...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">Error loading transaction</Text>
            <Text>{error}</Text>
          </VStack>
        </Alert>
      </Container>
    );
  }

  if (!transaction) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          <Text>Transaction not found</Text>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header */}
      <Box mb={8}>
        <HStack spacing={4} mb={4}>
          <IconButton
            icon={<ArrowBackIcon />}
            onClick={() => router.back()}
            aria-label="Go back"
            variant="ghost"
          />
          <VStack align="start" spacing={1} flex="1">
            <Heading as="h1" size="xl">
              Transaction Details
            </Heading>
            <Text color="gray.600">
              View complete transaction information and debugging tools
            </Text>
          </VStack>
          
          <ButtonGroup>
            <Tooltip label="Refresh data">
              <IconButton
                icon={<FiRefreshCw />}
                onClick={fetchTransactionDetails}
                aria-label="Refresh"
                variant="outline"
              />
            </Tooltip>
            <Button
              as={NextLink}
              href="/admin/transactions"
              variant="outline"
            >
              Back to All Transactions
            </Button>
          </ButtonGroup>
        </HStack>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Transaction Info */}
        <Card>
          <CardHeader>
            <Heading size="md">Transaction Information</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Text fontWeight="bold">Transaction ID:</Text>
                <Text fontFamily="mono">{transaction.id}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Status:</Text>
                <Badge colorScheme={getStatusColor(transaction.status)} size="lg">
                  {transaction.status}
                </Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Amount:</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.500">
                  ${Number(transaction.amount).toFixed(2)}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Created:</Text>
                <Text>{formatDate(transaction.createdAt)}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Updated:</Text>
                <Text>{formatDate(transaction.updatedAt)}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">PayPal Payment ID:</Text>
                <Text fontFamily="mono" fontSize="sm">
                  {transaction.paymentIntentId || 'N/A'}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Transfer ID:</Text>
                <Text fontFamily="mono" fontSize="sm">
                  {transaction.transferId || 'N/A'}
                </Text>
              </HStack>
              
              <Divider />
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Client Fee:</Text>
                <Text>{transaction.clientFeePercent}%</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Provider Fee:</Text>
                <Text>{transaction.providerFeePercent}%</Text>
              </HStack>
              
              {transaction.escrowStartTime && (
                <HStack justify="space-between">
                  <Text fontWeight="bold">Escrow Start:</Text>
                  <Text>{formatDate(transaction.escrowStartTime)}</Text>
                </HStack>
              )}
              
              {transaction.escrowEndTime && (
                <HStack justify="space-between">
                  <Text fontWeight="bold">Escrow End:</Text>
                  <Text>{formatDate(transaction.escrowEndTime)}</Text>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Service & Party Info */}
        <Card>
          <CardHeader>
            <Heading size="md">Service & Party Information</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Text fontWeight="bold">Service:</Text>
                <Text>{transaction.offer?.service?.name || 'N/A'}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Party:</Text>
                <Text>{transaction.party?.name || 'N/A'}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Party Date:</Text>
                <Text>{formatDate(transaction.party?.date)}</Text>
              </HStack>
              
              <Divider />
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Client:</Text>
                <VStack align="end" spacing={0}>
                  <Text>{transaction.offer?.client?.name || 'N/A'}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {transaction.offer?.client?.email || 'N/A'}
                  </Text>
                </VStack>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Provider:</Text>
                <VStack align="end" spacing={0}>
                  <Text>{transaction.offer?.provider?.name || 'N/A'}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {transaction.offer?.provider?.email || 'N/A'}
                  </Text>
                </VStack>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="bold">Offer Price:</Text>
                <Text>${Number(transaction.offer?.price || 0).toFixed(2)}</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Debug & Actions */}
        <Card>
          <CardHeader>
            <Heading size="md">Debug & Actions</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Button
                as={NextLink}
                href={`/debug/payment-tracker?transactionId=${transaction.id}`}
                leftIcon={<FiTool />}
                colorScheme="purple"
                variant="outline"
                size="lg"
              >
                Open Payment Tracker
              </Button>
              
              {transaction.paymentIntentId && (
                <Button
                  as={NextLink}
                  href={`/debug/payment-tracker?orderId=${transaction.paymentIntentId}`}
                  leftIcon={<InfoIcon />}
                  colorScheme="blue"
                  variant="outline"
                  size="lg"
                >
                  Debug PayPal Order
                </Button>
              )}
              
              <Button
                as="a"
                href={getPayPalDashboardUrl()}
                target="_blank"
                leftIcon={<ExternalLinkIcon />}
                colorScheme="orange"
                variant="outline"
                size="lg"
              >
                Open PayPal Dashboard
              </Button>
              
              <Divider />
              
              <Text fontWeight="bold" fontSize="sm" color="gray.600">
                Transaction Actions:
              </Text>
              
              <ButtonGroup width="100%" orientation="vertical" spacing={2}>
                <Button
                  onClick={handleApproveTransaction}
                  isLoading={isApproving}
                  loadingText="Approving..."
                  leftIcon={<CheckIcon />}
                  colorScheme="green"
                  variant="solid"
                  size="sm"
                  isDisabled={transaction?.status === 'COMPLETED' || transaction?.status === 'DECLINED'}
                >
                  Approve Transaction
                </Button>
                
                <Button
                  leftIcon={<CloseIcon />}
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  isDisabled
                >
                  Decline Transaction (Coming Soon)
                </Button>
                
                <Button
                  leftIcon={<FiEye />}
                  variant="outline"
                  size="sm"
                  as={NextLink}
                  href={`/admin/transactions/${transaction.id}/logs`}
                  isDisabled
                >
                  View Transaction Logs (Coming Soon)
                </Button>
              </ButtonGroup>
            </VStack>
          </CardBody>
        </Card>

        {/* Raw Data */}
        <Card>
          <CardHeader>
            <Heading size="md">Raw Transaction Data</Heading>
          </CardHeader>
          <CardBody>
            <Box
              p={4}
              bg="gray.50"
              borderRadius="md"
              overflowX="auto"
              maxH="400px"
              overflowY="auto"
            >
              <Code display="block" whiteSpace="pre" fontSize="xs">
                {JSON.stringify(transaction, null, 2)}
              </Code>
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Container>
  );
} 