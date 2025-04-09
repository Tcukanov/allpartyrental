'use client';

import { useCallback } from 'react';
import SettingsLayout from '@/components/provider/SettingsLayout';
import { Box, Heading, Text, Divider, Stack } from '@chakra-ui/react';
import StripeConnectButton from '@/components/provider/StripeConnectButton';

export default function ProviderSettingsPage() {
  const handleStripeSuccess = useCallback(() => {
    console.log('Stripe onboarding initiated');
  }, []);

  return (
    <SettingsLayout>
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
        <Heading size="lg" mb={4}>Provider Settings</Heading>
        <Divider mb={6} />
        
        <Stack spacing={6}>
          <Box>
            <Heading size="md" mb={2}>Payment Settings</Heading>
            <Text mb={4}>Connect your Stripe account to receive payments for your services.</Text>
            <StripeConnectButton onSuccess={handleStripeSuccess} />
          </Box>
        </Stack>
      </Box>
    </SettingsLayout>
  );
} 