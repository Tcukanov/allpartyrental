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
  Spinner,
  Button,
  useToast
} from '@chakra-ui/react';
import SettingsLayout from '@/components/provider/SettingsLayout';
import StripeConnectButton from '@/components/provider/StripeConnectButton';

export default function PaymentsSettingsPage() {
  const [stripeStatus, setStripeStatus] = useState({
    loading: true,
    isConnected: false,
    details: null,
    error: null
  });
  const toast = useToast();

  // Check if provider is connected to Stripe
  useEffect(() => {
    const checkStripeStatus = async () => {
      try {
        const response = await fetch('/api/provider/stripe/status');
        
        if (!response.ok) {
          throw new Error('Failed to fetch Stripe status');
        }
        
        const data = await response.json();
        
        setStripeStatus({
          loading: false,
          isConnected: data.isConnected,
          details: data.details,
          error: null
        });
      } catch (error) {
        console.error('Error checking Stripe status:', error);
        setStripeStatus({
          loading: false,
          isConnected: false,
          details: null,
          error: error.message
        });
      }
    };
    
    checkStripeStatus();
  }, []);

  // Handle refresh of Stripe status
  const handleRefreshStatus = () => {
    setStripeStatus(prev => ({ ...prev, loading: true }));
    // Re-run the useEffect
    const checkStripeStatus = async () => {
      try {
        const response = await fetch('/api/provider/stripe/status');
        
        if (!response.ok) {
          throw new Error('Failed to fetch Stripe status');
        }
        
        const data = await response.json();
        
        setStripeStatus({
          loading: false,
          isConnected: data.isConnected,
          details: data.details,
          error: null
        });

        toast({
          title: 'Status updated',
          description: 'Your Stripe connection status has been refreshed',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error checking Stripe status:', error);
        setStripeStatus({
          loading: false,
          isConnected: false,
          details: null,
          error: error.message
        });
      }
    };
    
    checkStripeStatus();
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
              
              {stripeStatus.loading ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" />
                  <Text mt={2}>Checking your Stripe connection...</Text>
                </Box>
              ) : stripeStatus.error ? (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  {stripeStatus.error}
                </Alert>
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
                  <Button 
                    onClick={handleRefreshStatus} 
                    size="sm" 
                    mt={4} 
                    colorScheme="blue" 
                    variant="outline"
                  >
                    Refresh Status
                  </Button>
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
                  onClick={() => window.open('https://dashboard.stripe.com/settings', '_blank')}
                >
                  Go to Stripe Dashboard
                </Button>
              )}
            </CardBody>
          </Card>
        </Stack>
      </Box>
    </SettingsLayout>
  );
} 