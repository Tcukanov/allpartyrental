'use client';

import { useCallback, useState, useEffect } from 'react';
import SettingsLayout from '@/components/provider/SettingsLayout';
import { Box, Heading, Text, Divider, Stack, Button, Link, FormControl, FormLabel, Switch, useToast } from '@chakra-ui/react';
import NextLink from 'next/link';
import { FiCreditCard } from 'react-icons/fi';

export default function ProviderSettingsPage() {
  const [activePaymentProvider, setActivePaymentProvider] = useState('paypal');
  const [enablePayLater, setEnablePayLater] = useState(true);
  const [isUpdatingPayLater, setIsUpdatingPayLater] = useState(false);
  const toast = useToast();

  // Fetch the active payment provider and Pay Later setting
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch active payment provider
        const paymentResponse = await fetch('/api/payment/active-provider');
        if (paymentResponse.ok) {
          const data = await paymentResponse.json();
          if (data.provider) {
            setActivePaymentProvider(data.provider);
          }
        }

        // Fetch Pay Later setting
        const payLaterResponse = await fetch('/api/provider/settings/paylater');
        if (payLaterResponse.ok) {
          const data = await payLaterResponse.json();
          if (data.success && data.data) {
            setEnablePayLater(data.data.enablePayLater);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  // Handle Pay Later toggle
  const handlePayLaterToggle = async (checked) => {
    setIsUpdatingPayLater(true);
    try {
      const response = await fetch('/api/provider/settings/paylater', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enablePayLater: checked }),
      });

      if (response.ok) {
        setEnablePayLater(checked);
        toast({
          title: 'Settings Updated',
          description: `Pay in 4 ${checked ? 'enabled' : 'disabled'} for your services`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating Pay Later setting:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update Pay Later setting. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingPayLater(false);
    }
  };

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
                mb={4}
              >
                Manage PayPal Settings
              </Button>
            </Link>

            <Divider my={4} />

            {/* Pay Later Toggle */}
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <Box flex="1" mr={4}>
                <FormLabel htmlFor="enable-paylater" mb={1} fontWeight="semibold">
                  Enable Pay in 4
                </FormLabel>
                <Text fontSize="sm" color="gray.600">
                  Allow customers to pay in 4 interest-free installments with PayPal. 
                  This increases conversion rates by offering flexible payment options.
                </Text>
              </Box>
              <Switch
                id="enable-paylater"
                size="lg"
                isChecked={enablePayLater}
                onChange={(e) => handlePayLaterToggle(e.target.checked)}
                isDisabled={isUpdatingPayLater}
                colorScheme="blue"
              />
            </FormControl>
          </Box>
        </Stack>
      </Box>
    </SettingsLayout>
  );
} 