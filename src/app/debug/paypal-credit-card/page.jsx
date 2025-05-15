'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Container,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  useToast,
  Spinner
} from '@chakra-ui/react';
import PayPalPaymentButton from '@/components/payment/PayPalPaymentButton';

export default function PayPalCreditCardDebugPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [paypalStatus, setPaypalStatus] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const toast = useToast();

  useEffect(() => {
    // Check PayPal status
    const checkPayPalStatus = async () => {
      try {
        const response = await fetch('/api/debug/paypal-test');
        const data = await response.json();
        setPaypalStatus(data);
      } catch (error) {
        console.error('Error checking PayPal status:', error);
        setPaypalStatus({ success: false, error: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    checkPayPalStatus();
  }, []);

  const handlePaymentSuccess = (result) => {
    setPaymentResult({
      success: true,
      ...result
    });
    
    toast({
      title: 'Payment Successful',
      description: `Transaction completed with ID: ${result.id}`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  const handlePaymentError = (error) => {
    setPaymentResult({
      success: false,
      error: error.message
    });
    
    toast({
      title: 'Payment Failed',
      description: error.message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          PayPal Credit Card Integration Test
        </Heading>
        
        {isLoading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Checking PayPal configuration...</Text>
          </Box>
        ) : (
          <>
            <Card>
              <CardHeader>
                <Heading size="md">PayPal Configuration Status</Heading>
              </CardHeader>
              <CardBody>
                {paypalStatus?.success ? (
                  <Alert status="success" mb={4}>
                    <AlertIcon />
                    {paypalStatus.message}
                  </Alert>
                ) : (
                  <Alert status="error" mb={4}>
                    <AlertIcon />
                    {paypalStatus?.message || 'Failed to check PayPal configuration'}
                  </Alert>
                )}
                
                <Text fontWeight="bold" mt={2}>Environment:</Text>
                <Text>{paypalStatus?.environment}</Text>
                
                <Text fontWeight="bold" mt={2}>PayPal Configured:</Text>
                <Text>{paypalStatus?.paypalConfigured ? 'Yes' : 'No'}</Text>
                
                <Text fontWeight="bold" mt={2}>Using Mocks:</Text>
                <Text>{paypalStatus?.usingMocks ? 'Yes' : 'No'}</Text>
                
                {paypalStatus?.test && (
                  <>
                    <Text fontWeight="bold" mt={2}>Test Order:</Text>
                    <Text>Amount: ${paypalStatus.test.amount}</Text>
                    <Text>Order ID: {paypalStatus.test.orderId}</Text>
                    <Text>Status: {paypalStatus.test.status}</Text>
                  </>
                )}
              </CardBody>
            </Card>
            
            <Card>
              <CardHeader>
                <Heading size="md">Test Credit Card Payment</Heading>
              </CardHeader>
              <CardBody>
                <Text mb={4}>
                  This will test a $15.00 payment using PayPal's credit card processing.
                  The credit card fields should display immediately without requiring a button click.
                </Text>
                
                <Box my={5}>
                  <PayPalPaymentButton
                    amount={15.00}
                    serviceName="Test Credit Card Payment"
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    showCardByDefault={true}
                    metadata={{
                      test: true,
                      timestamp: new Date().toISOString()
                    }}
                  />
                </Box>
                
                {paymentResult && (
                  <Box mt={5}>
                    <Text fontWeight="bold">Payment Result:</Text>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px', 
                      borderRadius: '4px',
                      overflow: 'auto' 
                    }}>
                      {JSON.stringify(paymentResult, null, 2)}
                    </pre>
                  </Box>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </VStack>
    </Container>
  );
} 