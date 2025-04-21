"use client";

import React, { useState, useEffect } from 'react';
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
  const [needsSoftPlayTerms, setNeedsSoftPlayTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsDetails, setShowTermsDetails] = useState(false);
  const [redirectingToTerms, setRedirectingToTerms] = useState(false);
  const [createdTransactionId, setCreatedTransactionId] = useState(null);
  const [readTerms, setReadTerms] = useState(false);

  // Calculate total amount (including platform fee)
  const servicePrice = offer?.price || service?.price || 0;
  // Fixed price regardless of duration
  const baseAmount = Number(servicePrice);
  const serviceFeePercent = 5.0; // 5% platform fee for clients
  const serviceFee = baseAmount * (serviceFeePercent / 100);
  const totalAmount = baseAmount + Number(serviceFee);

  // Check if the service is a soft play service
  useEffect(() => {
    console.log("Service category:", service?.category?.name);
    console.log("Offer service category:", offer?.service?.category?.name);
    
    // Force for testing - remove in production
    setNeedsSoftPlayTerms(true);
    
    if (service?.category?.name?.toLowerCase() === 'soft play' || 
        offer?.service?.category?.name?.toLowerCase() === 'soft play') {
      setNeedsSoftPlayTerms(true);
    }
  }, [service, offer]);

  // Check for URL parameters when returning from terms page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const termsAccepted = urlParams.get('termsAccepted');
    const transactionId = urlParams.get('transactionId');
    
    if (termsAccepted === 'true' && transactionId) {
      console.log("Terms accepted for transaction:", transactionId);
      setTermsAccepted(true);
      setReadTerms(true);
      setCreatedTransactionId(transactionId);
    }
  }, []);

  // Modify the handleViewTerms function to just toggle showing the terms details
  const handleViewTerms = () => {
    setShowTermsDetails(!showTermsDetails);
    if (!readTerms) {
      setReadTerms(true);
    }
  };

  // Add a function to handle direct terms acceptance
  const handleAcceptTerms = (e) => {
    setTermsAccepted(e.target.checked);
  };
  
  // Function to continue payment processing after terms acceptance
  const continuePaymentAfterTerms = async (transactionId) => {
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
      // Fetch the transaction
      const response = await fetch(`/api/transactions/${transactionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transaction");
      }
      
      const data = await response.json();
      if (!data.success || !data.data.transaction) {
        throw new Error("Invalid transaction data");
      }
      
      const transaction = data.data.transaction;
      setTransaction(transaction);
      
      // Process payment
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
    
    // Check if terms need to be accepted for soft play
    if (needsSoftPlayTerms && !termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please read and accept the Soft Play Service Agreement before proceeding with payment.",
        status: "warning",
        duration: 5000,
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
      let createdTransaction = null;
      
      // Only proceed with transaction creation if we haven't already created one from terms flow
      if (!createdTransactionId) {
        // Use the existing transaction creation code here...
        const transactionResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            offerId: offer?.id,
            serviceId: !offer ? service.id : null,
            amount: baseAmount,
            providerId: offer?.providerId || service?.providerId,
            bookingDate: bookingDetails?.isoDateTime,
            duration: bookingDetails?.duration,
            comments: bookingDetails?.comments,
            isFixedPrice: true,
            termsAccepted: termsAccepted,
            termsType: needsSoftPlayTerms ? 'soft-play' : null,
            termsAcceptedAt: termsAccepted ? new Date().toISOString() : null
          }),
        });
        
        // Process the transaction response...
        if (!transactionResponse.ok) {
          const errorData = await transactionResponse.json();
          throw new Error(errorData.error?.message || `Transaction failed with status ${transactionResponse.status}`);
        }
        
        const responseData = await transactionResponse.json();
        if (!responseData.success || !responseData.data?.transaction) {
          throw new Error(responseData.error?.message || 'Failed to create transaction');
        }
        
        createdTransaction = responseData.data.transaction;
        transactionCreated = true;
        setTransaction(createdTransaction);
        setCreatedTransactionId(createdTransaction.id);
      } else if (createdTransactionId && termsAccepted) {
        // If we already have a transaction ID and terms were accepted, update the transaction
        try {
          await fetch(`/api/transactions/${createdTransactionId}/terms-accepted`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              termsAccepted: true,
              termsType: 'soft-play'
            }),
          });
        } catch (error) {
          console.error('Error updating terms acceptance:', error);
          // Continue anyway as this is not critical
        }
      }
      
      // Process payment using the transaction
      const transactionToUse = transaction || createdTransaction || { id: createdTransactionId };
      
      if (!transactionToUse.id) {
        throw new Error("No transaction available for payment");
      }
      
      // Process payment using the transaction
      const paymentResponse = await fetch(`/api/transactions/${transactionToUse.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!paymentResponse.ok) {
        const paymentErrorData = await paymentResponse.json();
        throw new Error(paymentErrorData.error?.message || `Payment processing failed with status ${paymentResponse.status}`);
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
          onPaymentComplete(transactionToUse);
        }
      } else {
        throw new Error(`Unexpected payment status: ${paymentIntent.status}`);
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

  // The vendor's business name
  const vendorName = service?.provider?.businessName || offer?.provider?.businessName || "the Service Provider";

  // Fix the terms link to use a more reliable window.open() approach with correct features
  const handleViewFullTerms = (e) => {
    e.preventDefault(); // Prevent any default navigation
    
    const serviceId = service?.id || offer?.service?.id;
    const termsUrl = `/terms/soft-play?serviceId=${serviceId}`;
    
    // Open a new popup window with specific dimensions and features
    // Making it much wider (1000px instead of 800px)
    const popup = window.open(
      termsUrl, 
      'softPlayTerms', // Named window so it can be referenced
      'width=1200,height=800,resizable=yes,scrollbars=yes,status=no,location=no,menubar=no,toolbar=no'
    );
    
    // Focus the new window
    if (popup) {
      popup.focus();
    } else {
      // If popup blocked, alert the user
      toast({
        title: "Popup Blocked",
        description: "Please allow popups to view the complete terms and conditions.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
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
          
          {/* Soft Play Terms Agreement - shown before payment info */}
          {needsSoftPlayTerms && (
            <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50">
              <VStack align="stretch" spacing={4}>
                <Heading as="h3" size="sm">Soft Play Service Agreement</Heading>
                
                <Text>
                  Before proceeding with payment, you must accept the Soft Play Service Agreement 
                  between you and {vendorName}.
                </Text>
                
                <Button 
                  colorScheme="blue" 
                  variant="outline" 
                  onClick={handleViewTerms}
                  leftIcon={<Box as="span" fontSize="lg">📄</Box>}
                  size="sm"
                >
                  {showTermsDetails ? "Hide Terms Details" : "View Terms Details"}
                </Button>
                
                {showTermsDetails && (
                  <Box p={4} bg="white" borderRadius="md" w="100%">
                    <VStack align="stretch" spacing={5}>
                      <Heading as="h4" size="sm">Soft Play Equipment Service Agreement</Heading>
                      
                      <Box>
                        <Heading as="h5" size="xs" mb={2}>
                          1. Services and Equipment
                        </Heading>
                        <Text fontSize="sm">
                          {vendorName} agrees to provide soft play equipment rental services to the Client as detailed in the service description and booking details. The equipment will be delivered, set up, and collected by {vendorName} unless otherwise specified.
                        </Text>
                      </Box>

                      <Box>
                        <Heading as="h5" size="xs" mb={2}>
                          2. Safety and Supervision
                        </Heading>
                        <Text fontSize="sm" mb={2}>
                          The Client acknowledges that:
                        </Text>
                        <Text fontSize="sm" ml={4} mb={1}>• Children must be supervised by a responsible adult at all times while using the soft play equipment</Text>
                        <Text fontSize="sm" ml={4} mb={1}>• The Client is responsible for ensuring the safety of all users</Text>
                        <Text fontSize="sm" ml={4} mb={1}>• Food, drinks, shoes, and sharp objects are not permitted on the soft play equipment</Text>
                        <Text fontSize="sm" ml={4} mb={1}>• The equipment should not be used by adults unless specifically designed for adult use</Text>
                      </Box>

                      <Box>
                        <Heading as="h5" size="xs" mb={2}>
                          3. Equipment Care and Damage
                        </Heading>
                        <Text fontSize="sm">
                          The Client agrees to take reasonable care of the equipment and ensure it is not misused. Any damage beyond normal wear and tear may result in additional charges. The Client must inform {vendorName} immediately of any damage that occurs during the rental period.
                        </Text>
                      </Box>

                      <Box>
                        <Heading as="h5" size="xs" mb={2}>
                          4. Space and Setup Requirements
                        </Heading>
                        <Text fontSize="sm">
                          The Client is responsible for ensuring adequate space is available for the equipment as specified in the service details. The area must be clean, dry, and free from obstacles. Indoor setups require sufficient ceiling height and access to power outlets where applicable.
                        </Text>
                      </Box>

                      <Box>
                        <Heading as="h5" size="xs" mb={2}>
                          5. Liability and Insurance
                        </Heading>
                        <Text fontSize="sm">
                          {vendorName} maintains appropriate public liability insurance for the equipment provided. However, the Client assumes responsibility for injuries or accidents that occur due to improper supervision or misuse of the equipment. The Client acknowledges that soft play activities carry inherent risks.
                        </Text>
                      </Box>

                      <Box>
                        <Heading as="h5" size="xs" mb={2}>
                          6. Cancellation and Rescheduling
                        </Heading>
                        <Text fontSize="sm">
                          Cancellation policies are as specified in the service details. Generally, cancellations within 48 hours of the event may incur a charge. Rescheduling is subject to availability and may incur additional fees if requested within 48 hours of the event.
                        </Text>
                      </Box>

                      <Box>
                        <Heading as="h5" size="xs" mb={2}>
                          7. Weather Conditions (for Outdoor Setups)
                        </Heading>
                        <Text fontSize="sm">
                          For outdoor setups, {vendorName} reserves the right to cancel or postpone the service in case of adverse weather conditions that may compromise safety or damage the equipment. Alternative arrangements will be discussed with the Client.
                        </Text>
                      </Box>

                      <Box>
                        <Heading as="h5" size="xs" mb={2}>
                          8. Payment Terms
                        </Heading>
                        <Text fontSize="sm">
                          Payment terms are as specified in the booking process. A deposit may be required to secure the booking, with the remaining balance due before or on the day of the event as agreed. All payments are processed securely through the AllPartyRent platform.
                        </Text>
                      </Box>
                      
                      <Text fontSize="sm" color="blue.600" fontWeight="bold">
                        By checking the box below, you agree to these terms and conditions.
                      </Text>
                    </VStack>
                  </Box>
                )}
                
                <Checkbox 
                  isChecked={termsAccepted}
                  onChange={handleAcceptTerms}
                  colorScheme="blue"
                  size="lg"
                >
                  <Text fontWeight="medium">
                    I accept the Soft Play Service Agreement with {vendorName}
                  </Text>
                </Checkbox>
              </VStack>
            </Box>
          )}
          
          {/* Payment Information - only shown if terms accepted or not required */}
          {(!needsSoftPlayTerms || termsAccepted) && (
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
          )}
          
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
                isDisabled={isProcessing || redirectingToTerms}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="blue"
                onClick={handleSubmit}
                isDisabled={
                  !stripe || 
                  isProcessing || 
                  redirectingToTerms || 
                  (needsSoftPlayTerms && !termsAccepted)
                }
                isLoading={isProcessing || redirectingToTerms}
                loadingText={redirectingToTerms ? "Redirecting..." : "Processing"}
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