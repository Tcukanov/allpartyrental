import { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { FaPaypal } from 'react-icons/fa';

const PayPalConnectButton = ({ onSuccess, isReconnect = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const initiatePayPalConnect = async () => {
    setIsLoading(true);
    try {
      // Call the API to generate a partner referral URL
      const response = await fetch('/api/provider/paypal/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate PayPal Connect');
      }

      // Check if we're using mock mode (direct success without redirect)
      if (data.success && data.message && data.merchantId) {
        toast({
          title: 'Connection Successful',
          description: data.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Notify the parent component if needed
        if (onSuccess) {
          onSuccess(data);
        }
        
        return;
      }
      
      // If API returns a URL for PayPal onboarding
      if (data.success && data.links && data.links.partnerReferralUrl) {
        // Redirect to PayPal onboarding
        window.location.href = data.links.partnerReferralUrl;
        
        // Notify the parent component if needed
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        throw new Error(data.error || 'Invalid response from PayPal connect endpoint');
      }
    } catch (error) {
      console.error('PayPal Connect error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to PayPal. Please try again.',
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
      colorScheme="blue"
      size="lg"
      leftIcon={<FaPaypal />}
      onClick={initiatePayPalConnect}
      isLoading={isLoading}
      loadingText="Connecting..."
      width="100%"
    >
      {isReconnect ? "Update PayPal Account" : "Connect with PayPal"}
    </Button>
  );
};

export default PayPalConnectButton; 