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
import StripeConnectButton from '@/components/provider/StripeConnectButton';
import PayPalConnectButton from '@/components/provider/PayPalConnectButton';
import { FaPaypal, FaCog, FaExclamationCircle, FaWrench } from 'react-icons/fa';

export default function PaymentsSettingsPage() {
  const searchParams = useSearchParams();
  const [stripeStatus, setStripeStatus] = useState({
    loading: true,
    isConnected: false,
    details: null,
    error: null
  });
  const [paypalStatus, setPaypalStatus] = useState({
    loading: true,
    connected: false,
    details: null,
    error: null
  });
  const [activePaymentProvider, setActivePaymentProvider] = useState('paypal');
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
        description: activePaymentProvider === 'paypal' 
          ? 'Your PayPal account has been connected successfully!' 
          : 'Your Stripe account has been connected successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Check and save the account ID
      if (activePaymentProvider === 'paypal') {
        checkPayPalAccount();
      } else {
        checkStripeAccount();
      }
    } else if (error) {
      toast({
        title: 'Error',
        description: activePaymentProvider === 'paypal'
          ? `Error connecting to PayPal: ${error}`
          : `Error connecting to Stripe: ${error}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else if (platformError) {
      setPaymentAlert({
        status: 'error',
        title: 'Platform Setup Required',
        message: activePaymentProvider === 'paypal'
          ? 'The PayPal platform requires additional setup.'
          : 'The Stripe Connect platform requires additional setup.',
        details: activePaymentProvider === 'paypal'
          ? 'Admin instructions: Complete the PayPal developer account setup for marketplace integrations.'
          : 'Admin instructions: Log in to the Stripe dashboard, go to Settings > Connect Settings > Platform Profile, and complete the required information.'
      });
    }

    // Clean up URL by removing query parameters
    if (success || error || platformError) {
      const url = new URL(window.location);
      url.search = '';
      window.history.replaceState({}, '', url);
    }
  }, [toast, activePaymentProvider]);

  // Fetch the active payment provider
  useEffect(() => {
    const fetchActivePaymentProvider = async () => {
      try {
        const response = await fetch('/api/payment/active-provider');
        if (response.ok) {
          const data = await response.json();
          if (data.provider) {
            setActivePaymentProvider(data.provider);
          }
        }
      } catch (error) {
        console.error('Error fetching active payment provider:', error);
      }
    };
    
    fetchActivePaymentProvider();
  }, []);

  // Check provider connection status
  useEffect(() => {
    if (activePaymentProvider === 'paypal') {
      checkPayPalStatus();
    } else {
      checkStripeStatus();
    }
  }, [activePaymentProvider]);

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

  const checkStripeStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/provider/stripe/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to check Stripe status');
      }
      
      const data = await response.json();
      setStripeStatus(data);
      
      if (data.isConnected && data.details?.requiresAction) {
        setPaymentAlert({
          status: 'warning',
          title: 'Stripe account needs attention',
          message: 'Your Stripe account setup is not complete. Please complete the onboarding process to start accepting payments.',
        });
      } else if (data.isConnected) {
        setPaymentAlert({
          status: 'success',
          title: 'Stripe Connected',
          message: 'Your Stripe account is fully set up and ready to receive payments.',
        });
      } else {
        setPaymentAlert({
          status: 'info',
          title: 'Stripe Not Connected',
          message: 'Connect your Stripe account to receive payments for your services.',
        });
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      setPaymentAlert({
        status: 'error',
        title: 'Connection Error',
        message: `Failed to check Stripe status: ${error.message}`,
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

      const data = await response.json();
      
      if (data.success) {
        console.log('PayPal merchant ID saved:', data.merchantId);
      } else {
        console.error('Failed to save PayPal account:', data.message);
      }
    } catch (error) {
      console.error('Error checking PayPal account:', error);
    }
  };

  const checkStripeAccount = async () => {
    try {
      const response = await fetch('/api/provider/stripe/account-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Stripe account ID saved:', data.accountId);
      } else {
        console.error('Failed to save Stripe account:', data.message);
      }
    } catch (error) {
      console.error('Error checking Stripe account:', error);
    }
  };

  // Handle refresh of connection status
  const handleRefreshStatus = () => {
    if (activePaymentProvider === 'paypal') {
      checkPayPalStatus();
    } else {
      checkStripeStatus();
    }
  };

  // Update the dashboard link function
  const handleViewDashboard = () => {
    if (activePaymentProvider === 'paypal') {
      if (!paypalStatus.connected) return;
      window.open('https://www.paypal.com/merchantapps/home', '_blank');
    } else {
      if (!stripeStatus?.isConnected) return;
      window.open(
        `https://dashboard.stripe.com/express/${stripeStatus.details.accountId}`,
        '_blank'
      );
    }
  };

  // Handle manual account ID update
  const handleManualAccountUpdate = async (e) => {
    e.preventDefault();
    
    if (!accountIdInput.trim()) {
      toast({
        title: 'Input Required',
        description: activePaymentProvider === 'paypal'
          ? 'Please enter a PayPal merchant ID'
          : 'Please enter a Stripe account ID',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      const endpoint = activePaymentProvider === 'paypal'
        ? '/api/provider/paypal/update-account'
        : '/api/provider/stripe/update-account';
        
      const payload = activePaymentProvider === 'paypal'
        ? { merchantId: accountIdInput.trim() }
        : { accountId: accountIdInput.trim() };
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Account Updated',
          description: activePaymentProvider === 'paypal'
            ? `Successfully linked to PayPal merchant: ${data.merchantId}`
            : `Successfully linked to Stripe account: ${data.accountId}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setAccountIdInput('');
        handleRefreshStatus(); // Refresh the status
      } else {
        toast({
          title: 'Update Failed',
          description: data.error || `Failed to update ${activePaymentProvider === 'paypal' ? 'PayPal' : 'Stripe'} account`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: 'Update Error',
        description: error.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Determine badge color based on connection status
  const getBadgeColor = (status) => {
    if (!status || !status.connected) return 'red';
    if (status.accountType === 'SANDBOX') return 'orange';
    return 'green';
  };

  return (
    <SettingsLayout>
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
        <Heading size="lg" mb={4}>Payment Settings</Heading>
        <Divider mb={6} />
        
        <Stack spacing={6}>
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                {activePaymentProvider === 'paypal' ? 'PayPal Pro' : 'Stripe Connect'} Status
              </Heading>
              
              {isLoading ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" />
                  <Text mt={2}>
                    Checking your {activePaymentProvider === 'paypal' ? 'PayPal' : 'Stripe'} connection...
                  </Text>
                </Box>
              ) : paymentAlert ? (
                <>
                  <Alert status={paymentAlert.status} mb={4} flexDirection="column" alignItems="flex-start">
                    <Box display="flex" width="100%">
                      <AlertIcon />
                      <AlertTitle>{paymentAlert.title}</AlertTitle>
                    </Box>
                    <AlertDescription mt={2}>
                      {paymentAlert.message}
                      {paymentAlert.details && (
                        <Text mt={2} fontSize="sm" fontStyle="italic">
                          {paymentAlert.details}
                        </Text>
                      )}
                    </AlertDescription>
                  </Alert>
                  
                  <Box mt={4}>
                    <Text mb={2}>
                      If you've already set up your {activePaymentProvider === 'paypal' ? 'PayPal' : 'Stripe'} account but it's not showing here, try refreshing the status:
                    </Text>
                    <Button
                      onClick={handleRefreshStatus}
                      colorScheme={activePaymentProvider === 'paypal' ? 'blue' : 'blue'}
                      size="md"
                      isLoading={isLoading}
                    >
                      Force Refresh Status
                    </Button>
                  </Box>
                </>
              ) : activePaymentProvider === 'paypal' ? (
                // PayPal Connected Account Status
                <>
                  {paypalStatus.connected ? (
                    <>
                      <Box mb={4} display="flex" alignItems="center">
                        <Badge colorScheme={getBadgeColor(paypalStatus)}>
                          {paypalStatus.accountType === 'SANDBOX' ? 'SANDBOX MODE' : 'CONNECTED'}
                        </Badge>
                        {paypalStatus.accountType === 'SANDBOX' && (
                          <Badge colorScheme="blue">TESTING</Badge>
                        )}
                      </Box>
                      {paypalStatus.details && (
                        <Box mt={2}>
                          <Text fontWeight="bold" mb={1}>Merchant ID:</Text>
                          <Text mb={3} fontSize="sm" fontFamily="mono">
                            {paypalStatus.details.merchantId}
                          </Text>
                          <Text fontWeight="bold" mb={1}>PayPal Email:</Text>
                          <Text mb={4}>{paypalStatus.details.primaryEmail}</Text>
                          {paypalStatus.details.payments?.canReceivePayments ? (
                            <Badge colorScheme="green" mt={2}>Payments Enabled</Badge>
                          ) : (
                            <Alert status="warning" mt={2}>
                              <AlertIcon />
                              Payments are not enabled. Please complete your PayPal onboarding.
                            </Alert>
                          )}
                        </Box>
                      )}
                      <Stack direction="row" spacing={4} mt={4}>
                        <Button 
                          onClick={handleRefreshStatus} 
                          size="sm"
                          colorScheme="blue" 
                          variant="outline"
                        >
                          Refresh Status
                        </Button>
                        <PayPalConnectButton 
                          onSuccess={handleRefreshStatus}
                          isReconnect={true}
                        />
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Text mb={4}>Connect your PayPal account to receive payments for your services.</Text>
                      <PayPalConnectButton 
                        onSuccess={() => setPaypalStatus(prev => ({ ...prev, loading: true }))}
                      />
                    </>
                  )}
                </>
              ) : (
                // Stripe Connected Account Status
                <>
                  {stripeStatus.isConnected ? (
                    <>
                      <Box mb={4} display="flex" alignItems="center">
                        <Badge colorScheme="green" mr={2}>Connected</Badge>
                        <Text>Your Stripe account is connected and ready to receive payments.</Text>
                      </Box>
                      {stripeStatus.details && (
                        <Box mt={2}>
                          <Text><strong>Account ID:</strong> {stripeStatus.details.accountId}</Text>
                          {stripeStatus.details.payoutsEnabled ? (
                            <Badge colorScheme="green" mt={2}>Payouts Enabled</Badge>
                          ) : (
                            <Alert status="warning" mt={2}>
                              <AlertIcon />
                              Payouts are not enabled. Please complete your Stripe onboarding.
                            </Alert>
                          )}
                        </Box>
                      )}
                      <Stack direction="row" spacing={4} mt={4}>
                        <Button 
                          onClick={handleRefreshStatus} 
                          size="sm"
                          colorScheme="blue" 
                          variant="outline"
                        >
                          Refresh Status
                        </Button>
                        <StripeConnectButton 
                          onSuccess={handleRefreshStatus}
                          isReconnect={true}
                        />
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Text mb={4}>Connect your Stripe account to receive payments for your services.</Text>
                      <StripeConnectButton 
                        onSuccess={() => setStripeStatus(prev => ({ ...prev, loading: true }))}
                      />
                    </>
                  )}
                </>
              )}
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Payout Settings</Heading>
              <Text>
                Manage your payout schedule and bank account information directly in your 
                {activePaymentProvider === 'paypal' ? ' PayPal' : ' Stripe'} Dashboard.
              </Text>
              {(activePaymentProvider === 'paypal' && paypalStatus.connected) || 
               (activePaymentProvider === 'stripe' && stripeStatus.isConnected) ? (
                <Button 
                  mt={4} 
                  colorScheme="blue"
                  leftIcon={activePaymentProvider === 'paypal' ? <FaPaypal /> : undefined}
                  onClick={handleViewDashboard}
                >
                  Go to {activePaymentProvider === 'paypal' ? 'PayPal' : 'Stripe'} Dashboard
                </Button>
              ) : null}
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Accordion allowToggle>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box as="span" flex='1' textAlign='left'>
                        <Text fontWeight="bold">Advanced Settings (Troubleshooting)</Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Box mt={4}>
                      <Text mb={2} fontSize="sm" color="gray.600">
                        {activePaymentProvider === 'paypal'
                          ? 'If you know your PayPal merchant ID and need to manually link it, you can enter it below. This is only needed if the automatic linking fails.'
                          : 'If you know your Stripe account ID and need to manually link it, you can enter it below. This is only needed if the automatic linking fails.'
                        }
                      </Text>
                      
                      <form onSubmit={handleManualAccountUpdate}>
                        <FormControl mb={4}>
                          <FormLabel>
                            {activePaymentProvider === 'paypal' ? 'PayPal Merchant ID' : 'Stripe Account ID'}
                          </FormLabel>
                          <Input 
                            placeholder={activePaymentProvider === 'paypal' ? 'merchant_id...' : 'acct_...'}
                            value={accountIdInput}
                            onChange={(e) => setAccountIdInput(e.target.value)}
                          />
                        </FormControl>
                        
                        <Button 
                          type="submit"
                          colorScheme="blue"
                          isLoading={isUpdating}
                          loadingText="Updating..."
                        >
                          Update {activePaymentProvider === 'paypal' ? 'Merchant ID' : 'Account ID'}
                        </Button>
                      </form>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>
        </Stack>
      </Box>
    </SettingsLayout>
  );
} 