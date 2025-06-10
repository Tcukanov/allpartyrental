'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Box,
  Badge,
  List,
  ListItem,
  ListIcon,
  useToast,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Flex
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';
import PayPalAdvancedCreditCard from '@/components/payment/PayPalAdvancedCreditCard';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TestPayPalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [config, setConfig] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Mock booking data for testing
  const testBookingData = {
    serviceId: 'test-service-id',
    bookingDate: new Date().toISOString(),
    duration: 2,
    address: 'Test Address',
    comments: 'Test payment integration'
  };

  // Redirect non-admin users
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Load PayPal configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/debug/paypal-config');
        const data = await response.json();
        
        if (data.success) {
          setConfig(data);
        } else {
          throw new Error(data.error || 'Failed to load config');
        }
      } catch (error) {
        console.error('Failed to load PayPal config:', error);
        toast({
          title: 'Configuration Error',
          description: 'Failed to load PayPal configuration',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoadingConfig(false);
      }
    };

    if (session?.user?.role === 'ADMIN') {
      fetchConfig();
    }
  }, [session, toast]);

  const handlePaymentSuccess = (paymentData) => {
    toast({
      title: 'Test Payment Successful!',
      description: `Payment captured: ${paymentData.captureId}`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    setShowPaymentForm(false);
  };

  const handlePaymentError = (error) => {
    toast({
      title: 'Test Payment Failed',
      description: error,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  const handlePaymentCancel = () => {
    toast({
      title: 'Test Payment Cancelled',
      description: 'Payment was cancelled',
      status: 'warning',
      duration: 3000,
      isClosable: true,
    });
    setShowPaymentForm(false);
  };

  if (status === 'loading' || isLoadingConfig) {
    return (
      <Container maxW="container.lg" py={10}>
        <Flex justify="center" align="center" minH="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading PayPal test environment...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null; // Will redirect
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'HEALTHY': return 'green';
      case 'NEEDS_ATTENTION': return 'yellow';
      default: return 'red';
    }
  };

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        
        {/* Header */}
        <Box textAlign="center">
          <Heading mb={2}>PayPal Integration Test</Heading>
          <Text color="gray.600">
            Test PayPal payment integration and verify configuration
          </Text>
          <Badge colorScheme="blue" mt={2}>Admin Only</Badge>
        </Box>

        {/* Configuration Status */}
        {config && (
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Configuration Status</Heading>
                <Badge colorScheme={getStatusColor(config.status)} fontSize="md">
                  {config.status}
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                
                {/* Basic Config */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Environment Configuration:</Text>
                  <List spacing={2}>
                    <ListItem>
                      <ListIcon 
                        as={config.config.hasClientId ? CheckIcon : WarningIcon} 
                        color={config.config.hasClientId ? 'green.500' : 'red.500'} 
                      />
                      PayPal Client ID: {config.config.hasClientId ? 
                        `${config.config.clientIdPreview} (${config.config.clientIdLength} chars)` : 
                        'Missing'
                      }
                    </ListItem>
                    <ListItem>
                      <ListIcon 
                        as={InfoIcon} 
                        color="blue.500" 
                      />
                      Mode: {config.config.paypalMode}
                    </ListItem>
                    <ListItem>
                      <ListIcon 
                        as={config.config.hasSandboxSecret || config.config.hasLiveSecret ? CheckIcon : WarningIcon} 
                        color={config.config.hasSandboxSecret || config.config.hasLiveSecret ? 'green.500' : 'red.500'} 
                      />
                      Client Secret: {
                        config.config.paypalMode === 'sandbox' ? 
                          (config.config.hasSandboxSecret ? `Present (${config.config.sandboxSecretLength} chars)` : 'Missing') :
                          (config.config.hasLiveSecret ? `Present (${config.config.liveSecretLength} chars)` : 'Missing')
                      }
                    </ListItem>
                  </List>
                </Box>

                {/* Recommendations */}
                {config.config.recommendations.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Recommendations:</Text>
                    <List spacing={1}>
                      {config.config.recommendations.map((rec, index) => (
                        <ListItem key={index}>
                          <ListIcon 
                            as={rec.startsWith('MISSING') ? WarningIcon : InfoIcon} 
                            color={rec.startsWith('MISSING') ? 'red.500' : 'blue.500'} 
                          />
                          <Text fontSize="sm">{rec}</Text>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Test Payment Form */}
        {config?.status === 'HEALTHY' && !showPaymentForm && (
          <Card>
            <CardHeader>
              <Heading size="md">Test Payment Integration</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Text textAlign="center">
                  Configuration looks good! Ready to test the payment flow.
                </Text>
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Test Mode</Text>
                    <Text fontSize="sm">
                      This will test the complete payment flow using sandbox credentials.
                      Use test card: 4032035728288280, 12/2030, CVV: 123
                    </Text>
                  </Box>
                </Alert>
                <Button 
                  colorScheme="blue" 
                  size="lg"
                  onClick={() => setShowPaymentForm(true)}
                >
                  Start Payment Test
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Payment Form */}
        {showPaymentForm && (
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Test Payment Form</Heading>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancel Test
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
                              <PayPalAdvancedCreditCard
                amount={25.00} // Test amount
                bookingData={testBookingData}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </CardBody>
          </Card>
        )}

        {/* Configuration Issues */}
        {config?.status !== 'HEALTHY' && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Configuration Issues Detected</Text>
              <Text fontSize="sm">
                Please fix the configuration issues above before testing the payment flow.
                Check your environment variables and restart the server.
              </Text>
            </Box>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <Heading size="md">Testing Instructions</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontWeight="bold">For Sandbox Testing:</Text>
              <List spacing={2} pl={4}>
                <ListItem>• Use test card: 4032035728288280</ListItem>
                <ListItem>• Expiry: Any future date (e.g., 12/2030)</ListItem>
                <ListItem>• CVV: Any 3 digits (e.g., 123)</ListItem>
                <ListItem>• Name: Any name (e.g., John Doe)</ListItem>
              </List>
              
              <Text fontWeight="bold" mt={4}>Expected Flow:</Text>
              <List spacing={2} pl={4}>
                <ListItem>1. Payment form loads with 4 input fields</ListItem>
                <ListItem>2. Enter test card details</ListItem>
                <ListItem>3. Click "Pay $25.00" button</ListItem>
                <ListItem>4. Payment processes successfully</ListItem>
                <ListItem>5. Success message appears</ListItem>
              </List>
            </VStack>
          </CardBody>
        </Card>

      </VStack>
    </Container>
  );
} 