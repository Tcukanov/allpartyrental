import { useState, useEffect } from 'react';
import { Button, Box, Text, useToast, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Stack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Code, useDisclosure } from '@chakra-ui/react';
import { FaPaypal, FaCreditCard, FaBug } from 'react-icons/fa';

/**
 * PayPal Payment Button component that handles the payment flow
 * Supports both PayPal wallet and direct credit card payments
 */
const PayPalPaymentButton = ({
  amount,
  serviceName,
  onPaymentSuccess,
  onPaymentError,
  metadata = {},
  isDisabled = false,
  buttonText = "Pay with PayPal",
  createPaymentEndpoint = '/api/payment/create-intent',
  showCardByDefault = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showCardOption, setShowCardOption] = useState(showCardByDefault);
  const [isComplete, setIsComplete] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const toast = useToast();
  const { isOpen: isDebugOpen, onOpen: onDebugOpen, onClose: onDebugClose } = useDisclosure();

  // Create debug information for the debug modal
  const createDebugInfo = () => {
    const info = {
      environment: process.env.NODE_ENV || 'Unknown',
      sdkStatus: !!window.paypal ? 'Loaded' : 'Not loaded',
      hostedFieldsAvailable: !!(window.paypal && window.paypal.HostedFields),
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'Not configured',
      amount: amount,
      formContainerExists: !!document.getElementById('card-form-container'),
      formState: 'Unknown',
      domIssues: []
    };
    
    // Check for potential DOM issues
    try {
      const cardFormContainer = document.getElementById('card-form-container');
      if (cardFormContainer) {
        info.formState = 'Container exists';
        const formElements = cardFormContainer.querySelectorAll('[data-paypal-credit-card], [data-paypal-mock-form]');
        if (formElements.length === 0) {
          info.domIssues.push('No card form elements found');
        } else {
          info.formState = `Found ${formElements.length} form elements`;
        }
      } else {
        info.domIssues.push('Card form container not found');
      }
    } catch (e) {
      info.domIssues.push(`DOM check error: ${e.message}`);
    }
    
    return info;
  };
  
  // Add a keyboard shortcut for debug mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Alt+D (or Command+Option+D on Mac)
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'd') {
        const info = createDebugInfo();
        setDebugInfo(info);
        onDebugOpen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDebugOpen]);

  // Load the PayPal JS SDK
  useEffect(() => {
    const loadPayPalScript = async () => {
      if (window.paypal) {
        return;
      }

      setIsInitializing(true);
      try {
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId && process.env.NODE_ENV === 'production') {
          throw new Error('PayPal client ID is not configured');
        }

        // In development, use a sandbox client ID or mock
        const effectiveClientId = clientId || 'test-sandbox-client-id';

        const script = document.createElement('script');
        // Add card support by including the 'card' component and additional parameters
        script.src = `https://www.paypal.com/sdk/js?client-id=${effectiveClientId}&currency=USD&components=buttons,hosted-fields&integration-date=2023-05-01`;
        script.async = true;
        script.onload = () => {
          console.log("PayPal SDK loaded successfully");
          // Initialize client for hosted fields
          if (window.paypal && window.paypal.HostedFields) {
            console.log("PayPal HostedFields component available");
          } else {
            console.warn("PayPal HostedFields component not available");
          }
          setIsInitializing(false);
        };
        script.onerror = (err) => {
          console.error('Failed to load PayPal SDK:', err);
          setError('Failed to load PayPal SDK');
          setIsInitializing(false);
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error loading PayPal SDK:', error);
        setError(`Failed to initialize PayPal: ${error.message}`);
        setIsInitializing(false);
      }
    };

    loadPayPalScript();
  }, []);

  // If showCardByDefault is true, initialize the card payment flow once the SDK is loaded
  useEffect(() => {
    // Only proceed if showCardByDefault is true and SDK initialization is complete
    if (!showCardByDefault || isInitializing) {
      return;
    }

    // If the SDK failed to load or we're already in a loading state, don't proceed
    if (error || isLoading) {
      return;
    }

    // Check if PayPal SDK is loaded
    const isPayPalReady = !!window.paypal;
    const hasHostedFields = !!(window.paypal && window.paypal.HostedFields);
    
    // Log the state for debugging
    console.log(`Card initialization state: PayPal SDK loaded: ${isPayPalReady}, Hosted Fields: ${hasHostedFields}`);
    
    // If we already have payment data and card option is shown, we don't need to do anything
    if (paymentData && showCardOption) {
      return;
    }
    
    // When the PayPal SDK is loaded, create the payment intent
    const initCardPayment = async () => {
      try {
        setIsLoading(true);
        
        // Create the payment intent
        const paymentIntent = await createPayment();
        if (paymentIntent) {
          setShowCardOption(true);
          
          // If we're in dev mode without client ID, use mock flow right away
          const isDevelopment = process.env.NODE_ENV === 'development';
          const noRealCredentials = !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
          
          if (isDevelopment && noRealCredentials) {
            console.log("Development mode with no credentials - using mock card flow directly");
            simulateCreditCardFlow(paymentIntent);
            return;
          }
          
          // If the SDK has hosted fields, render them
          if (hasHostedFields) {
            // Give it a moment to update state before rendering
            setTimeout(() => {
              renderCardForm(paymentIntent);
            }, 300);
          } else if (isDevelopment) {
            // In development, fallback to mock if hosted fields aren't available
            console.log("Hosted Fields not available, falling back to mock in development");
            simulateCreditCardFlow(paymentIntent);
          } else {
            // In production, show an error
            setError("PayPal card processing is not available. Please try again later or use a different payment method.");
          }
        }
      } catch (error) {
        console.error("Error initializing card payment:", error);
        setError("Failed to initialize card payment: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only run this once when the SDK is ready
    if (isPayPalReady && !paymentData) {
      console.log("PayPal SDK ready, initializing card payment flow");
      initCardPayment();
    }
  }, [showCardByDefault, isInitializing, isLoading, error, paymentData, showCardOption, window.paypal]);

  // Function to create a payment intent on the server
  const createPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure amount is properly formatted (PayPal expects a string with decimal places)
      // Since the price is already in dollars (e.g. 628.95), we should NOT divide by 100
      const formattedAmount = typeof amount === 'number' 
        ? amount.toFixed(2)  // Keep amount as is, just ensure two decimal places
        : parseFloat(amount).toFixed(2);  // Convert string to number with two decimal places
        
      console.log("Creating payment with amount:", formattedAmount);
      
      const response = await fetch(createPaymentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: formattedAmount,
          serviceName,
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const paymentData = await response.json();

      if (!paymentData.success || !paymentData.data) {
        throw new Error(paymentData.error || 'Invalid payment data');
      }

      console.log("Payment intent created:", paymentData.data);
      setPaymentData(paymentData.data);
      return paymentData.data;
    } catch (error) {
      console.error('Payment creation error:', error);
      setError(error.message || 'Failed to initialize payment');
      if (onPaymentError) {
        onPaymentError(error);
      }
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initialize payment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PayPal button click
  const handlePayPalClick = async () => {
    if (isDisabled || isLoading || isInitializing) {
      return;
    }

    const paymentIntent = await createPayment();
    if (!paymentIntent) {
      return;
    }

    // Render the PayPal button
    renderPayPalButton(paymentIntent);
  };

  // Handle Credit Card button click
  const handleCardClick = async () => {
    if (isDisabled || isLoading || isInitializing) {
      return;
    }

    setShowCardOption(true);
    const paymentIntent = await createPayment();
    if (!paymentIntent) {
      return;
    }

    // Render the Card form
    renderCardForm(paymentIntent);
  };

  // Render the PayPal Buttons
  const renderPayPalButton = (paymentData) => {
    // Check if we're in development with no real PayPal credentials
    const isDevelopment = process.env.NODE_ENV === 'development';
    const noRealCredentials = !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    
    // If we're in development with no credentials, simulate PayPal flow
    if (isDevelopment && noRealCredentials) {
      console.log("Using mock PayPal flow in development");
      simulatePayPalFlow(paymentData);
      return;
    }
    
    if (!window.paypal || !paymentData?.id) {
      setError('PayPal is not initialized correctly');
      return;
    }

    // Clear any previously rendered buttons
    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = '';
    }

    // Create the PayPal button
    window.paypal.Buttons({
      // Set up the transaction
      createOrder: function() {
        // Return the order ID from our backend
        return paymentData.id;
      },
      
      // Handle successful payment
      onApprove: async function(data, actions) {
        setIsProcessing(true);
        try {
          // Call your backend to capture the payment
          const response = await fetch(`/api/payment/capture-intent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: data.orderID,
              ...metadata
            }),
          });
          
          const captureData = await response.json();
          
          if (!captureData.success) {
            throw new Error(captureData.error || 'Payment capture failed');
          }
          
          // Create payment data for callback
          const paymentResult = {
            transactionId: data.orderID,
            amount: amount,
            method: 'paypal',
            captureId: captureData.data.captureId || data.orderID,
            metadata: metadata || {}
          };
          
          // Set states to complete
          setPaymentData(paymentResult);
          setIsComplete(true);
          setIsProcessing(false);
          
          // Call success callback
          if (onPaymentSuccess) {
            onPaymentSuccess(paymentResult);
          }
          
          toast({
            title: 'Payment Successful',
            description: 'Your payment was processed successfully!',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Payment capture error:', error);
          setError(error.message || 'Failed to capture payment');
          
          if (onPaymentError) {
            onPaymentError(error);
          }
          
          toast({
            title: 'Payment Error',
            description: error.message || 'Failed to capture payment',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setIsProcessing(false);
        }
      },
      
      // Handle cancelled payment
      onCancel: function() {
        console.log('Payment cancelled');
        toast({
          title: 'Payment Cancelled',
          description: 'You cancelled the payment process.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      },
      
      // Handle payment errors
      onError: function(err) {
        console.error('PayPal error:', err);
        setError('An error occurred with PayPal. Please try again.');
        
        if (onPaymentError) {
          onPaymentError(err);
        }
        
        toast({
          title: 'PayPal Error',
          description: 'An error occurred with PayPal. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }).render('#paypal-button-container').catch(err => {
      console.error('Error rendering PayPal buttons:', err);
      setError('Failed to load PayPal payment options');
    });
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any dynamically added elements
      const container = document.getElementById('paypal-button-container');
      if (container) {
        container.innerHTML = '';
      }
      
      const cardContainer = document.getElementById('card-form-container');
      if (cardContainer) {
        cardContainer.innerHTML = '';
      }
      
      // Remove any added style elements
      const addedStyles = document.querySelectorAll('style[data-paypal-credit-card]');
      addedStyles.forEach(style => {
        if (style && style.parentNode) {
          style.parentNode.removeChild(style);
        }
      });
    };
  }, []);

  // Function to render the credit card form
  const renderCardForm = (paymentIntent) => {
    console.log("Attempting to render hosted fields with order ID:", paymentIntent.id);
    
    if (!window.paypal || !window.paypal.HostedFields) {
      console.error("PayPal SDK or HostedFields not available");
      setError("Card processing is not available at this time");
      return;
    }
    
    // Check if we have a client ID - needed for authorization
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      console.warn("Missing PayPal client ID - cannot initialize hosted fields");
      if (process.env.NODE_ENV === 'development') {
        console.log("In development mode - using mock credit card flow instead");
        simulateCreditCardFlow(paymentIntent);
      } else {
        setError("Payment configuration error. Please try again later.");
      }
      return;
    }
    
    try {
      // Clear any existing card fields container first to avoid duplicates
      const existingContainer = document.querySelector('#card-form-container');
      if (existingContainer) {
        while (existingContainer.firstChild) {
          existingContainer.removeChild(existingContainer.firstChild);
        }
      }
      
      // Create basic card form HTML
      const formHtml = `
        <div class="card-field-container">
          <label for="card-number">Card Number</label>
          <div id="card-number" class="card-field"></div>
        </div>
        <div class="card-field-row">
          <div class="card-field-container">
            <label for="expiration-date">Expiration Date</label>
            <div id="expiration-date" class="card-field"></div>
          </div>
          <div class="card-field-container">
            <label for="cvv">CVV</label>
            <div id="cvv" class="card-field"></div>
          </div>
        </div>
        <div class="card-field-container">
          <label for="card-holder-name">Name on Card</label>
          <input type="text" id="card-holder-name" placeholder="Card Holder Name">
        </div>
        <button id="submit-card" type="button">Pay Now</button>
      `;
      
      // Create the form wrapper
      const formDiv = document.createElement('div');
      formDiv.className = 'paypal-card-form';
      formDiv.innerHTML = formHtml;
      existingContainer.appendChild(formDiv);
      
      // Ensure styles are added
      addCardFormStyles();
      
      // Render the hosted fields with a delay to ensure the DOM is ready
      setTimeout(() => {
        try {
          console.log("Initializing hosted fields with orderId:", paymentIntent.id);
          
          // Initialize PayPal Hosted Fields
          window.paypal.HostedFields.render({
            // The authorization is required for Hosted Fields
            createOrder: () => paymentIntent.id,
            styles: {
              '.valid': { color: 'green' },
              '.invalid': { color: 'red' },
              'input': {
                'font-size': '16px',
                'font-family': 'Arial, sans-serif',
                'color': '#3a3a3a'
              },
              '.card-field': { 'height': '40px' }
            },
            fields: {
              number: {
                selector: '#card-number',
                placeholder: '4111 1111 1111 1111'
              },
              cvv: {
                selector: '#cvv',
                placeholder: '123'
              },
              expirationDate: {
                selector: '#expiration-date',
                placeholder: 'MM/YY'
              }
            }
          }).then(hostedFields => {
            console.log("Hosted fields rendered successfully");
            
            // Add event listener to submit button
            const submitButton = document.getElementById('submit-card');
            if (submitButton) {
              submitButton.addEventListener('click', async () => {
                handleCardSubmission(hostedFields, paymentIntent);
              });
            }
          }).catch(err => {
            console.error('Hosted fields render error:', err);
            
            // If we get an authorization error, fallback to mock in development
            if (process.env.NODE_ENV === 'development' && 
                (err.message.includes('authorization') || err.message.includes('clientID'))) {
              console.log("Authorization error in development, falling back to mock form");
              simulateCreditCardFlow(paymentIntent);
              return;
            }
            
            setError(`Failed to initialize card fields: ${err.message}`);
          });
        } catch (error) {
          console.error('Error setting up hosted fields:', error);
          if (process.env.NODE_ENV === 'development') {
            console.log("Error in development, falling back to mock form");
            simulateCreditCardFlow(paymentIntent);
          } else {
            setError(`Failed to set up card fields: ${error.message}`);
          }
        }
      }, 500); // Increased timeout for better DOM readiness
    } catch (error) {
      console.error('Error setting up hosted fields:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log("Error in development, falling back to mock form");
        simulateCreditCardFlow(paymentIntent);
      } else {
        setError(`Failed to set up card fields: ${error.message}`);
      }
    }
  };
  
  // Helper function to add styles for card form
  const addCardFormStyles = () => {
    // Remove any existing styles to prevent duplicates
    const existingStyle = document.querySelector('style[data-paypal-credit-card]');
    if (existingStyle) {
      existingStyle.parentNode.removeChild(existingStyle);
    }
    
    // Create style element
    const style = document.createElement('style');
    style.setAttribute('data-paypal-credit-card', 'true');
    style.textContent = `
      .card-field-container {
        margin-bottom: 15px;
      }
      .card-field-row {
        display: flex;
        gap: 15px;
      }
      .card-field {
        height: 40px;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px;
        background-color: white;
      }
      #card-holder-name {
        width: 100%;
        height: 40px;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px;
      }
      #submit-card {
        width: 100%;
        padding: 10px;
        background-color: #0070ba;
        color: white;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 10px;
      }
    `;
    
    document.head.appendChild(style);
  };

  // Function to handle submission of card details
  const handleCardSubmission = async (hostedFields, paymentIntent) => {
    try {
      setIsProcessing(true);
      
      // Get card holder name
      const cardHolderName = document.getElementById('card-holder-name');
      if (!cardHolderName || !cardHolderName.value.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter the name on your card",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsProcessing(false);
        return;
      }
      
      // Validate the card fields
      const state = await hostedFields.getState();
      console.log("Card fields state:", state);
      
      // Check if all fields are valid
      const { fields } = state;
      const invalidFields = [];
      
      if (!fields.number.isValid) invalidFields.push("Card Number");
      if (!fields.expirationDate.isValid) invalidFields.push("Expiration Date");
      if (!fields.cvv.isValid) invalidFields.push("CVV");
      
      if (invalidFields.length > 0) {
        toast({
          title: "Invalid Card Details",
          description: `Please check the following: ${invalidFields.join(", ")}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsProcessing(false);
        return;
      }
      
      console.log("Submitting card payment for order:", paymentIntent.id);
      
      // Submit the card data
      const payload = await hostedFields.submit({
        contingencies: ['3D_SECURE'],
        cardholderName: cardHolderName.value
      });
      
      console.log("Card submission result:", payload);
      
      if (payload.liabilityShifted === false) {
        // 3D Secure authentication failed or was declined
        setError("Your bank declined this transaction. Please try another payment method.");
        setIsProcessing(false);
        return;
      }
      
      if (payload.liabilityShift === "POSSIBLE") {
        console.log("3D Secure authentication was successful");
      }
      
      // Now call your backend to capture the payment
      const response = await fetch('/api/payment/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderID: paymentIntent.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment capture failed');
      }
      
      const captureData = await response.json();
      console.log("Payment capture response:", captureData);
      
      // Set payment data and call success callback
      const paymentData = {
        transactionId: paymentIntent.id,
        amount: amount,
        method: 'card',
        details: {
          cardType: payload.details?.cardType || 'Unknown',
          lastFour: payload.details?.lastFourDigits || '****'
        },
        metadata: metadata || {}
      };
      
      setPaymentData(paymentData);
      setIsComplete(true);
      setIsProcessing(false);
      
      // Call the success callback
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentData);
      }
      
      toast({
        title: "Payment Complete",
        description: `Payment of $${amount} processed successfully`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Card submission error:", error);
      
      // Determine error message based on the type of error
      let errorMessage = "An error occurred during payment processing.";
      
      if (error.details && error.details.description) {
        errorMessage = error.details.description;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsProcessing(false);
      
      // Call the error callback
      if (onPaymentError) {
        onPaymentError(error);
      }
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    }
  };

  // Function to simulate PayPal flow for development/testing
  const simulatePayPalFlow = (paymentData) => {
    // Show a message about mock mode
    toast({
      title: 'Development Mode',
      description: 'Using mock PayPal in development. Click the button to simulate payment.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
    
    // Clear container and create a mock button
    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = '';
      
      // Create a styled mock PayPal button
      const mockButton = document.createElement('div');
      mockButton.setAttribute('data-paypal-mock', 'true');
      mockButton.innerHTML = `
        <div style="background-color: #f0f8ff; padding: 8px; margin-bottom: 15px; border-radius: 4px; border: 1px solid #a8d4ff;">
          <div style="font-weight: bold; margin-bottom: 5px; color: #0070ba;">DEVELOPMENT MODE</div>
          <div style="font-size: 14px;">This is a simulated PayPal flow for development.</div>
        </div>
        <button id="mock-paypal-button" style="background-color: #0070ba; color: white; border: none; border-radius: 4px; padding: 10px; width: 100%; font-weight: bold; display: flex; justify-content: center; align-items: center; cursor: pointer;">
          <span style="margin-right: 10px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20.9,8.6c-0.3-2.4-2-4.1-4.4-4.4C14.5,4,11.5,4,8.5,4.2C6.1,4.5,4.4,6.1,4.1,8.6C3.9,11.5,3.9,14.5,4.1,17.4c0.3,2.4,2,4.1,4.4,4.4c2.9,0.2,5.9,0.2,8.9,0c2.4-0.3,4.1-2,4.4-4.4c0.2-1.5,0.2-3,0.2-4.5C21.1,11.6,21.1,10.1,20.9,8.6z M17,12.7l-2.5,2.5c-0.8,0.8-2,0.8-2.8,0c-0.8-0.8-0.8-2,0-2.8l0.4-0.4c0.2-0.2,0.6-0.2,0.8,0c0.2,0.2,0.2,0.6,0,0.8L12.5,13c-0.4,0.4-0.4,1,0,1.4c0.4,0.4,1,0.4,1.4,0l2.5-2.5c0.4-0.4,0.4-1,0-1.4c-0.4-0.4-1-0.4-1.4,0l-0.3,0.3c-0.2,0.2-0.6,0.2-0.8,0c-0.2-0.2-0.2-0.6,0-0.8l0.3-0.3c0.8-0.8,2-0.8,2.8,0C17.7,10.7,17.7,12,17,12.7z M13.1,14.5l-2.5,2.5c-0.4,0.4-1,0.4-1.4,0c-0.4-0.4-0.4-1,0-1.4l2.5-2.5c0.2-0.2,0.2-0.6,0-0.8c-0.2-0.2-0.6-0.2-0.8,0l-2.5,2.5c-0.8,0.8-0.8,2,0,2.8c0.8,0.8,2,0.8,2.8,0l2.5-2.5c0.2-0.2,0.2-0.6,0-0.8C13.7,14.3,13.3,14.3,13.1,14.5z">
              </path>
            </svg>
          </span>
          Simulate PayPal Payment
        </button>
      `;
      
      container.appendChild(mockButton);
      
      // Add event listener to the mock button
      setTimeout(() => {
        const button = document.getElementById('mock-paypal-button');
        if (button) {
          button.onclick = async () => {
            setIsProcessing(true);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            try {
              // Create a mock payment result
              const mockPaymentResult = {
                transactionId: `mock-${Date.now()}`,
                amount: amount,
                method: 'paypal',
                captureId: `mock-capture-${Date.now()}`,
                status: 'COMPLETED',
                metadata: metadata || {}
              };
              
              // Update state
              setPaymentData(mockPaymentResult);
              setIsComplete(true);
              
              // Call the success callback with mock data
              if (onPaymentSuccess) {
                onPaymentSuccess(mockPaymentResult);
              }
              
              toast({
                title: 'Payment Simulated',
                description: 'Mock PayPal payment successful! This is a simulated transaction.',
                status: 'success',
                duration: 5000,
                isClosable: true,
              });
            } catch (error) {
              console.error('Mock payment simulation error:', error);
              setError('Error in payment simulation');
              
              if (onPaymentError) {
                onPaymentError(new Error('Mock payment simulation failed'));
              }
              
              toast({
                title: 'Simulation Error',
                description: 'The mock payment simulation failed.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            } finally {
              setIsProcessing(false);
            }
          };
        }
      }, 100);
    }
  };

  // Function to simulate credit card flow in development when no real credentials exist
  const simulateCreditCardFlow = async (paymentData) => {
    // Show a message about mock mode
    toast({
      title: 'Development Mode',
      description: 'Using mock Credit Card in development. Fill the form to simulate payment.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
    
    // Clear any previously rendered content
    const container = document.getElementById('card-form-container');
    if (container) {
      container.innerHTML = '';
      
      // Create a mock credit card form
      const form = document.createElement('div');
      form.setAttribute('data-paypal-mock-form', 'true');
      form.style.border = '1px solid #ddd';
      form.style.borderRadius = '4px';
      form.style.padding = '15px';
      
      // Add a development mode notice at the top
      form.innerHTML = `
        <div style="background-color: #f0f8ff; padding: 8px; margin-bottom: 15px; border-radius: 4px; border: 1px solid #a8d4ff;">
          <div style="font-weight: bold; margin-bottom: 5px; color: #0070ba;">DEVELOPMENT MODE</div>
          <div style="font-size: 14px;">This is a mock credit card form for development only.</div>
        </div>
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">Card Number</label>
          <input id="mock-card-number" type="text" placeholder="4111 1111 1111 1111" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" value="4111 1111 1111 1111">
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px;">Expiry Date</label>
            <input id="mock-expiry" type="text" placeholder="MM/YY" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" value="12/25">
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px;">CVC</label>
            <input id="mock-cvc" type="text" placeholder="123" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" value="123">
          </div>
        </div>
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">Name on Card</label>
          <input id="mock-cardholder" type="text" placeholder="John Doe" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" value="Test User">
        </div>
        <button id="mock-card-submit" style="background-color: #0070ba; color: white; border: none; border-radius: 4px; padding: 10px; width: 100%; font-weight: bold; cursor: pointer;">Process Test Payment</button>
      `;
      
      container.appendChild(form);
      
      // Add event listener for the submit button with a timeout to ensure the DOM is ready
      setTimeout(() => {
        const submitButton = document.getElementById('mock-card-submit');
        if (submitButton) {
          submitButton.addEventListener('click', async () => {
            // Get values from the form
            const cardNumber = document.getElementById('mock-card-number')?.value || '4111111111111111';
            const expiry = document.getElementById('mock-expiry')?.value || '12/25';
            const cvc = document.getElementById('mock-cvc')?.value || '123';
            const cardholder = document.getElementById('mock-cardholder')?.value || 'Test User';
            
            // Validate inputs
            if (!cardNumber || !expiry || !cvc || !cardholder) {
              toast({
                title: 'Missing Information',
                description: 'Please fill in all card details',
                status: 'warning',
                duration: 3000,
                isClosable: true,
              });
              return;
            }
            
            setIsProcessing(true);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            try {
              // Create the mock payment result
              const mockResult = {
                transactionId: paymentData.id || `mock-${Date.now()}`,
                amount: amount,
                method: 'card',
                status: 'COMPLETED',
                details: {
                  cardType: 'Visa',
                  lastFour: cardNumber.slice(-4)
                },
                metadata: metadata || {}
              };
              
              // Update state
              setPaymentData(mockResult);
              setIsComplete(true);
              
              // Call the success callback
              if (onPaymentSuccess) {
                onPaymentSuccess(mockResult);
              }
              
              // Show success message
              toast({
                title: 'Payment Simulated',
                description: `Test payment of $${amount} processed successfully with card ending in ${cardNumber.slice(-4)}`,
                status: 'success',
                duration: 5000,
                isClosable: true,
              });
            } catch (error) {
              // Show error message
              console.error('Mock card processing error:', error);
              setError('Failed to process test payment');
              
              if (onPaymentError) {
                onPaymentError(new Error('Mock card payment failed'));
              }
              
              toast({
                title: 'Simulation Error',
                description: 'The mock card payment failed.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            } finally {
              setIsProcessing(false);
            }
          });
        }
      }, 100);
    }
  };

  // Debug button to show credit card form if having issues
  const handleForceShowCardForm = async () => {
    setShowCardOption(true);
    
    if (!paymentData) {
      const paymentIntent = await createPayment();
      if (paymentIntent) {
        setTimeout(() => {
          renderCardForm(paymentIntent);
        }, 300);
      }
    } else {
      setTimeout(() => {
        renderCardForm(paymentData);
      }, 300);
    }
    
    onDebugClose();
  };

  return (
    <Stack spacing={4}>
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!showCardOption ? (
        <Box
          position="relative"
          minHeight="150px"
          borderWidth={1}
          borderColor="gray.200"
          borderRadius="md"
          p={4}
          bg="white"
        >
          {(isLoading || isInitializing) && (
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(255, 255, 255, 0.8)"
              zIndex="5"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
            >
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="lg"
                mb={2}
              />
              <Text>{isInitializing ? 'Initializing PayPal...' : 'Processing payment...'}</Text>
            </Box>
          )}
          
          <Box id="paypal-button-container" width="100%" />
          
          <Button
            colorScheme="blue"
            leftIcon={<FaPaypal />}
            onClick={handlePayPalClick}
            isLoading={isLoading}
            loadingText="Processing..."
            isDisabled={isDisabled || isInitializing || isLoading || isComplete}
            width="100%"
            mt={2}
          >
            {buttonText}
          </Button>
          
          {!isComplete && (
            <Button
              variant="outline"
              leftIcon={<FaCreditCard />}
              onClick={() => setShowCardOption(true)}
              isDisabled={isDisabled || isInitializing || isLoading || isComplete}
              width="100%"
              mt={2}
            >
              Pay with Card
            </Button>
          )}
        </Box>
      ) : (
        <Box
          position="relative"
          minHeight="250px"
          borderWidth={1}
          borderColor="gray.200"
          borderRadius="md"
          p={4}
          bg="white"
        >
          {(isLoading || isProcessing || isInitializing) && (
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(255, 255, 255, 0.8)"
              zIndex="5"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
            >
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="lg"
                mb={2}
              />
              <Text>
                {isInitializing ? 'Initializing...' : 
                 isProcessing ? 'Processing payment...' : 
                 'Loading card form...'}
              </Text>
            </Box>
          )}
          
          <Box id="card-form-container" width="100%" />
          
          {!isComplete && !isProcessing && (
            <Button
              variant="outline"
              leftIcon={<FaPaypal />}
              onClick={() => setShowCardOption(false)}
              isDisabled={isDisabled || isInitializing || isLoading || isComplete || isProcessing}
              width="100%"
              mt={2}
            >
              Back to PayPal
            </Button>
          )}
        </Box>
      )}
      
      {/* Debug Modal */}
      <Modal isOpen={isDebugOpen} onClose={onDebugClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>PayPal Debug</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={3}>
              <Box>
                <Text fontWeight="bold" mb={1}>Environment</Text>
                <Code p={2} borderRadius="md" width="100%">
                  {debugInfo.environment || 'Unknown'}
                </Code>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={1}>PayPal SDK Status</Text>
                <Code p={2} borderRadius="md" width="100%">
                  {debugInfo.sdkStatus || 'Unknown'}
                </Code>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={1}>Hosted Fields Available</Text>
                <Code p={2} borderRadius="md" width="100%">
                  {debugInfo.hostedFieldsAvailable !== undefined ? String(debugInfo.hostedFieldsAvailable) : 'Unknown'}
                </Code>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={1}>Client ID</Text>
                <Code p={2} borderRadius="md" width="100%">
                  {debugInfo.clientId || 'Not configured'}
                </Code>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={1}>Current State</Text>
                <Code p={2} borderRadius="md" width="100%">
                  isLoading: {String(isLoading)}<br/>
                  isProcessing: {String(isProcessing)}<br/>
                  isInitializing: {String(isInitializing)}<br/>
                  showCardOption: {String(showCardOption)}<br/>
                  isComplete: {String(isComplete)}
                </Code>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={1}>Form State</Text>
                <Code p={2} borderRadius="md" width="100%">
                  {debugInfo.formState || 'Unknown'}<br/>
                  Container exists: {String(debugInfo.formContainerExists)}<br/>
                  {debugInfo.domIssues && debugInfo.domIssues.length > 0 && (
                    <>Issues: {debugInfo.domIssues.join(', ')}</>
                  )}
                </Code>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={1}>Current Error</Text>
                <Code p={2} borderRadius="md" width="100%">
                  {error || 'None'}
                </Code>
              </Box>
              <Stack direction="row">
                <Button 
                  colorScheme="blue" 
                  onClick={() => {
                    const paymentIntent = paymentData || { id: 'debug-order-id' };
                    renderCardForm(paymentIntent);
                  }}
                >
                  Force Show Card Form
                </Button>
                <Button 
                  colorScheme="green" 
                  onClick={() => {
                    if (process.env.NODE_ENV === 'development') {
                      const mockPaymentIntent = { id: 'debug-mock-order-id' };
                      simulateCreditCardFlow(mockPaymentIntent);
                    } else {
                      toast({
                        title: "Not Available",
                        description: "Mock card form is only available in development mode",
                        status: "warning",
                        duration: 3000,
                        isClosable: true,
                      });
                    }
                  }}
                >
                  Show Mock Card Form
                </Button>
              </Stack>
              <Button 
                colorScheme="purple" 
                onClick={() => {
                  const info = createDebugInfo();
                  setDebugInfo(info);
                  
                  toast({
                    title: "Debug Info Updated",
                    description: "Latest information has been gathered",
                    status: "info",
                    duration: 2000,
                    isClosable: true,
                  });
                }}
              >
                Refresh Debug Info
              </Button>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onDebugClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
};

export default PayPalPaymentButton; 