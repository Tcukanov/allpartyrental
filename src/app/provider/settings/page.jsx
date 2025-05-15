'use client';

import { useCallback, useState, useEffect } from 'react';
import SettingsLayout from '@/components/provider/SettingsLayout';
import { Box, Heading, Text, Divider, Stack } from '@chakra-ui/react';
import StripeConnectButton from '@/components/provider/StripeConnectButton';
import PayPalConnectButton from '@/components/provider/PayPalConnectButton';

export default function ProviderSettingsPage() {
  const [activePaymentProvider, setActivePaymentProvider] = useState('paypal');

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

  const handlePaymentSuccess = useCallback(() => {
    console.log(`${activePaymentProvider === 'paypal' ? 'PayPal' : 'Stripe'} onboarding initiated`);
  }, [activePaymentProvider]);

  return (
    <SettingsLayout>
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
        <Heading size="lg" mb={4}>Provider Settings</Heading>
        <Divider mb={6} />
        
        <Stack spacing={6}>
          <Box>
            <Heading size="md" mb={2}>Payment Settings</Heading>
            <Text mb={4}>
              {activePaymentProvider === 'paypal' 
                ? 'Connect your PayPal account to receive payments for your services.'
                : 'Connect your Stripe account to receive payments for your services.'}
            </Text>
            
            {activePaymentProvider === 'paypal' ? (
              <PayPalConnectButton onSuccess={handlePaymentSuccess} />
            ) : (
              <StripeConnectButton onSuccess={handlePaymentSuccess} />
            )}
          </Box>
        </Stack>
      </Box>
    </SettingsLayout>
  );
} 