'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Box,
  CheckCircleIcon,
  Divider,
  Badge,
  HStack,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { CheckCircleIcon as CheckIcon } from '@chakra-ui/icons';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [paymentData, setPaymentData] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const capturePayment = async () => {
      try {
        // Get PayPal order ID from URL parameters
        const orderId = searchParams.get('token');
        
        if (!orderId) {
          throw new Error('No payment order ID found');
        }

        // Capture the payment
        const response = await fetch('/api/payments/capture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Payment capture failed');
        }

        setPaymentData(data);
        setPaymentDetails(data.paymentDetails);
        setPaymentStatus('success');
        
      } catch (error) {
        console.error('Payment capture error:', error);
        setError(error.message);
        setPaymentStatus('error');
      } finally {
        setIsProcessing(false);
      }
    };

    capturePayment();
  }, [searchParams]);

  const handleContinue = () => {
    // Redirect to dashboard or booking management
    router.push('/dashboard');
  };

  const handleViewBooking = () => {
    if (paymentData?.transactionId) {
      router.push(`/bookings/${paymentData.transactionId}`);
    }
  };

  return (
    <Container maxW="md" py={8}>
      <VStack spacing={6} align="center">
        {isProcessing && (
          <>
            <Spinner size="xl" color="blue.500" />
            <Heading size="lg">Processing Payment...</Heading>
            <Text color="gray.600" textAlign="center">
              Please wait while we confirm your payment with PayPal.
            </Text>
          </>
        )}

        {paymentStatus === 'success' && (
          <>
            <CheckIcon boxSize={16} color="green.500" />
            <Heading size="lg" color="green.600">Payment Successful!</Heading>
            
            <Alert status="success" variant="subtle" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Payment Confirmed</AlertTitle>
                <AlertDescription>
                  Your payment of ${paymentData?.amountReceived?.toFixed(2)} has been processed successfully.
                  The provider will now review your booking request.
                </AlertDescription>
              </Box>
            </Alert>

            <VStack spacing={4} w="full">
              <Box p={4} border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50" w="full">
                <Text fontWeight="bold" mb={3}>Payment Details</Text>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text color="gray.600">Amount Paid:</Text>
                    <Text fontWeight="semibold">${paymentData?.amount || '0.00'}</Text>
                  </HStack>
                  
                  {paymentDetails?.paymentSource && (
                    <HStack justify="space-between">
                      <Text color="gray.600">Payment Method:</Text>
                      <Badge colorScheme="blue">{paymentDetails.paymentSource}</Badge>
                    </HStack>
                  )}
                  
                  {paymentDetails?.payerEmail && (
                    <HStack justify="space-between">
                      <Text color="gray.600">Buyer Email:</Text>
                      <Text fontSize="sm">{paymentDetails.payerEmail}</Text>
                    </HStack>
                  )}
                  
                  <HStack justify="space-between">
                    <Text color="gray.600">Status:</Text>
                    <Badge colorScheme="green">{paymentData?.status || 'Completed'}</Badge>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text color="gray.600">Transaction ID:</Text>
                    <Text fontSize="xs" color="gray.500">{paymentData?.transactionId}</Text>
                  </HStack>
                </VStack>
                
                <Text fontSize="sm" color="gray.600" mt={3}>
                  You will receive email notifications about your booking status.
                </Text>
              </Box>

              {/* Shipping Address */}
              {paymentDetails?.shippingAddress && (
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50" w="full">
                  <Text fontWeight="bold" mb={3}>Shipping Address</Text>
                  <VStack align="stretch" spacing={1}>
                    {paymentDetails.shippingAddress.line1 && (
                      <Text>{paymentDetails.shippingAddress.line1}</Text>
                    )}
                    {paymentDetails.shippingAddress.line2 && (
                      <Text>{paymentDetails.shippingAddress.line2}</Text>
                    )}
                    <Text>
                      {paymentDetails.shippingAddress.city && `${paymentDetails.shippingAddress.city}, `}
                      {paymentDetails.shippingAddress.state && `${paymentDetails.shippingAddress.state} `}
                      {paymentDetails.shippingAddress.postalCode}
                    </Text>
                    {paymentDetails.shippingAddress.country && (
                      <Text>{paymentDetails.shippingAddress.country}</Text>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Billing Address */}
              {paymentDetails?.billingAddress && (
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md" bg="gray.50" w="full">
                  <Text fontWeight="bold" mb={3}>Billing Address</Text>
                  <VStack align="stretch" spacing={1}>
                    {paymentDetails.billingAddress.line1 && (
                      <Text>{paymentDetails.billingAddress.line1}</Text>
                    )}
                    {paymentDetails.billingAddress.line2 && (
                      <Text>{paymentDetails.billingAddress.line2}</Text>
                    )}
                    <Text>
                      {paymentDetails.billingAddress.city && `${paymentDetails.billingAddress.city}, `}
                      {paymentDetails.billingAddress.state && `${paymentDetails.billingAddress.state} `}
                      {paymentDetails.billingAddress.postalCode}
                    </Text>
                    {paymentDetails.billingAddress.country && (
                      <Text>{paymentDetails.billingAddress.country}</Text>
                    )}
                  </VStack>
                </Box>
              )}

              <VStack spacing={3} w="full">
                <Button colorScheme="blue" size="lg" w="full" onClick={handleViewBooking}>
                  View Booking Details
                </Button>
                <Button variant="outline" size="lg" w="full" onClick={handleContinue}>
                  Return to Dashboard
                </Button>
              </VStack>
            </VStack>
          </>
        )}

        {paymentStatus === 'error' && (
          <>
            <Alert status="error" variant="subtle" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Payment Failed</AlertTitle>
                <AlertDescription>
                  {error || 'There was an error processing your payment. Please try again.'}
                </AlertDescription>
              </Box>
            </Alert>

            <VStack spacing={3} w="full">
              <Button colorScheme="red" size="lg" w="full" onClick={() => router.back()}>
                Go Back and Try Again
              </Button>
              <Button variant="outline" size="lg" w="full" onClick={handleContinue}>
                Return to Dashboard
              </Button>
            </VStack>
          </>
        )}
      </VStack>
    </Container>
  );
} 