import { useState, useEffect } from 'react';
import { Button, Box, Text, useToast, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Stack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Code, useDisclosure } from '@chakra-ui/react';
import { FaPaypal, FaCreditCard, FaBug } from 'react-icons/fa';
import CardEntryForm from './CardEntryForm';

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
  const [useCustomCardForm, setUseCustomCardForm] = useState(false);
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
        // Always get client ID from the server - ensures we use sandbox credentials
        let clientId;
        
        try {
          const response = await fetch('/api/payment/config');
          if (response.ok) {
            const data = await response.json();
            clientId = data.clientId;
            console.log(`Loading PayPal SDK with client ID: ${clientId ? clientId.substring(0, 5) + '...' : 'none'}`);
          } else {
            throw new Error('Failed to fetch PayPal config from server');
          }
        } catch (configError) {
          console.error('Error fetching PayPal config:', configError);
          // Fallback to environment variable
          clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
          if (!clientId) {
            throw new Error('PayPal client ID is not available');
          }
        }

        const script = document.createElement('script');
        
        // Clean and encode the client ID
        const cleanClientId = clientId.trim().replace(/\s+/g, '');
        const encodedClientId = encodeURIComponent(cleanClientId);
        
        // List of components to include - we need buttons at minimum
        const components = ['buttons'];
        
        // Optional components if we want to support card payments
        if (showCardByDefault) {
          components.push('hosted-fields');
        }
        
        // Build the SDK URL
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodedClientId}&currency=USD&components=${components.join(',')}&intent=capture&debug=false&integration-date=2023-05-01`;
        script.async = true;
        
        // Create a promise that resolves when the script loads
        const loadPromise = new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("PayPal SDK loaded successfully");
            
            // Verify components are available
            if (window.paypal && window.paypal.HostedFields) {
              console.log("PayPal HostedFields component available");
            } else {
              console.warn("PayPal HostedFields component not available");
            }
            
            setIsInitializing(false);
            resolve();
          };
          
          script.onerror = (err) => {
            console.error('Failed to load PayPal SDK:', err);
            setError('PayPal payment is not available at this time. Please try again later.');
            setIsInitializing(false);
            
            // Fall back to buttons-only if available
            if (window.paypal && window.paypal.Buttons) {
              console.log("SDK partially loaded, falling back to PayPal buttons only");
              resolve();
            } else {
              reject(err);
            }
          };
        });
        
        // Add the script to the document
        document.body.appendChild(script);
        
        // Wait for the script to load
        await loadPromise;
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
    
    // Don't check for eligibility - we'll attempt to use hosted fields regardless
    // This makes the credit card payment option always available
    const isDeviceEligible = true;
    
    // When the PayPal SDK is loaded, create the payment intent
    const initCardPayment = async () => {
      try {
        setIsLoading(true);
        
        // Create the payment intent
        const paymentIntent = await createPayment();
        if (paymentIntent) {
          // Only show card option if device is eligible
          if (isDeviceEligible) {
            setShowCardOption(true);
            
            // Give it a moment to update state before rendering
            setTimeout(() => {
              renderCardForm(paymentIntent);
            }, 300);
          } else {
            // Device not eligible, show PayPal button only
            console.log("Device not eligible for PayPal Hosted Fields, showing PayPal button only");
            setShowCardOption(false);
            
            // Wait for state update to complete before rendering PayPal button
            setTimeout(() => {
              renderPayPalButton(paymentIntent);
            }, 500);
          }
        }
      } catch (error) {
        console.error("Error initializing card payment:", error);
        setError("Failed to initialize payment: " + error.message);
        setShowCardOption(false); // Fall back to PayPal button
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only run this once when the SDK is ready
    if (isPayPalReady && !paymentData) {
      console.log("PayPal SDK ready, initializing payment flow");
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
      
      // If we're trying to show card option but it fails, fall back to PayPal button
      if (showCardOption) {
        setShowCardOption(false);
        console.log("Falling back to PayPal button due to card initialization error");
      }
      
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
    
    // Use a small timeout to ensure the container is ready
    // This helps with the state change from card to PayPal
    setTimeout(() => {
      // Check if container exists
      const container = document.getElementById('paypal-button-container');
      if (!container) {
        console.error('PayPal button container not found in DOM');
        setError('Payment initialization error. Please try again.');
        return;
      }

      // Clear any previously rendered buttons
      container.innerHTML = '';
      
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
    }, 300); // Short delay to ensure DOM is ready
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
  const renderCardForm = async (paymentIntent) => {
    console.log("Attempting to render hosted fields with order ID:", paymentIntent.id);
    
    if (!window.paypal || !window.paypal.HostedFields) {
      console.error("PayPal SDK or HostedFields not available");
      setError("Card processing is not available at this time");
      return;
    }
    
    // Get client ID from server - ensures we use proper sandbox credentials
    let clientId;
    try {
      const response = await fetch('/api/payment/config');
      if (response.ok) {
        const data = await response.json();
        clientId = data.clientId;
        console.log(`Using PayPal client ID: ${clientId ? clientId.substring(0, 5) + '...' : 'none'}`);
      } else {
        throw new Error('Failed to load PayPal config');
      }

      if (!clientId) {
        throw new Error('PayPal client ID not available');
      }
    } catch (error) {
      console.error("Error fetching PayPal client ID:", error);
      setError("Payment configuration error. Please try again later.");
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
      setTimeout(async () => {
        try {
          console.log("Initializing hosted fields with orderId:", paymentIntent.id);
          
          // Device eligibility is already checked in the useEffect
          console.log("Initializing PayPal Hosted Fields");
          
          // Render hosted fields
          const hostedFields = await window.paypal.HostedFields.render({
            // Send client ID as authorization instead of order ID
            createOrder: function() {
              return paymentIntent.id;
            },
            // Required - must be set to order.id for authorization
            orderId: paymentIntent.id,
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
          });
            
          console.log("Hosted fields rendered successfully");
          
          // Add event listener to submit button
          const submitButton = document.getElementById('submit-card');
          if (submitButton) {
            submitButton.addEventListener('click', async () => {
              handleCardSubmission(hostedFields, paymentIntent);
            });
          }
        } catch (err) {
          console.error('Hosted fields render error:', err);
          
          // Use our custom card form instead of PayPal's hosted fields
          if (err.message.includes('not eligible') || err.message.includes('authorization')) {
            console.log("Using custom card entry form instead of PayPal Hosted Fields");
            
            // Clear any error message
            setError(null);
            
            // Render our custom card form
            // This will be handled by React since we're using JSX components instead of innerHTML
            const formContainer = document.getElementById('card-form-container');
            if (formContainer) {
              // We need to empty the container first
              while (formContainer.firstChild) {
                formContainer.removeChild(formContainer.firstChild);
              }
              
              // The CardEntryForm component will be rendered by React in the return statement,
              // so we'll set a state to indicate we should use our custom form
              setUseCustomCardForm(true);
            }
          } else {
            setError(`Failed to initialize card fields: ${err.message}`);
          }
        }
      }, 500); // Increased timeout for better DOM readiness
    } catch (error) {
      console.error('Error setting up hosted fields:', error);
      console.error("Error setting up hosted fields:", error);
      setError(`Failed to set up card fields: ${error.message}`);
      
      // Fall back to PayPal button
      setShowCardOption(false);
      console.log("Falling back to PayPal button due to card field initialization error");
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

  // No simulation - always use real PayPal sandbox
  const simulatePayPalFlow = (paymentData) => {
    console.error('PayPal simulation is disabled - always use real PayPal sandbox');
    setError('PayPal integration requires sandbox credentials. Please check your configuration.');
    
    // Re-render the real PayPal button
    renderPayPalButton(paymentData);
  };

  // No simulation - always use real PayPal sandbox credentials
  const simulateCreditCardFlow = async (paymentData) => {
    console.error('Credit card simulation is disabled - always use real PayPal sandbox credentials');
    setError('Credit card processing requires PayPal sandbox credentials. Please check your configuration.');
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

  // Handle direct card entry form submission
  const handleDirectCardSubmit = (cardData) => {
    setIsProcessing(true);
    
    console.log("Processing card payment with custom form");
    console.log("Card data (last 4):", cardData.cardNumber.slice(-4));
    
    // Send card data to the server for processing
    fetch('/api/payment/process-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardData,
        amount,
        orderId: paymentData?.id || "sandbox_" + Math.random().toString(36).substring(2, 10),
        metadata
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        const paymentResult = {
          transactionId: result.data.transactionId,
          amount: amount,
          method: 'card',
          details: {
            lastFour: cardData.cardNumber.slice(-4),
            cardType: result.data.paymentDetails?.cardType || 'Card'
          },
          metadata: metadata || {}
        };
        
        setPaymentData(paymentResult);
        setIsComplete(true);
        
        // Call success callback
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentResult);
        }
        
        toast({
          title: "Payment Successful",
          description: `Payment of $${amount} processed successfully`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    })
    .catch(error => {
      console.error("Card payment error:", error);
      setError(error.message || 'Payment processing failed');
      
      if (onPaymentError) {
        onPaymentError(error);
      }
      
      toast({
        title: "Payment Failed",
        description: error.message || 'Payment processing failed',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    })
    .finally(() => {
      setIsProcessing(false);
    });
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
          
          {/* Manual button as fallback in case automatic rendering fails */}
          {error && (
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
          )}
          
          {!isComplete && !error && (
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
          
          {/* Container for PayPal hosted fields */}
          <Box id="card-form-container" width="100%" />
          
          {/* Our custom card form - shown when PayPal hosted fields aren't available */}
          {useCustomCardForm && !isProcessing && !isComplete && (
            <CardEntryForm onSubmit={handleDirectCardSubmit} isProcessing={isProcessing} />
          )}
          
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