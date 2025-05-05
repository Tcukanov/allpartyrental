'use client';

import { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { FaStripe } from 'react-icons/fa';

const StripeConnectButton = ({ onSuccess, isReconnect = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/provider/stripe/connect', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if this is a platform setup error with a custom URL
        if (data.platformSetupRequired && data.url) {
          window.location.href = data.url;
          return;
        }
        
        throw new Error(data.error || 'Failed to initiate Stripe Connect');
      }
      
      // Redirect to Stripe Connect onboarding
      if (data.url) {
        window.location.href = data.url;
        if (onSuccess) onSuccess();
      } else {
        throw new Error('No redirect URL returned from server');
      }
    } catch (error) {
      console.error('Stripe Connect error:', error);
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect to Stripe. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      leftIcon={<FaStripe />}
      colorScheme="purple"
      isLoading={isLoading}
      loadingText={isReconnect ? "Reconnecting..." : "Connecting..."}
      onClick={handleConnect}
      size="lg"
    >
      {isReconnect ? "Update Stripe Account" : "Connect with Stripe"}
    </Button>
  );
};

export default StripeConnectButton; 