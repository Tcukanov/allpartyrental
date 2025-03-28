"use client";

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Divider,
  Heading,
  Spinner,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/utils/formatters';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
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

export default function ServiceRequestPayment({ service, offer, onPaymentComplete, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [reviewDeadline, setReviewDeadline] = useState(null);

  // Calculate total amount (including platform fee)
  const serviceFeePercent = 5.0; // 5% platform fee for clients
  const serviceFee = (offer?.price || service?.price) * (serviceFeePercent / 100);
  const totalAmount = Number(offer?.price || service?.price) + Number(serviceFee);

  const handleCardChange = (event) => {
    setCardError(event.error?.message || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Stripe not loaded",
        description: "Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create transaction
      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: offer?.id,
          serviceId: !offer ? service.id : null,
          amount: Number(offer?.price || service?.price),
        }),
      });
      
      const transactionData = await transactionResponse.json();
      
      if (!transactionData.success) {
        throw new Error(transactionData.error?.message || 'Failed to create transaction');
      }
      
      const transaction = transactionData.data.transaction;
      setTransaction(transaction);
      
      // Process payment
      const paymentResponse = await fetch(`/api/transactions/${transaction.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const paymentData = await paymentResponse.json();
      
      if (!paymentData.success) {
        throw new Error(paymentData.error?.message || 'Failed to process payment');
      }
      
      // Set client secret and review deadline
      setClientSecret(paymentData.data.clientSecret);
      setReviewDeadline(new Date(paymentData.data.reviewDeadline));
      
      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(paymentData.data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (paymentIntent.status === 'requires_capture') {
        setIsComplete(true);
        toast({
          title: "Payment authorized!",
          description: "Your payment has been authorized and will be held in escrow. The provider now has 24 hours to review and approve your request.",
          status: "success",
          duration: 8000,
          isClosable: true,
        });
        
        if (onPaymentComplete) {
          onPaymentComplete(transaction);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setCardError(error.message);
      toast({
        title: "Payment failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format function for time display
  const formatTime = (date) => {
    if (!date) return '';
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  return (
    <Card borderRadius="lg" overflow="hidden" variant="outline">
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Heading size="md">Complete Your Payment</Heading>
          
          <Box>
            <Text fontWeight="bold">{service?.name || 'Service'}</Text>
            <Text color="gray.600">{offer?.description || service?.description}</Text>
          </Box>
          
          <Divider />
          
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text>Service Fee:</Text>
              <Text>{formatCurrency(offer?.price || service?.price)}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Platform Fee ({serviceFeePercent}%):</Text>
              <Text>{formatCurrency(serviceFee)}</Text>
            </HStack>
            <Divider my={2} />
            <HStack justify="space-between" fontWeight="bold">
              <Text>Total:</Text>
              <Text>{formatCurrency(totalAmount)}</Text>
            </HStack>
          </VStack>
          
          <Box>
            <Text mb={2} fontWeight="bold">Payment Information</Text>
            <Box 
              p={4} 
              borderWidth="1px" 
              borderRadius="md"
              _focus={{ borderColor: "blue.500" }}
            >
              <CardElement onChange={handleCardChange} />
            </Box>
            {cardError && (
              <Text color="red.500" fontSize="sm" mt={2}>
                {cardError}
              </Text>
            )}
          </Box>
          
          <Box>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Secure Escrow Payment</AlertTitle>
                <AlertDescription fontSize="sm">
                  Your payment will be authorized but not charged until the provider approves your request.
                  If they don't respond within 24 hours, the authorization will be automatically cancelled.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
          
          {isComplete ? (
            <VStack spacing={4} align="stretch">
              <Badge colorScheme="green" p={2} borderRadius="md" textAlign="center">
                Payment Authorized - Awaiting Provider Approval
              </Badge>
              {reviewDeadline && (
                <Text fontSize="sm" textAlign="center">
                  Provider must approve by: {formatTime(reviewDeadline)}
                </Text>
              )}
              <Button colorScheme="blue" onClick={onPaymentComplete}>
                Continue
              </Button>
            </VStack>
          ) : (
            <HStack spacing={4} justify="center">
              <Button 
                variant="outline" 
                onClick={onCancel}
                isDisabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="blue"
                onClick={handleSubmit}
                isDisabled={!stripe || isProcessing}
                isLoading={isProcessing}
                loadingText="Processing"
              >
                {isProcessing ? <Spinner size="sm" /> : `Pay ${formatCurrency(totalAmount)}`}
              </Button>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
} 