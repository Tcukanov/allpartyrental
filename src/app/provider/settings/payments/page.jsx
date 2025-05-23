'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Divider, 
  Stack, 
  Card, 
  CardBody, 
  Badge, 
  Alert, 
  AlertIcon, 
  AlertTitle,
  AlertDescription,
  Spinner,
  Button,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  VStack,
  HStack,
  Link,
  Image, 
  ListItem, 
  UnorderedList,
  SimpleGrid,
  Tag,
  Checkbox,
  Switch,
  Center,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Flex,
  Icon
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import SettingsLayout from '@/components/provider/SettingsLayout';
import PayPalConnectButton from '@/components/provider/PayPalConnectButton';
import { 
  FaPaypal, 
  FaCog, 
  FaExclamationCircle, 
  FaWrench, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaBusinessTime,
  FaDollarSign
} from 'react-icons/fa';

export default function PaymentsSettingsPage() {
  const searchParams = useSearchParams();
  const [paypalStatus, setPaypalStatus] = useState({
    loading: true,
    connected: false,
    details: null,
    error: null
  });
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentAlert, setPaymentAlert] = useState(null);
  const [accountIdInput, setAccountIdInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [useSandbox, setUseSandbox] = useState(true);

  // Get query parameters from searchParams - ensure they're accessed safely
  const success = searchParams?.get('success');
  const errorParam = searchParams?.get('error');
  const platformError = searchParams?.get('platform_error');

  // Check for success or error in the URL query params
  useEffect(() => {
    if (success) {
      toast({
        title: 'Success',
        description: 'Your PayPal account has been connected successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Check and save the account ID
      checkPayPalAccount();
    } else if (errorParam) {
      toast({
        title: 'Error',
        description: `Error connecting to PayPal: ${errorParam}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else if (platformError) {
      setPaymentAlert({
        status: 'error',
        title: 'Platform Setup Required',
        message: 'The PayPal platform requires additional setup.',
        details: 'Admin instructions: Complete the PayPal developer account setup for marketplace integrations.'
      });
    }
  }, [success, errorParam, platformError, toast]);

  // Separate useEffect for URL cleanup to avoid state updates during render
  useEffect(() => {
    if (success || errorParam || platformError) {
      // Use setTimeout instead of requestAnimationFrame to ensure it runs after render is complete
      setTimeout(() => {
        const url = new URL(window.location);
        url.search = '';
        window.history.replaceState({}, '', url);
      }, 0);
    }
  }, [success, errorParam, platformError]);

  // Check PayPal connection status on load
  useEffect(() => {
    checkPayPalStatus();
  }, []);

  const checkPayPalStatus = async () => {
    setIsLoading(true);
    try {
      // Add sandbox parameter to API call
      const response = await fetch(`/api/provider/paypal/status?sandbox=${useSandbox}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to check PayPal status');
      }
      
      const data = await response.json();
      setPaypalStatus({
        loading: false,
        connected: data.connected,
        details: data.connected ? data : null,
        error: data.error || null
      });
      
      if (data.connected && data.status === 'ACTIVE') {
        setPaymentAlert({
          status: 'success',
          title: 'PayPal Connected',
          message: `Your PayPal ${useSandbox ? 'Sandbox' : ''} account is fully set up and ready to receive payments.`,
        });
      } else if (data.connected) {
        setPaymentAlert({
          status: 'warning',
          title: 'PayPal account needs attention',
          message: `Your PayPal ${useSandbox ? 'Sandbox' : ''} account setup is not complete. Please complete the onboarding process to start accepting payments.`,
        });
      } else {
        setPaymentAlert({
          status: 'info',
          title: 'PayPal Not Connected',
          message: `Connect your PayPal ${useSandbox ? 'Sandbox' : ''} account to receive payments for your services.`,
        });
      }
    } catch (error) {
      console.error('Error checking PayPal status:', error);
      setPaymentAlert({
        status: 'error',
        title: 'Connection Error',
        message: `Failed to check PayPal status: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkPayPalAccount = async () => {
    try {
      // Add sandbox parameter to API call
      const response = await fetch(`/api/provider/paypal/account-check?sandbox=${useSandbox}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check account');
      }

      await checkPayPalStatus();
    } catch (error) {
      console.error('Error checking account:', error);
      toast({
        title: 'Error',
        description: `Failed to verify account: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRefreshStatus = () => {
    checkPayPalStatus();
    toast({
      title: 'Refreshing',
      description: 'Checking your PayPal connection status...',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleViewDashboard = () => {
    // Open PayPal dashboard in a new tab - use sandbox URL if in sandbox mode
    const dashboardUrl = useSandbox ? 
      'https://www.sandbox.paypal.com/dashboard' : 
      'https://www.paypal.com/dashboard';
    window.open(dashboardUrl, '_blank');
    toast({
      title: 'Opening Dashboard',
      description: `Redirecting to your PayPal ${useSandbox ? 'Sandbox' : ''} dashboard`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleManualAccountUpdate = async (e) => {
    e.preventDefault();
    if (!accountIdInput) {
      toast({
        title: 'Error',
        description: 'Please enter a valid PayPal email or merchant ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      console.log(`Submitting manual PayPal update with email: ${accountIdInput} (Sandbox: ${useSandbox})`);

      const response = await fetch(`/api/provider/paypal/manual-account-update?sandbox=${useSandbox}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paypalEmail: accountIdInput,
          isBusinessAccount: true,  // Mark manual connections as business accounts
          sandbox: useSandbox
        }),
      });

      // First check if the response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Manual PayPal update error:', errorText);
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Error ${response.status}: Failed to update account`);
        } catch (parseError) {
          // If can't parse, use text directly
          throw new Error(`Server returned: ${errorText.substring(0, 100)}...`);
        }
      }

      // Now parse the successful response
      const data = await response.json();

      toast({
        title: 'Success',
        description: `Your PayPal ${useSandbox ? 'Sandbox' : ''} business account has been connected`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset the input and refresh status
      setAccountIdInput('');
      await checkPayPalStatus();
    } catch (err) {
      console.error('PayPal account update error:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'PENDING':
        return 'yellow';
      case 'RESTRICTED':
      case 'UNDER_REVIEW':
        return 'orange';
      case 'INACTIVE':
      case 'REJECTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Add this function to check if PayPal account is business account
  const isBusinessAccount = () => {
    return paypalStatus.details?.accountType === 'BUSINESS' || 
      paypalStatus.details?.merchantId?.startsWith('BUS-');
  };

  return (
    <SettingsLayout>
      <Stack spacing={6}>
        <Box>
          <Heading size="lg" mb={4}>Payment Settings</Heading>
          <Text>
            Connect your PayPal business account to receive payments from clients.
            {useSandbox && <Badge ml={2} colorScheme="blue">Sandbox Mode</Badge>}
          </Text>
        </Box>

        {paymentAlert && (
          <Alert status={paymentAlert.status} variant="left-accent">
            <AlertIcon />
            <Box>
              <AlertTitle>{paymentAlert.title}</AlertTitle>
              <AlertDescription>
                {paymentAlert.message}
                {paymentAlert.details && (
                  <Text mt={2} fontSize="sm" color="gray.600">
                    {paymentAlert.details}
                  </Text>
                )}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Flex flexDirection={{ base: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" gap={4}>
                <Box>
                  <Heading size="md" display="flex" alignItems="center">
                    <FaPaypal style={{ marginRight: '8px' }} /> PayPal {useSandbox && "Sandbox"} Business Integration
                  </Heading>
                  <Text mt={1} color="gray.600">
                    Connect your PayPal {useSandbox && "Sandbox"} business account to receive payments
                  </Text>
                </Box>
                <HStack>
                  {paypalStatus.connected && (
                    <Badge 
                      colorScheme={getBadgeColor(paypalStatus.details?.status)} 
                      fontSize="0.8em" 
                      p={2} 
                      borderRadius="md"
                    >
                      {paypalStatus.details?.status || 'CONNECTED'}
                    </Badge>
                  )}
                  {isBusinessAccount() && (
                    <Tag size="sm" colorScheme="blue" borderRadius="full">
                      <HStack spacing={1}>
                        <FaBusinessTime />
                        <Text>Business</Text>
                      </HStack>
                    </Tag>
                  )}
                  {useSandbox && (
                    <Tag size="sm" colorScheme="purple" borderRadius="full">
                      <Text>Sandbox</Text>
                    </Tag>
                  )}
                </HStack>
              </Flex>

              {isLoading ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" />
                  <Text mt={2}>Checking PayPal connection...</Text>
                </Box>
              ) : (
                <>
                  {paypalStatus.connected ? (
                    <Box>
                      <HStack spacing={4} wrap="wrap">
                        <Button size="sm" onClick={handleRefreshStatus} leftIcon={<FaCog />}>
                          Refresh Status
                        </Button>
                        <Button size="sm" onClick={handleViewDashboard} leftIcon={<FaPaypal />}>
                          PayPal Dashboard
                        </Button>
                        <Button 
                          as="a" 
                          href={useSandbox ? "https://www.sandbox.paypal.com/businessapp/transactions" : "https://www.paypal.com/businessapp/transactions"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          size="sm" 
                          variant="outline"
                        >
                          View Transactions
                        </Button>
                      </HStack>
                      
                      <Divider my={4} />
                      
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Card variant="outline" p={4}>
                          <Heading size="sm" mb={3}>Account Information</Heading>
                          <VStack align="flex-start" spacing={2}>
                            {paypalStatus.details?.email && (
                              <HStack>
                                <Text fontWeight="bold">PayPal Email:</Text>
                                <Text>{paypalStatus.details.email}</Text>
                              </HStack>
                            )}
                            {paypalStatus.details?.merchantId && (
                              <HStack>
                                <Text fontWeight="bold">Merchant ID:</Text>
                                <Text>{paypalStatus.details.merchantId}</Text>
                              </HStack>
                            )}
                            <HStack>
                              <Text fontWeight="bold">Account Type:</Text>
                              <Text>{isBusinessAccount() ? 'Business' : 'Personal'}</Text>
                              {!isBusinessAccount() && (
                                <Popover>
                                  <PopoverTrigger>
                                    <Icon as={FaInfoCircle} color="orange.500" cursor="pointer" />
                                  </PopoverTrigger>
                                  <PopoverContent>
                                    <PopoverArrow />
                                    <PopoverCloseButton />
                                    <PopoverHeader fontWeight="bold">Business Account Recommended</PopoverHeader>
                                    <PopoverBody>
                                      For receiving marketplace payments, a PayPal Business account is strongly recommended. 
                                      Personal accounts have transaction limits and fewer features.
                                    </PopoverBody>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </HStack>
                            <HStack>
                              <Text fontWeight="bold">Connected:</Text>
                              <Text>{new Date(paypalStatus.details?.createdAt).toLocaleString()}</Text>
                            </HStack>
                            <HStack>
                              <Text fontWeight="bold">Environment:</Text>
                              <Text>{useSandbox ? 'Sandbox' : 'Production'}</Text>
                            </HStack>
                          </VStack>
                        </Card>
                        
                        <Card variant="outline" p={4}>
                          <Heading size="sm" mb={3}>Payment Settings</Heading>
                          <VStack align="flex-start" spacing={3}>
                            <HStack width="100%" justifyContent="space-between">
                              <Text>Automatic payouts</Text>
                              <Switch isChecked={true} isReadOnly />
                            </HStack>
                            <HStack width="100%" justifyContent="space-between">
                              <Text>Email notifications</Text>
                              <Switch isChecked={true} isReadOnly />
                            </HStack>
                            <Link 
                              as={NextLink} 
                              href="/provider/payments/dashboard" 
                              color="blue.500"
                            >
                              View Payment Dashboard
                            </Link>
                          </VStack>
                        </Card>
                      </SimpleGrid>
                    </Box>
                  ) : (
                    <>
                      <Alert status="info" variant="subtle" mb={4}>
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Business Account Required</AlertTitle>
                          <AlertDescription>
                            A PayPal Business account is required to receive payments on our platform. 
                            If you don't have one, you can create it during the connection process.
                            {useSandbox && (
                              <Text mt={2} fontWeight="semibold">
                                Using Sandbox mode - connect with a PayPal Sandbox business account.
                              </Text>
                            )}
                          </AlertDescription>
                        </Box>
                      </Alert>
                      
                      <Box my={4}>
                        <Text mb={4}>
                          Connect your PayPal {useSandbox && "Sandbox"} business account to receive payments from customers directly to your account.
                        </Text>
                        <PayPalConnectButton sandbox={useSandbox} />
                      </Box>
                      
                      <Card bg="gray.50" my={4} p={4}>
                        <Heading size="sm" mb={3}>Benefits of PayPal Business</Heading>
                        <UnorderedList spacing={2} pl={4}>
                          <ListItem>Accept credit card payments worldwide</ListItem>
                          <ListItem>Detailed transaction reporting</ListItem>
                          <ListItem>Automatic payment transfers</ListItem>
                          <ListItem>Professional invoicing capabilities</ListItem>
                        </UnorderedList>
                      </Card>
                    </>
                  )}

                  <Accordion allowToggle mt={4}>
                    <AccordionItem>
                      <h2>
                        <AccordionButton>
                          <Box flex="1" textAlign="left" display="flex" alignItems="center">
                            <FaWrench style={{ marginRight: '8px' }} />
                            Manual Business Account Setup
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <Text mb={4} fontSize="sm" color="gray.600">
                          If the automatic connection isn't working, you can manually enter your PayPal {useSandbox && "Sandbox"} business email address.
                          {useSandbox && (
                            <Text as="span" fontWeight="semibold"> Using luftphoto@gmail.com for Sandbox testing.</Text>
                          )}
                        </Text>
                        <form onSubmit={handleManualAccountUpdate}>
                          <FormControl id="paypalEmail" isRequired mb={4}>
                            <FormLabel>PayPal {useSandbox && "Sandbox"} Business Email Address</FormLabel>
                            <Input 
                              type="email" 
                              value={accountIdInput || (useSandbox ? 'luftphoto@gmail.com' : '')}
                              onChange={(e) => setAccountIdInput(e.target.value)}
                              placeholder={useSandbox ? "luftphoto@gmail.com" : "business@example.com"}
                            />
                          </FormControl>
                          <FormControl display="flex" alignItems="center" mb={4}>
                            <FormLabel htmlFor="is-business" mb="0">
                              This is a PayPal Business account
                            </FormLabel>
                            <Checkbox id="is-business" defaultChecked={true} isReadOnly />
                          </FormControl>
                          {error && (
                            <Alert status="error" mb={4}>
                              <AlertIcon />
                              <AlertDescription fontSize="sm">{error}</AlertDescription>
                            </Alert>
                          )}
                          <Button type="submit" colorScheme="blue" isLoading={isUpdating}>
                            Connect Business Account
                          </Button>
                        </form>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </>
              )}
            </VStack>
          </CardBody>
        </Card>

        {paypalStatus.connected && (
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>PayPal Business Resources</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Button 
                  as="a" 
                  href={useSandbox ? 
                    "https://www.sandbox.paypal.com/businessapp/reporting/statements" : 
                    "https://www.paypal.com/businessapp/reporting/statements"
                  } 
                  target="_blank" 
                  rel="noopener noreferrer"
                  leftIcon={<FaDollarSign />}
                  variant="outline"
                >
                  Monthly Statements
                </Button>
                <Button 
                  as="a" 
                  href={useSandbox ? 
                    "https://www.sandbox.paypal.com/businessapp/products/website-payments" : 
                    "https://www.paypal.com/businessapp/products/website-payments"
                  } 
                  target="_blank" 
                  rel="noopener noreferrer"
                  leftIcon={<FaCog />}
                  variant="outline"
                >
                  Payment Settings
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>
        )}
      </Stack>
    </SettingsLayout>
  );
} 