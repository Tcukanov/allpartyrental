"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  VStack, 
  Heading, 
  Text, 
  FormControl, 
  FormLabel, 
  Input, 
  Flex, 
  Divider, 
  Card, 
  CardBody, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription,
  useToast
} from '@chakra-ui/react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';

const PaymentComponent = ({ transaction, offer, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const toast = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [cardError, setCardError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Custom styling for the CardElement
  const cardStyle = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };
  
  // Initialize payment intent when component mounts
  useEffect(() => {
    const initializePayment = async () => {
      try {
        const response = await fetch(`/api/transactions/${transaction.id}/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentMethodId: null }), // We'll attach the payment method after collecting card details
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error.message || 'Failed to initialize payment');
        }
        
        setClientSecret(data.data.clientSecret);
      } catch (error) {
        console.error('Payment initialization error:', error);
        setCardError('Failed to initialize payment. Please try again.');
      }
    };
    
    initializePayment();
  }, [transaction.id]);
  
  // Handle form submission for payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }
    
    setIsProcessing(true);
    setCardError('');
    
    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);
      
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: e.target.name.value,
            email: e.target.email.value,
          },
        },
      });
      
      if (error) {
        setCardError(error.message);
      } else if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
        setPaymentSuccess(true);
        
        toast({
          title: "Payment successful",
          description: "Your payment has been processed and is being held in escrow.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Notify parent component of successful payment
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
        
        // Redirect to party details page
        setTimeout(() => {
          router.push(`/client/my-party`);
        }, 2000);
      } else {
        setCardError(`Payment failed. Status: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setCardError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Heading size="md">Payment for {offer.service.name}</Heading>
          
          <Box>
            <Text fontWeight="bold">Service Provider:</Text>
            <Text>{offer.provider.name}</Text>
          </Box>
          
          <Box>
            <Text fontWeight="bold">Description:</Text>
            <Text>{offer.description}</Text>
          </Box>
          
          <Flex justify="space-between">
            <Box>
              <Text fontWeight="bold">Amount:</Text>
              <Text fontSize="xl" fontWeight="bold" color="brand.600">
                ${Number(transaction.amount).toFixed(2)}
              </Text>
            </Box>
            <Box>
              <Text fontWeight="bold">Status:</Text>
              <Text>{transaction.status}</Text>
            </Box>
          </Flex>
          
          <Divider />
          
          {paymentSuccess ? (
            <Alert status="success" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="md" p={6}>
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={2} fontSize="lg">Payment Successful!</AlertTitle>
              <AlertDescription>
                Your payment has been processed and is being held in escrow until the service is completed.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Name on Card</FormLabel>
                  <Input name="name" placeholder="John Doe" />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input name="email" type="email" placeholder="your@email.com" />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Card Information</FormLabel>
                  <Box borderWidth="1px" borderRadius="md" p={3}>
                    <CardElement options={cardStyle} />
                  </Box>
                </FormControl>
                
                {cardError && (
                  <Alert status="error">
                    <AlertIcon />
                    {cardError}
                  </Alert>
                )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PaymentComponent;

                
                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  isLoading={isProcessing}
                  loadingText="Processing"
                  isDisabled={!clientSecret || isProcessing}
                >
                  Pay ${Number(transaction.amount).toFixed(2)}
                </Button>
                
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Your payment will be held in escrow until you confirm the service has been completed.
                </Text>
              </VStack>
            </form>
          )}