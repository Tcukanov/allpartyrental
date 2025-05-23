'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  FormControl,
  FormLabel,
  Icon,
  Divider,
  Badge,
  Flex
} from '@chakra-ui/react';
import { FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';

const PayPalCreditCardForm = ({ 
  amount, 
  onSuccess, 
  onError, 
  onCancel,
  bookingData,
  disabled = false
}) => {
  const cardNumberRef = useRef();
  const expiryRef = useRef();
  const cvvRef = useRef();
  const nameRef = useRef();
  const isRenderingRef = useRef(false);
  const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const hasInitializedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [cardFields, setCardFields] = useState(null);
  const [fieldsRendered, setFieldsRendered] = useState(false);
  const toast = useToast();

  // More aggressive cleanup function
  const clearPayPalFields = () => {
    console.log(`[${instanceIdRef.current}] Clearing PayPal fields...`);
    try {
      // Clear each container and check for existing content
      [cardNumberRef, expiryRef, cvvRef, nameRef].forEach((ref, index) => {
        const fieldNames = ['cardNumber', 'expiry', 'cvv', 'name'];
        if (ref.current) {
          console.log(`[${instanceIdRef.current}] Clearing ${fieldNames[index]} field, current children:`, ref.current.children.length);
          ref.current.innerHTML = '';
          // Force DOM cleanup
          while (ref.current.firstChild) {
            ref.current.removeChild(ref.current.firstChild);
          }
        }
      });
      
      setFieldsRendered(false);
      setCardFields(null);
      isRenderingRef.current = false;
      hasInitializedRef.current = false;
      console.log(`[${instanceIdRef.current}] All fields cleared`);
    } catch (error) {
      console.error(`[${instanceIdRef.current}] Error during cleanup:`, error);
    }
  };

  // Check if fields already exist in DOM
  const fieldsAlreadyExist = () => {
    const hasContent = [cardNumberRef, expiryRef, cvvRef, nameRef].some(ref => 
      ref.current && ref.current.children.length > 0
    );
    console.log(`[${instanceIdRef.current}] Fields already exist check:`, hasContent);
    return hasContent;
  };

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    console.log(`[${instanceIdRef.current}] PayPal Component - Client ID:`, clientId ? 'Available' : 'Missing');
    
    if (!clientId) {
      setError('PayPal configuration missing');
      setIsLoading(false);
      return;
    }

    // Global flag to prevent multiple initializations
    if (window.__PAYPAL_FORM_INITIALIZED__) {
      console.log(`[${instanceIdRef.current}] PayPal form already initialized globally, skipping...`);
      setIsLoading(false);
      return;
    }

    // Clear any existing fields first
    clearPayPalFields();
    setDebugInfo('Loading PayPal SDK...');
    
    // Check if PayPal script is already loaded
    console.log(`[${instanceIdRef.current}] PayPal Component - Checking if PayPal already loaded`);
    if (window.paypal) {
      console.log(`[${instanceIdRef.current}] PayPal Component - PayPal already available, initializing`);
      initializeCardFields();
    } else {
      console.log(`[${instanceIdRef.current}] PayPal Component - Loading PayPal script`);
      loadPayPalScript();
    }

    return () => {
      console.log(`[${instanceIdRef.current}] PayPal Component - Cleanup`);
      // Don't clear global flag on cleanup to prevent re-initialization
      clearPayPalFields();
    };
  }, []); // Only run once on mount

  // Handle amount changes without reinitializing PayPal
  useEffect(() => {
    if (amount && debugInfo) {
      setDebugInfo('Credit card form ready - click on fields to enter your card details');
    }
  }, [amount]);

  // Handle page visibility changes to prevent re-initialization on tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log(`[${instanceIdRef.current}] Page hidden - preventing re-initialization`);
      } else {
        console.log(`[${instanceIdRef.current}] Page visible - checking field state`);
        // Don't re-initialize if fields are already rendered
        if (fieldsRendered) {
          console.log(`[${instanceIdRef.current}] Fields already rendered, skipping re-initialization`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fieldsRendered]);

  const loadPayPalScript = () => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&components=buttons,card-fields&intent=capture`;
    script.async = true;
    
    script.onload = () => {
      console.log('PayPal script loaded, initializing...');
      setDebugInfo('PayPal SDK loaded, setting up form...');
      initializeCardFields();
    };
    
    script.onerror = () => {
      console.error('Failed to load PayPal script');
      setError('Failed to load PayPal payment system');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);
  };

  const initializeCardFields = () => {
    try {
      console.log(`[${instanceIdRef.current}] Starting initializeCardFields...`);
      
      // Prevent duplicate initialization with additional safeguards
      if (fieldsRendered || isRenderingRef.current || fieldsAlreadyExist() || hasInitializedRef.current) {
        console.log(`[${instanceIdRef.current}] Skipping initialization - fieldsRendered: ${fieldsRendered}, isRendering: ${isRenderingRef.current}, fieldsExist: ${fieldsAlreadyExist()}, hasInitialized: ${hasInitializedRef.current}`);
        return;
      }

      console.log(`[${instanceIdRef.current}] Proceeding with field initialization...`);
      hasInitializedRef.current = true;
      isRenderingRef.current = true;
      
      // Clear any existing fields first
      clearPayPalFields();
      
      setDebugInfo('Initializing credit card form...');
      setIsLoading(false);
      
      const cardFieldsInstance = window.paypal.CardFields({
        createOrder: async () => {
          console.log('PayPal Card Form - Creating order');
          setDebugInfo('Creating payment order...');
          
          try {
            console.log('PayPal Card Form - Making API call to /api/payments/create');
            
            const response = await fetch('/api/payments/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                serviceId: bookingData.serviceId,
                bookingDate: bookingData.bookingDate,
                hours: bookingData.duration,
                paymentMethod: 'card_fields'
              }),
            });

            console.log('PayPal Card Form - Create order response status:', response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('PayPal Card Form - Create order failed:', response.status, errorText);
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('PayPal Card Form - Create order response data:', data);
            
            if (!data.success) {
              console.error('PayPal Card Form - API returned error:', data.error);
              throw new Error(data.error || 'Failed to create payment order');
            }

            if (!data.orderId) {
              console.error('PayPal Card Form - No orderId in response:', data);
              throw new Error('No order ID received from payment service');
            }

            setDebugInfo('Payment order created, ready for payment');
            console.log('PayPal Card Form - Order created successfully:', data.orderId);
            return data.orderId;
            
          } catch (error) {
            console.error('PayPal Card Form - Error creating order:', error);
            setError('Failed to create payment order: ' + error.message);
            throw error;
          }
        },

        onApprove: async (data) => {
          try {
            console.log('PayPal Card Form - Payment approved, capturing:', data.orderID);
            setDebugInfo('Payment approved, processing...');
            
            console.log('PayPal Card Form - Making API call to /api/payments/capture');
            
            // Capture payment via our API
            const response = await fetch('/api/payments/capture', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: data.orderID
              }),
            });

            console.log('PayPal Card Form - Capture response status:', response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('PayPal Card Form - Capture failed:', response.status, errorText);
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('PayPal Card Form - Capture response data:', result);
            
            if (!result.success) {
              console.error('PayPal Card Form - Capture API returned error:', result.error);
              throw new Error(result.error || 'Payment capture failed');
            }

            setIsProcessing(false);
            setDebugInfo('Payment completed successfully!');
            console.log('PayPal Card Form - Payment completed successfully');
            onSuccess(result.data);
            
          } catch (error) {
            console.error('PayPal Card Form - Error capturing payment:', error);
            setIsProcessing(false);
            setError(error.message);
            onError(error.message);
          }
        },

        onError: (err) => {
          console.error('PayPal Card Form - PayPal error:', err);
          setIsProcessing(false);
          
          // Parse PayPal error for better user feedback
          let errorMessage = 'Payment failed';
          
          if (err.message && err.message.includes('Invalid card number')) {
            errorMessage = 'Invalid card number. Please check your card number and try again.';
          } else if (err.message && err.message.includes('UNPROCESSABLE_ENTITY')) {
            errorMessage = 'Please check all your card details are correct. Use a valid test card number like 4032035728288280.';
          } else if (err.message && err.message.includes('VALIDATION_ERROR')) {
            errorMessage = 'Please check your card details and try again.';
          } else if (err.message && err.message.includes('Window closed')) {
            errorMessage = 'Payment window closed. Please try again.';
          } else if (err.message && err.message.includes('422')) {
            errorMessage = 'Invalid payment details. Please use a valid test card: 4032035728288280, expiry: 12/2030, CVV: 123';
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          setError(errorMessage);
          onError(errorMessage);
        },

        style: {
          'input': {
            'font-size': '16px',
            'font-family': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
            'color': '#2D3748',
            'background-color': 'transparent',
            'border': 'none',
            'outline': 'none',
            'padding': '12px 16px',
            'height': '48px',
            'width': '100%'
          },
          '.invalid': {
            'color': '#E53E3E'
          },
          '.valid': {
            'color': '#38A169'
          }
        }
      });

      // Render individual card fields with modern styling
      console.log(`[${instanceIdRef.current}] About to render PayPal card fields...`);
      
      // Small delay to ensure DOM elements are ready
      setTimeout(() => {
        try {
          console.log(`[${instanceIdRef.current}] DOM ready, rendering PayPal fields now...`);
          
          // Render each field only if container is empty
          if (cardFieldsInstance.NumberField && cardNumberRef.current && cardNumberRef.current.children.length === 0) {
            console.log(`[${instanceIdRef.current}] Rendering card number field...`);
            const numberField = cardFieldsInstance.NumberField();
            numberField.render(cardNumberRef.current).catch(err => {
              console.error(`[${instanceIdRef.current}] Error rendering number field:`, err);
              setError('Failed to render card number field');
              isRenderingRef.current = false;
            });
          } else {
            console.log(`[${instanceIdRef.current}] Skipping card number field - already exists or unavailable`);
          }
          
          if (cardFieldsInstance.ExpiryField && expiryRef.current && expiryRef.current.children.length === 0) {
            console.log(`[${instanceIdRef.current}] Rendering expiry field...`);
            const expiryField = cardFieldsInstance.ExpiryField();
            expiryField.render(expiryRef.current).catch(err => {
              console.error(`[${instanceIdRef.current}] Error rendering expiry field:`, err);
              setError('Failed to render expiry field');
              isRenderingRef.current = false;
            });
          } else {
            console.log(`[${instanceIdRef.current}] Skipping expiry field - already exists or unavailable`);
          }
          
          if (cardFieldsInstance.CVVField && cvvRef.current && cvvRef.current.children.length === 0) {
            console.log(`[${instanceIdRef.current}] Rendering CVV field...`);
            const cvvField = cardFieldsInstance.CVVField();
            cvvField.render(cvvRef.current).catch(err => {
              console.error(`[${instanceIdRef.current}] Error rendering CVV field:`, err);
              setError('Failed to render CVV field');
              isRenderingRef.current = false;
            });
          } else {
            console.log(`[${instanceIdRef.current}] Skipping CVV field - already exists or unavailable`);
          }
          
          if (cardFieldsInstance.NameField && nameRef.current && nameRef.current.children.length === 0) {
            console.log(`[${instanceIdRef.current}] Rendering name field...`);
            const nameField = cardFieldsInstance.NameField();
            nameField.render(nameRef.current).catch(err => {
              console.error(`[${instanceIdRef.current}] Error rendering name field:`, err);
              setError('Failed to render name field');
              isRenderingRef.current = false;
            });
          } else {
            console.log(`[${instanceIdRef.current}] Skipping name field - already exists or unavailable`);
          }

          console.log(`[${instanceIdRef.current}] All PayPal card fields processing completed`);
          setCardFields(cardFieldsInstance);
          setFieldsRendered(true);
          window.__PAYPAL_FORM_INITIALIZED__ = true; // Set global flag
          setDebugInfo('Credit card form ready - click on fields to enter your card details');
        } catch (error) {
          console.error(`[${instanceIdRef.current}] Error in field rendering timeout:`, error);
          setError('Failed to render payment fields');
          isRenderingRef.current = false;
        }
      }, 150); // Slightly longer delay

      console.log(`[${instanceIdRef.current}] PayPal Card Form - Card fields initialization completed`);
      
    } catch (error) {
      console.error(`[${instanceIdRef.current}] PayPal Card Form - Error initializing card fields:`, error);
      setError('Failed to initialize credit card form: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    console.log(`[${instanceIdRef.current}] handleSubmit called`);
    console.log(`[${instanceIdRef.current}] cardFields:`, cardFields);
    console.log(`[${instanceIdRef.current}] isProcessing:`, isProcessing);
    
    if (!cardFields || isProcessing) {
      console.log(`[${instanceIdRef.current}] Cannot submit - cardFields: ${cardFields}, isProcessing: ${isProcessing}`);
      return;
    }

    try {
      setIsProcessing(true);
      setDebugInfo('Processing payment...');
      console.log(`[${instanceIdRef.current}] Submitting card fields...`);
      
      // Submit the card fields
      const result = await cardFields.submit();
      console.log(`[${instanceIdRef.current}] Card fields submit result:`, result);
      
    } catch (error) {
      console.error(`[${instanceIdRef.current}] Submit error:`, error);
      setIsProcessing(false);
      setError('Payment submission failed: ' + error.message);
    }
  };

  if (error) {
    return (
      <Box 
        bg="white" 
        borderRadius="xl" 
        boxShadow="lg" 
        p={6}
        border="1px solid"
        borderColor="red.200"
      >
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Payment Error</Text>
            <Text>{error}</Text>
            {debugInfo && (
              <Text fontSize="sm" color="gray.600" mt={2}>
                Debug: {debugInfo}
              </Text>
            )}
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      bg="white" 
      borderRadius="xl" 
      boxShadow="xl" 
      overflow="hidden"
      border="1px solid"
      borderColor="gray.200"
      maxW="500px"
      mx="auto"
    >
      {/* Header */}
      <Box 
        bgGradient="linear(to-r, blue.600, purple.600)" 
        p={6} 
        color="white"
      >
        <HStack spacing={3} mb={2}>
          <Icon as={FaCreditCard} boxSize={6} />
          <Text fontSize="xl" fontWeight="bold">Secure Payment</Text>
          <Icon as={FaLock} boxSize={4} />
        </HStack>
        <Text fontSize="2xl" fontWeight="bold">${amount?.toFixed(2)}</Text>
        <Text fontSize="sm" opacity={0.9}>
          Powered by PayPal • SSL Encrypted
        </Text>
      </Box>

      {/* Payment Form */}
      <Box p={6}>
        {/* Test Card Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <Alert status="info" borderRadius="lg" mb={6}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold" fontSize="sm">Test Card Numbers (Sandbox)</Text>
              <VStack align="start" spacing={1} fontSize="xs" mt={2}>
                <Text><strong>Visa:</strong> 4032035728288280</Text>
                <Text><strong>Mastercard:</strong> 5256183896302662</Text>
                <Text><strong>Expiry:</strong> Any future date (e.g., 12/2030)</Text>
                <Text><strong>CVV:</strong> Any 3 digits (e.g., 123)</Text>
              </VStack>
            </Box>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            minHeight="300px"
          >
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text color="gray.600" fontWeight="medium">Loading payment form...</Text>
              {debugInfo && (
                <Text fontSize="sm" color="gray.500">
                  {debugInfo}
                </Text>
              )}
            </VStack>
          </Box>
        )}

        {/* Processing State */}
        {isProcessing && (
          <Alert status="info" borderRadius="lg" mb={6}>
            <AlertIcon />
            <HStack>
              <Spinner size="sm" />
              <Text fontWeight="medium">Processing your payment...</Text>
            </HStack>
          </Alert>
        )}
        
        {/* Credit Card Form Fields */}
        {!isLoading && (
          <VStack spacing={6} align="stretch" key="paypal-form-fields">
            
            {/* Cardholder Name */}
            <FormControl key="name-field">
              <FormLabel 
                fontSize="sm" 
                fontWeight="semibold" 
                color="gray.700"
                mb={2}
              >
                Cardholder Name
              </FormLabel>
              <Box 
                ref={nameRef}
                minH="48px"
                border="2px solid"
                borderColor="gray.300"
                borderRadius="lg"
                bg="white"
                position="relative"
                sx={{
                  '& iframe': {
                    width: '100%',
                    height: '48px',
                    border: 'none'
                  }
                }}
              />
            </FormControl>

            {/* Card Number */}
            <FormControl key="number-field">
              <FormLabel 
                fontSize="sm" 
                fontWeight="semibold" 
                color="gray.700"
                mb={2}
              >
                <HStack>
                  <Text>Card Number</Text>
                  <Icon as={FaCreditCard} color="gray.400" />
                </HStack>
              </FormLabel>
              <Box 
                ref={cardNumberRef}
                minH="48px"
                border="2px solid"
                borderColor="gray.300"
                borderRadius="lg"
                bg="white"
                position="relative"
                sx={{
                  '& iframe': {
                    width: '100%',
                    height: '48px',
                    border: 'none'
                  }
                }}
              />
            </FormControl>

            {/* Expiry and CVV */}
            <HStack spacing={4} key="expiry-cvv-fields">
              <FormControl key="expiry-field">
                <FormLabel 
                  fontSize="sm" 
                  fontWeight="semibold" 
                  color="gray.700"
                  mb={2}
                >
                  Expiry Date
                </FormLabel>
                <Box 
                  ref={expiryRef}
                  minH="48px"
                  border="2px solid"
                  borderColor="gray.300"
                  borderRadius="lg"
                  bg="white"
                  position="relative"
                  sx={{
                    '& iframe': {
                      width: '100%',
                      height: '48px',
                      border: 'none'
                    }
                  }}
                />
              </FormControl>

              <FormControl key="cvv-field">
                <FormLabel 
                  fontSize="sm" 
                  fontWeight="semibold" 
                  color="gray.700"
                  mb={2}
                >
                  <HStack>
                    <Text>CVV</Text>
                    <Icon as={FaShieldAlt} color="gray.400" />
                  </HStack>
                </FormLabel>
                <Box 
                  ref={cvvRef}
                  minH="48px"
                  border="2px solid"
                  borderColor="gray.300"
                  borderRadius="lg"
                  bg="white"
                  position="relative"
                  sx={{
                    '& iframe': {
                      width: '100%',
                      height: '48px',
                      border: 'none'
                    }
                  }}
                />
              </FormControl>
            </HStack>

            <Divider />

            {/* Security Info */}
            <Box bg="gray.50" p={4} borderRadius="lg">
              <HStack spacing={3} mb={2}>
                <Icon as={FaLock} color="green.500" />
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  Your payment is secure
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.600">
                Your card information is encrypted and processed securely by PayPal. 
                We never store your payment details.
              </Text>
            </Box>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              isLoading={isProcessing}
              loadingText="Processing Payment..."
              isDisabled={disabled || isLoading || !cardFields}
              size="lg"
              h="56px"
              bgGradient="linear(to-r, blue.600, purple.600)"
              color="white"
              fontWeight="bold"
              fontSize="lg"
              borderRadius="lg"
              _hover={{
                bgGradient: "linear(to-r, blue.700, purple.700)",
                transform: "translateY(-1px)",
                boxShadow: "lg"
              }}
              _active={{
                transform: "translateY(0px)"
              }}
              transition="all 0.2s"
            >
              <HStack spacing={2}>
                <Icon as={FaLock} />
                <Text>Pay ${amount?.toFixed(2)}</Text>
              </HStack>
            </Button>

            {/* Debug Info */}
            {debugInfo && process.env.NODE_ENV === 'development' && (
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Status: {debugInfo}
              </Text>
            )}

          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default PayPalCreditCardForm; 