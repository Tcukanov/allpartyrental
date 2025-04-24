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
  Checkbox,
  Link,
} from '@chakra-ui/react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/utils/formatters';
import NextLink from 'next/link';

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

export default function ServiceRequestPayment({ service, offer, onPaymentComplete, onCancel, bookingDetails }) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [reviewDeadline, setReviewDeadline] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Calculate total amount (including platform fee)
  const servicePrice = offer?.price || service?.price || 0;
  // Fixed price regardless of duration
  const baseAmount = Number(servicePrice);
  
  // Calculate addon prices if present
  const selectedAddons = bookingDetails?.addons || [];
  const addonsTotal = selectedAddons.reduce((total, addon) => 
    total + Number(addon.price), 0
  );
  
  const serviceFeePercent = 5.0; // 5% platform fee for clients
  const subtotal = baseAmount + addonsTotal;
  const serviceFee = subtotal * (serviceFeePercent / 100);
  const totalAmount = subtotal + Number(serviceFee);

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
    
    if (!termsAccepted) {
      toast({
        title: "Terms and Conditions",
        description: "You must accept the Terms and Conditions to proceed.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // First, validate that we have either an offer or a service
      if (!offer && !service) {
        throw new Error('No service or offer provided');
      }

      // Validate required fields for service
      if (!offer && service) {
        if (!service.providerId) {
          console.error("Service missing providerId:", service);
          throw new Error('Service is missing provider information. Please try again later.');
        }
      }

      // Create transaction
      console.log("Creating transaction with:", {
        serviceId: !offer ? service.id : null,
        offerId: offer?.id,
        amount: baseAmount,
        providerId: offer?.providerId || service?.providerId,
        bookingDate: bookingDetails?.isoDateTime || undefined,
        duration: bookingDetails?.duration || undefined
      });
      
      // Flag to track if we already attempted to create a transaction
      let transactionCreated = false;
      
      if (!offer && service) {
        console.log("Direct Service Transaction Mode - Service details:", {
          id: service.id,
          name: service.name, 
          providerId: service.providerId,
          price: service.price,
          bookingDetails: bookingDetails
        });
        
        // Try the alternative test endpoint for direct service transactions
        try {
          console.log("Attempting to use debug transaction creation endpoint...");
          const debugResponse = await fetch('/api/debug/create-transaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId: service.id,
              bookingDate: bookingDetails?.isoDateTime,
              duration: bookingDetails?.duration,
              comments: bookingDetails?.comments
            }),
          });
          
          const debugData = await debugResponse.json();
          console.log("Debug transaction response:", debugData);
          
          if (debugData.success) {
            console.log("Debug transaction created successfully!");
            transactionCreated = true;
            
            // Use the transaction from the debug response
            setTransaction(debugData.data.transaction);
            
            // Continue with payment processing using the new transaction
            const paymentResponse = await fetch(`/api/transactions/${debugData.data.transaction.id}/pay`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (!paymentResponse.ok) {
              const paymentErrorData = await paymentResponse.json();
              console.error('Payment error details:', paymentErrorData);
              throw new Error(
                paymentErrorData.error?.message || 
                paymentErrorData.error?.details || 
                `Payment processing failed with status ${paymentResponse.status}`
              );
            }

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
            } else {
              throw new Error(`Unexpected payment status: ${paymentIntent.status}`);
            }
            
            return; // Exit early since we're using the debug flow
          }
        } catch (debugError) {
          console.error("Debug transaction creation failed:", debugError);
          // Mark that we tried the debug flow, but continue with regular flow only if we didn't create a transaction
          if (transactionCreated) {
            throw debugError; // If transaction was created but payment failed, don't try again with regular flow
          }
          // Continue with regular flow if no transaction was created
        }
      }
      
      // Only proceed with regular transaction creation if debug method didn't create a transaction
      if (!transactionCreated) {
        const transactionResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            offerId: offer?.id,
            serviceId: !offer ? service.id : null,
            amount: totalAmount, // Use total amount including add-ons
            providerId: offer?.providerId || service?.providerId,
            bookingDate: bookingDetails?.isoDateTime,
            duration: bookingDetails?.duration,
            comments: bookingDetails?.comments,
            isFixedPrice: true,
            addons: bookingDetails?.addons || [] // Include selected add-ons
          }),
        });
      
        let errorData;
      
        // Handle authentication errors
        if (transactionResponse.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please sign in to continue with your payment",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          
          // Redirect to login
          window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`;
          return;
        }
        
        // Try to get detailed error information
        try {
          errorData = await transactionResponse.json();
          console.log("Transaction response data:", errorData);
        } catch (e) {
          console.error("Failed to parse transaction response:", e, "Status:", transactionResponse.status);
          // Try to get the raw response text for debugging
          try {
            const responseText = await transactionResponse.text();
            console.error("Raw response text:", responseText);
          } catch (textError) {
            console.error("Could not get response text:", textError);
          }
          errorData = { 
            success: false, 
            error: { message: `Could not parse server response. Status: ${transactionResponse.status}` } 
          };
        }
        
        // If the response was not successful
        if (!transactionResponse.ok) {
          console.error('Transaction error details:', errorData);
          const errorMessage = 
            errorData.error?.message || 
            errorData.error?.details || 
            `Transaction failed with status ${transactionResponse.status}`;
            
          // Display more user-friendly error based on status code  
          if (transactionResponse.status === 409) {
            throw new Error('A transaction for this service already exists. Please check your transactions page.');
          } else if (transactionResponse.status === 404) {
            throw new Error('Unable to find the necessary information to complete this transaction. Please try again.');
          } else {
            throw new Error(errorMessage);
          }
        }
        
        // If the response doesn't indicate success
        if (!errorData.success || !errorData.data?.transaction) {
          console.error('Transaction unsuccessful:', errorData);
          if (errorData.error?.details) {
            console.error('Detailed error:', errorData.error.details);
          }
          throw new Error(errorData.error?.message || 'Failed to create transaction');
        }
        
        const transaction = errorData.data.transaction;
        console.log('Transaction created successfully:', {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount
        });
        setTransaction(transaction);
        
        // Process payment
        try {
          const paymentResponse = await fetch(`/api/transactions/${transaction.id}/pay`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!paymentResponse.ok) {
            const paymentErrorData = await paymentResponse.json();
            console.error('Payment error details:', paymentErrorData);
            throw new Error(
              paymentErrorData.error?.message || 
              paymentErrorData.error?.details || 
              `Payment processing failed with status ${paymentResponse.status}`
            );
          }

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
            
            // Update terms acceptance after successful payment
            if (transaction && transaction.id) {
              await updateTermsAcceptance(transaction.id);
            }
            
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
          } else {
            throw new Error(`Unexpected payment status: ${paymentIntent.status}`);
          }
        } catch (paymentError) {
          console.error('Payment processing error:', paymentError);
          // Try to cancel the transaction since payment failed
          try {
            await fetch(`/api/transactions/${transaction.id}/cancel`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });
          } catch (cancelError) {
            console.error('Failed to cancel transaction after payment error:', cancelError);
          }
          throw paymentError;
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setCardError(error.message);
      
      // Determine the most user-friendly error message to display
      let displayMessage = error.message;
      
      // Check for specific error messages to display better information
      if (displayMessage.includes('Failed to create offer')) {
        displayMessage = "We're having trouble processing your request right now. Please try again in a few minutes or contact customer support.";
      } else if (displayMessage.includes('foreign key constraint')) {
        displayMessage = "There was an issue with your request. Please refresh the page and try again.";
      }
      
      toast({
        title: "Payment failed",
        description: displayMessage,
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

  const BookingSummary = ({ bookingInfo }) => (
    <VStack align="stretch" spacing={3} w="100%" bg="gray.50" p={4} borderRadius="md">
      <Heading size="md">Booking Summary</Heading>
      <Box>
        <Text fontWeight="bold">Date:</Text>
        <Text>{bookingInfo.formattedDate}</Text>
      </Box>
      <Box>
        <Text fontWeight="bold">Time:</Text>
        <Text>{bookingInfo.time}</Text>
      </Box>
      <Box>
        <Text fontWeight="bold">Duration:</Text>
        <Text>{bookingInfo.duration} hours</Text>
      </Box>
      {bookingInfo.address && (
        <Box>
          <Text fontWeight="bold">Address:</Text>
          <Text>{bookingInfo.address}</Text>
        </Box>
      )}
      {bookingInfo.comments && (
        <Box>
          <Text fontWeight="bold">Comments:</Text>
          <Text>{bookingInfo.comments}</Text>
        </Box>
      )}
    </VStack>
  );

  // After a successful transaction creation, update with terms acceptance
  const updateTermsAcceptance = async (transactionId) => {
    try {
      console.log('Updating terms acceptance for transaction:', transactionId);
      // Update the transaction with terms acceptance status
      const termsResponse = await fetch(`/api/transactions/${transactionId}/terms-accepted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          termsAccepted: true,
          termsType: 'service-booking'
        }),
      });
      
      if (!termsResponse.ok) {
        throw new Error(`Failed to update terms acceptance: ${termsResponse.status}`);
      }
      
      const termsData = await termsResponse.json();
      console.log('Terms acceptance updated:', termsData);
    } catch (termsError) {
      console.error('Error updating terms acceptance:', termsError);
      // Continue with payment even if terms update fails
    }
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
          
          {/* Order summary */}
          <Box mb={6} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
            <Heading as="h3" size="sm" mb={3}>Order Summary</Heading>
            
            {bookingDetails && (
              <BookingSummary bookingInfo={bookingDetails} />
            )}
            
            <HStack justify="space-between" mb={1}>
              <Text>Service Price (fixed):</Text>
              <Text>{formatCurrency(servicePrice)}</Text>
            </HStack>
            
            {/* Add-ons section */}
            {selectedAddons && selectedAddons.length > 0 && (
              <Box my={2}>
                <Text fontWeight="medium">Add-ons:</Text>
                {selectedAddons.map((addon) => (
                  <HStack key={addon.id} justify="space-between" mb={1} pl={4}>
                    <Text fontSize="sm">{addon.title}</Text>
                    <Text fontSize="sm">{formatCurrency(addon.price)}</Text>
                  </HStack>
                ))}
                <HStack justify="space-between" mb={1}>
                  <Text>Add-ons Subtotal:</Text>
                  <Text>{formatCurrency(addonsTotal)}</Text>
                </HStack>
              </Box>
            )}
            
            {bookingDetails?.duration > 0 && (
              <HStack justify="space-between" mb={1}>
                <Text>Duration:</Text>
                <Text>{bookingDetails.duration} hour{bookingDetails.duration !== 1 ? 's' : ''}</Text>
              </HStack>
            )}
            
            <HStack justify="space-between" mb={1}>
              <Text>Service Fee ({serviceFeePercent}%):</Text>
              <Text>{formatCurrency(serviceFee)}</Text>
            </HStack>
            
            <Divider my={2} />
            
            <HStack justify="space-between" fontWeight="bold">
              <Text>Total:</Text>
              <Text>{formatCurrency(totalAmount)}</Text>
            </HStack>
          </Box>
          
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
          
          {/* Terms and Conditions Acceptance */}
          <Box mt={2}>
            <FormControl isRequired>
              <Checkbox 
                isChecked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                colorScheme="blue"
              >
                I accept the <NextLink href="/terms" passHref legacyBehavior><Link color="blue.500">Terms of Service</Link></NextLink> and <NextLink href="/terms/soft-play" passHref legacyBehavior><Link color="blue.500">Soft Play Service Agreement</Link></NextLink>
              </Checkbox>
            </FormControl>
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