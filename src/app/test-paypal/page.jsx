'use client';

import { useEffect, useState } from 'react';
import { Box, Container, VStack, Text, Alert, AlertIcon } from '@chakra-ui/react';

export default function TestPayPalPage() {
  const [envVars, setEnvVars] = useState({});

  useEffect(() => {
    setEnvVars({
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      nodeEnv: process.env.NODE_ENV,
      // Check window globals
      paypalAvailable: typeof window !== 'undefined' ? !!window.paypal : 'N/A'
    });
  }, []);

  return (
    <Container maxW="md" py={8}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">PayPal Debug Page</Text>
        
        <Alert status={envVars.clientId ? 'success' : 'error'}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">PayPal Client ID</Text>
            <Text>{envVars.clientId ? 'Available' : 'Missing'}</Text>
            {envVars.clientId && (
              <Text fontSize="sm" color="gray.600">
                {envVars.clientId.substring(0, 20)}...
              </Text>
            )}
          </Box>
        </Alert>

        <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
          <Text fontWeight="bold" mb={2}>Environment Variables</Text>
          <Text>NODE_ENV: {envVars.nodeEnv}</Text>
          <Text>NEXT_PUBLIC_PAYPAL_CLIENT_ID: {envVars.clientId ? 'Set' : 'Not Set'}</Text>
          <Text>PayPal SDK Loaded: {String(envVars.paypalAvailable)}</Text>
        </Box>

        <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
          <Text fontWeight="bold" mb={2}>Script Test</Text>
          <button 
            onClick={() => {
              const script = document.createElement('script');
              script.src = `https://www.paypal.com/sdk/js?client-id=${envVars.clientId}&currency=USD`;
              script.onload = () => {
                console.log('PayPal script loaded successfully');
                setEnvVars(prev => ({ ...prev, paypalAvailable: true }));
              };
              script.onerror = (err) => {
                console.error('PayPal script failed to load:', err);
              };
              document.body.appendChild(script);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Load PayPal Script
          </button>
        </Box>
      </VStack>
    </Container>
  );
} 