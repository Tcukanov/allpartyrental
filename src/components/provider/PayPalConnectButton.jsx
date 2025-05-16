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
        console.error('PayPal connect error response:', data);
        throw new Error(data.error || 'Failed to initiate PayPal Connect');
      }

      // If successful, the API returns a URL to redirect the user to PayPal
      if (data.success && data.links && data.links.partnerReferralUrl) {
        console.log('Redirecting to PayPal onboarding URL:', data.links.partnerReferralUrl);
        // Redirect to PayPal onboarding
        window.location.href = data.links.partnerReferralUrl;
        
        // Notify the parent component if needed
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        console.error('Invalid PayPal connect response:', data);
        throw new Error(data.error || 'Invalid response from PayPal connect endpoint');
      }
    } catch (error) {
      console.error('PayPal Connect error:', error);
      
      // Show more detailed error information
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to PayPal. Please try again.',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
      
      // Show additional help toast
      toast({
        title: 'Try Manual Connection',
        description: 'If automatic connection fails, please try entering your PayPal sandbox credentials manually.',
        status: 'info',
        duration: 10000,
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