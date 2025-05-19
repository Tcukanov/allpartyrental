'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Divider, 
  Stack, 
  Card, 
  CardBody, 
  Badge, 
  Alert, 
  AlertIcon, 
  AlertTitle,
  AlertDescription,
  Spinner,
  Button,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  VStack,
  HStack,
  Link
} from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import SettingsLayout from '@/components/provider/SettingsLayout';
import PayPalConnectButton from '@/components/provider/PayPalConnectButton';
import { FaPaypal, FaCog, FaExclamationCircle, FaWrench } from 'react-icons/fa';

export default function PaymentsSettingsPage() {
  const searchParams = useSearchParams();
  const [paypalStatus, setPaypalStatus] = useState({
    loading: true,
    connected: false,
    details: null,
    error: null
  });
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentAlert, setPaymentAlert] = useState(null);
  const [accountIdInput, setAccountIdInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Check for success or error in the URL query params
  useEffect(() => {
    // Check for success or error parameters in the URL
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const platformError = searchParams.get('platform_error');

    if (success) {
      toast({
        title: 'Success',
        description: 'Your PayPal account has been connected successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Check and save the account ID
      checkPayPalAccount();
    } else if (error) {
      toast({
        title: 'Error',
        description: `Error connecting to PayPal: ${error}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else if (platformError) {
      setPaymentAlert({
        status: 'error',
        title: 'Platform Setup Required',
        message: 'The PayPal platform requires additional setup.',
        details: 'Admin instructions: Complete the PayPal developer account setup for marketplace integrations.'
      });
    }

    // Clean up URL by removing query parameters
    if (success || error || platformError) {
      const url = new URL(window.location);
      url.search = '';
      window.history.replaceState({}, '', url);
    }
  }, [toast]);

  // Check PayPal connection status on load
  useEffect(() => {
    checkPayPalStatus();
  }, []);

  const checkPayPalStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/provider/paypal/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to check PayPal status');
      }
      
      const data = await response.json();
      setPaypalStatus({
        loading: false,
        connected: data.connected,
        details: data.connected ? data : null,
        error: data.error || null
      });
      
      if (data.connected && data.status === 'ACTIVE') {
        setPaymentAlert({
          status: 'success',
          title: 'PayPal Connected',
          message: 'Your PayPal account is fully set up and ready to receive payments.',
        });
      } else if (data.connected) {
        setPaymentAlert({
          status: 'warning',
          title: 'PayPal account needs attention',
          message: 'Your PayPal account setup is not complete. Please complete the onboarding process to start accepting payments.',
        });
      } else {
        setPaymentAlert({
          status: 'info',
          title: 'PayPal Not Connected',
          message: 'Connect your PayPal account to receive payments for your services.',
        });
      }
    } catch (error) {
      console.error('Error checking PayPal status:', error);
      setPaymentAlert({
        status: 'error',
        title: 'Connection Error',
        message: `Failed to check PayPal status: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkPayPalAccount = async () => {
    try {
      const response = await fetch('/api/provider/paypal/account-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check account');
      }

      await checkPayPalStatus();
    } catch (error) {
      console.error('Error checking account:', error);
      toast({
        title: 'Error',
        description: `Failed to verify account: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRefreshStatus = () => {
    checkPayPalStatus();
    toast({
      title: 'Refreshing',
      description: 'Checking your PayPal connection status...',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleViewDashboard = () => {
    // Open PayPal dashboard in a new tab
    window.open('https://www.paypal.com/dashboard', '_blank');
    toast({
      title: 'Opening Dashboard',
      description: 'Redirecting to your PayPal dashboard',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleManualAccountUpdate = async (e) => {
    e.preventDefault();
    if (!accountIdInput) {
      toast({
        title: 'Error',
        description: 'Please enter a valid PayPal email or merchant ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/provider/paypal/manual-account-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paypalEmail: accountIdInput
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update account');
      }

      toast({
        title: 'Success',
        description: 'Your PayPal account information has been updated',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset the input and refresh status
      setAccountIdInput('');
      await checkPayPalStatus();
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
      setIsUpdating(false);
    }
  };

  const getBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'PENDING':
        return 'yellow';
      case 'RESTRICTED':
      case 'UNDER_REVIEW':
        return 'orange';
      case 'INACTIVE':
      case 'REJECTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <SettingsLayout>
      <Stack spacing={6}>
        <Box>
          <Heading size="lg" mb={4}>Payment Settings</Heading>
          <Text>
            Connect your PayPal account to receive payments from clients.
          </Text>
        </Box>

        {paymentAlert && (
          <Alert status={paymentAlert.status} variant="left-accent">
            <AlertIcon />
            <Box>
              <AlertTitle>{paymentAlert.title}</AlertTitle>
              <AlertDescription>
                {paymentAlert.message}
                {paymentAlert.details && (
                  <Text mt={2} fontSize="sm" color="gray.600">
                    {paymentAlert.details}
                  </Text>
                )}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <HStack justifyContent="space-between">
                <Box>
                  <Heading size="md" display="flex" alignItems="center">
                    <FaPaypal style={{ marginRight: '8px' }} /> PayPal Integration
                  </Heading>
                  <Text mt={1} color="gray.600">
                    Connect your PayPal account to receive payments
                  </Text>
                </Box>
                {paypalStatus.connected && (
                  <Badge 
                    colorScheme={getBadgeColor(paypalStatus.details?.status)} 
                    fontSize="0.8em" 
                    p={1}
                  >
                    {paypalStatus.details?.status || 'CONNECTED'}
                  </Badge>
                )}
              </HStack>

              {isLoading ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" />
                  <Text mt={2}>Checking PayPal connection...</Text>
                </Box>
              ) : (
                <>
                  {paypalStatus.connected ? (
                    <Box>
                      <HStack>
                        <Button size="sm" onClick={handleRefreshStatus}>
                          Refresh Status
                        </Button>
                        <Button size="sm" onClick={handleViewDashboard}>
                          View PayPal Dashboard
                        </Button>
                      </HStack>
                      
                      <Divider my={4} />
                      
                      <VStack align="flex-start" spacing={2}>
                        {paypalStatus.details?.email && (
                          <HStack>
                            <Text fontWeight="bold">PayPal Email:</Text>
                            <Text>{paypalStatus.details.email}</Text>
                          </HStack>
                        )}
                        {paypalStatus.details?.merchantId && (
                          <HStack>
                            <Text fontWeight="bold">Merchant ID:</Text>
                            <Text>{paypalStatus.details.merchantId}</Text>
                          </HStack>
                        )}
                        <HStack>
                          <Text fontWeight="bold">Connected:</Text>
                          <Text>{new Date(paypalStatus.details?.createdAt).toLocaleString()}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  ) : (
                    <>
                      <Box my={4}>
                        <Text mb={4}>
                          Connect your PayPal account to receive payments from customers directly to your account.
                        </Text>
                        <PayPalConnectButton />
                      </Box>
                    </>
                  )}

                  <Accordion allowToggle mt={4}>
                    <AccordionItem>
                      <h2>
                        <AccordionButton>
                          <Box flex="1" textAlign="left" display="flex" alignItems="center">
                            <FaWrench style={{ marginRight: '8px' }} />
                            Manual Account Setup
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <Text mb={4} fontSize="sm" color="gray.600">
                          If the automatic connection isn't working, you can manually enter your PayPal email address.
                        </Text>
                        <form onSubmit={handleManualAccountUpdate}>
                          <FormControl id="paypalEmail" isRequired mb={4}>
                            <FormLabel>PayPal Email Address</FormLabel>
                            <Input 
                              type="email" 
                              value={accountIdInput}
                              onChange={(e) => setAccountIdInput(e.target.value)}
                              placeholder="name@example.com"
                            />
                          </FormControl>
                          {error && (
                            <Alert status="error" mb={4}>
                              <AlertIcon />
                              <AlertDescription fontSize="sm">{error}</AlertDescription>
                            </Alert>
                          )}
                          <Button type="submit" colorScheme="brand" isLoading={isUpdating}>
                            Update Account
                          </Button>
                        </form>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Stack>
    </SettingsLayout>
  );
} 