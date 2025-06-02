'use client';

import { useCallback, useState, useEffect } from 'react';
import SettingsLayout from '@/components/provider/SettingsLayout';
import { Box, Heading, Text, Divider, Stack, Button, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { FiCreditCard } from 'react-icons/fi';

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

  return (
    <SettingsLayout>
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
        <Heading size="lg" mb={4}>Provider Settings</Heading>
        <Divider mb={6} />
        
        <Stack spacing={6}>
          <Box>
            <Heading size="md" mb={2}>Payment Settings</Heading>
            <Text mb={4}>
              Manage your PayPal account settings to receive payments for your services.
            </Text>
            
            <Link as={NextLink} href="/provider/dashboard/paypal">
              <Button 
                leftIcon={<FiCreditCard />} 
                colorScheme="blue" 
                size="md"
              >
                Manage PayPal Settings
              </Button>
            </Link>
          </Box>
        </Stack>
      </Box>
    </SettingsLayout>
  );
} 