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
  const paypalInstanceRef = useRef(null);
  const isInitializedRef = useRef(false);
  const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9));
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Loading PayPal SDK...');
  const [cardFields, setCardFields] = useState(null);
  const [fieldsReady, setFieldsReady] = useState(false);
  const toast = useToast();

  // Cleanup function
  const cleanup = () => {
    console.log(`[${instanceIdRef.current}] Cleaning up PayPal fields...`);
    try {
      // Clear DOM elements
      [cardNumberRef, expiryRef, cvvRef, nameRef].forEach((ref) => {
        if (ref.current) {
          ref.current.innerHTML = '';
        }
      });
      
      // Reset state
      setCardFields(null);
      setFieldsReady(false);
      paypalInstanceRef.current = null;
      isInitializedRef.current = false;
    } catch (error) {
      console.error(`[${instanceIdRef.current}] Cleanup error:`, error);
    }
  };

  // Load PayPal script if not already loaded
  const loadPayPalScript = () => {
    return new Promise((resolve, reject) => {
      if (window.paypal) {
        console.log(`[${instanceIdRef.current}] PayPal already loaded`);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&components=buttons,card-fields&intent=capture`;
      script.async = true;
      
      script.onload = () => {
        console.log(`[${instanceIdRef.current}] PayPal script loaded successfully`);
        resolve();
      };
      
      script.onerror = () => {
        console.error(`[${instanceIdRef.current}] Failed to load PayPal script`);
        reject(new Error('Failed to load PayPal SDK'));
      };
      
      document.head.appendChild(script);
    });
  };

  // Initialize PayPal card fields
  const initializeCardFields = async () => {
    try {
      console.log(`[${instanceIdRef.current}] Initializing card fields...`);
      
      if (!window.paypal) {
        throw new Error('PayPal SDK not loaded');
      }

      if (isInitializedRef.current) {
        console.log(`[${instanceIdRef.current}] Already initialized, skipping...`);
        return;
      }

      setDebugInfo('Setting up payment form...');

      const cardFieldsInstance = window.paypal.CardFields({
        createOrder: async () => {
          console.log(`[${instanceIdRef.current}] Creating payment order...`);
          setDebugInfo('Creating payment order...');
          
          try {
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

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[${instanceIdRef.current}] Create order failed:`, response.status, errorText);
              throw new Error(`Payment order creation failed: ${response.status}`);
            }

            const data = await response.json();
            console.log(`[${instanceIdRef.current}] Order created:`, data);
            
            if (!data.success || !data.orderId) {
              throw new Error(data.error || 'Failed to create payment order');
            }

            setDebugInfo('Payment order created successfully');
            return data.orderId;
            
          } catch (error) {
            console.error(`[${instanceIdRef.current}] Create order error:`, error);
            setError(`Failed to create payment order: ${error.message}`);
            throw error;
          }
        },

        onApprove: async (data) => {
          try {
            console.log(`[${instanceIdRef.current}] Payment approved:`, data.orderID);
            setDebugInfo('Processing payment...');
            setIsProcessing(true);
            
            const response = await fetch('/api/payments/capture', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: data.orderID
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[${instanceIdRef.current}] Capture failed:`, response.status, errorText);
              throw new Error(`Payment capture failed: ${response.status}`);
            }

            const result = await response.json();
            console.log(`[${instanceIdRef.current}] Payment captured:`, result);
            
            if (!result.success) {
              throw new Error(result.error || 'Payment capture failed');
            }

            setDebugInfo('Payment completed successfully!');
            onSuccess(result.data);
            
          } catch (error) {
            console.error(`[${instanceIdRef.current}] Capture error:`, error);
            setIsProcessing(false);
            setError(`Payment processing failed: ${error.message}`);
            onError(error.message);
          }
        },

        onError: (err) => {
          console.error(`[${instanceIdRef.current}] PayPal error:`, err);
          setIsProcessing(false);
          
          let errorMessage = 'Payment failed. Please try again.';
          
          if (err.message) {
            if (err.message.includes('Invalid card number')) {
              errorMessage = 'Invalid card number. Please check and try again.';
            } else if (err.message.includes('Window closed')) {
              errorMessage = 'Payment window closed unexpectedly. Please try again.';
            } else if (err.message.includes('422') || err.message.includes('UNPROCESSABLE_ENTITY')) {
              errorMessage = 'Invalid payment details. For testing, use: 4032035728288280, 12/2030, 123';
            } else {
              errorMessage = err.message;
            }
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

      // Store the instance
      paypalInstanceRef.current = cardFieldsInstance;
      setCardFields(cardFieldsInstance);

      // Render fields with better error handling and validation
      console.log(`[${instanceIdRef.current}] Rendering card fields...`);
      
      const renderField = async (fieldMethod, container, fieldName) => {
        try {
          if (!fieldMethod) {
            console.warn(`[${instanceIdRef.current}] ${fieldName} field method not available`);
            return false;
          }
          
          if (!container) {
            console.warn(`[${instanceIdRef.current}] ${fieldName} container not available`);
            return false;
          }

          // Check if container is in DOM and visible
          if (!document.body.contains(container)) {
            console.warn(`[${instanceIdRef.current}] ${fieldName} container not in DOM`);
            return false;
          }

          // Clear any existing content
          container.innerHTML = '';
          
          console.log(`[${instanceIdRef.current}] Rendering ${fieldName} field...`);
          
          const field = fieldMethod();
          await field.render(container);
          
          // Verify the field was actually rendered
          const iframe = container.querySelector('iframe');
          if (!iframe) {
            console.warn(`[${instanceIdRef.current}] ${fieldName} field iframe not found after render`);
            return false;
          }
          
          console.log(`[${instanceIdRef.current}] ${fieldName} field rendered successfully`);
          return true;
          
        } catch (error) {
          console.error(`[${instanceIdRef.current}] Error rendering ${fieldName} field:`, error);
          return false;
        }
      };

      // Add a small delay to ensure DOM is stable
      await new Promise(resolve => setTimeout(resolve, 100));

      // Render fields sequentially with validation
      const fieldsToRender = [
        { method: cardFieldsInstance.NameField, container: nameRef.current, name: 'Name' },
        { method: cardFieldsInstance.NumberField, container: cardNumberRef.current, name: 'Number' },
        { method: cardFieldsInstance.ExpiryField, container: expiryRef.current, name: 'Expiry' },
        { method: cardFieldsInstance.CVVField, container: cvvRef.current, name: 'CVV' }
      ];

      const renderResults = [];
      for (const field of fieldsToRender) {
        const result = await renderField(field.method, field.container, field.name);
        renderResults.push({ name: field.name, success: result });
        
        // Add small delay between field renders
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check results
      const successfulFields = renderResults.filter(r => r.success);
      const failedFields = renderResults.filter(r => !r.success);

      console.log(`[${instanceIdRef.current}] Field render results:`, renderResults);

      if (successfulFields.length === 4) {
        // All fields rendered successfully
        isInitializedRef.current = true;
        setFieldsReady(true);
        setDebugInfo('Payment form ready - click on fields to enter your card details');
        setIsLoading(false);
        
        console.log(`[${instanceIdRef.current}] All card fields initialized successfully`);
      } else {
        // Some fields failed
        const failedFieldNames = failedFields.map(f => f.name).join(', ');
        const errorMessage = `Failed to render payment fields: ${failedFieldNames}. Please refresh the page and try again.`;
        console.error(`[${instanceIdRef.current}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error(`[${instanceIdRef.current}] Initialization error:`, error);
      setError(`Failed to initialize payment form: ${error.message}`);
      setIsLoading(false);
      // Don't mark as initialized if there was an error
      isInitializedRef.current = false;
    }
  };

  // Main initialization effect
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    
    if (!clientId) {
      setError('PayPal configuration missing');
      setIsLoading(false);
      return;
    }

    console.log(`[${instanceIdRef.current}] Starting PayPal initialization...`);
    
    const init = async () => {
      try {
        await loadPayPalScript();
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          initializeCardFields();
        }, 500);
      } catch (error) {
        console.error(`[${instanceIdRef.current}] Initialization failed:`, error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    init();

    // Cleanup on unmount
    return cleanup;
  }, []); // Only run once

  // Handle form submission
  const handleSubmit = async () => {
    if (!cardFields || isProcessing || !fieldsReady) {
      console.log(`[${instanceIdRef.current}] Cannot submit - cardFields: ${!!cardFields}, isProcessing: ${isProcessing}, fieldsReady: ${fieldsReady}`);
      return;
    }

    try {
      setIsProcessing(true);
      setDebugInfo('Validating payment details...');
      console.log(`[${instanceIdRef.current}] Submitting payment...`);
      
      await cardFields.submit();
      
    } catch (error) {
      console.error(`[${instanceIdRef.current}] Submit error:`, error);
      setIsProcessing(false);
      
      let errorMessage = 'Payment submission failed. Please try again.';
      if (error.message && error.message.includes('Window closed')) {
        errorMessage = 'Payment window closed. Please check your card details and try again.';
      }
      
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  // Error display with retry functionality
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
        <Button
          mt={4}
          onClick={() => {
            setError(null);
            setDebugInfo('Retrying...');
            cleanup();
            // Add delay before retrying
            setTimeout(() => {
              setIsLoading(true);
              initializeCardFields();
            }, 1000);
          }}
          colorScheme="red"
          variant="outline"
        >
          Try Again
        </Button>
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
                <Text fontSize="sm" color="gray.500" textAlign="center">
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
          <VStack spacing={6} align="stretch">
            
            {/* Cardholder Name */}
            <FormControl>
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
                cursor="text"
                sx={{
                  '& iframe': {
                    width: '100%',
                    height: '48px',
                    border: 'none',
                    pointerEvents: 'auto'
                  }
                }}
              />
            </FormControl>

            {/* Card Number */}
            <FormControl>
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
                cursor="text"
                sx={{
                  '& iframe': {
                    width: '100%',
                    height: '48px',
                    border: 'none',
                    pointerEvents: 'auto'
                  }
                }}
              />
            </FormControl>

            {/* Expiry and CVV */}
            <HStack spacing={4}>
              <FormControl>
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
                  cursor="text"
                  sx={{
                    '& iframe': {
                      width: '100%',
                      height: '48px',
                      border: 'none',
                      pointerEvents: 'auto'
                    }
                  }}
                />
              </FormControl>

              <FormControl>
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
                  cursor="text"
                  sx={{
                    '& iframe': {
                      width: '100%',
                      height: '48px',
                      border: 'none',
                      pointerEvents: 'auto'
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
              isDisabled={disabled || isLoading || !fieldsReady}
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