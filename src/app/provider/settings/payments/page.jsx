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
  AccordionIcon
} from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import SettingsLayout from '@/components/provider/SettingsLayout';
import StripeConnectButton from '@/components/provider/StripeConnectButton';

export default function PaymentsSettingsPage() {
  const searchParams = useSearchParams();
  const [stripeStatus, setStripeStatus] = useState({
    loading: true,
    isConnected: false,
    details: null,
    error: null
  });
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentAlert, setPaymentAlert] = useState(null);
  const [accountIdInput, setAccountIdInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Check for success or error in the URL query params
  useEffect(() => {
    // Check for success or error parameters in the URL
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const platformError = searchParams.get('platform_error');

    if (success) {
      toast.success('Your Stripe account has been connected successfully!');
      // Check and save the Stripe account ID
      checkStripeAccount();
    } else if (error) {
      toast.error(`Error connecting to Stripe: ${error}`);
    } else if (platformError) {
      setPaymentAlert({
        status: 'error',
        title: 'Platform Setup Required',
        message: 'The Stripe Connect platform requires additional setup. The Stripe platform profile needs to be completed first.',
        details: 'Admin instructions: Log in to the Stripe dashboard, go to Settings > Connect Settings > Platform Profile, and complete the required information about managing losses for connected accounts.'
      });
    }

    // Clean up URL by removing query parameters
    if (success || error || platformError) {
      const url = new URL(window.location);
      url.search = '';
      window.history.replaceState({}, '', url);
    }
  }, [toast]);

  // Check if provider is connected to Stripe
  useEffect(() => {
    checkStripeStatus();
  }, []);

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

  // Handle refresh of Stripe status
  const handleRefreshStatus = () => {
    checkStripeStatus();
  };

  // Update the dashboard link function
  const handleViewDashboard = () => {
    if (!stripeStatus?.isConnected) return;
    
    window.open(
      `https://dashboard.stripe.com/express/${stripeStatus.details.accountId}`,
      '_blank'
    );
  };

  // Handle manual account ID update
  const handleManualAccountUpdate = async (e) => {
    e.preventDefault();
    
    if (!accountIdInput.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter a Stripe account ID',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/provider/stripe/update-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: accountIdInput.trim() }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Account Updated',
          description: `Successfully linked to Stripe account: ${data.accountId}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setAccountIdInput('');
        checkStripeStatus(); // Refresh the status
      } else {
        toast({
          title: 'Update Failed',
          description: data.error || 'Failed to update Stripe account',
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

  return (
    <SettingsLayout>
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
        <Heading size="lg" mb={4}>Payment Settings</Heading>
        <Divider mb={6} />
        
        <Stack spacing={6}>
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Stripe Connect Status</Heading>
              
              {isLoading ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" />
                  <Text mt={2}>Checking your Stripe connection...</Text>
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
                      If you've already set up your Stripe account but it's not showing here, try refreshing the status:
                    </Text>
                    <Button
                      onClick={handleRefreshStatus}
                      colorScheme="blue"
                      size="md"
                      isLoading={isLoading}
                    >
                      Force Refresh Status
                    </Button>
                  </Box>
                </>
              ) : stripeStatus.isConnected ? (
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
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Payout Settings</Heading>
              <Text>
                Manage your payout schedule and bank account information directly in your 
                Stripe Dashboard.
              </Text>
              {stripeStatus.isConnected && (
                <Button 
                  mt={4} 
                  colorScheme="blue"
                  onClick={handleViewDashboard}
                >
                  Go to Stripe Dashboard
                </Button>
              )}
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
                        If you know your Stripe account ID and need to manually link it, 
                        you can enter it below. This is only needed if the automatic linking fails.
                      </Text>
                      
                      <form onSubmit={handleManualAccountUpdate}>
                        <FormControl mb={4}>
                          <FormLabel>Stripe Account ID</FormLabel>
                          <Input 
                            placeholder="acct_..."
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
                          Update Account ID
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