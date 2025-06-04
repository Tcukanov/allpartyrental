'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProviderLayout from '../../components/ProviderLayout';

export default function PayPalSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [isLoading, setIsLoading] = useState(true);
  const [paypalStatus, setPaypalStatus] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Check for callback status
  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    if (status === 'success') {
      toast({
        title: 'PayPal Connected Successfully!',
        description: 'Your PayPal account has been connected. You can now receive payments.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } else if (status === 'failed') {
      toast({
        title: 'PayPal Connection Failed',
        description: 'There was an issue connecting your PayPal account. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else if (status === 'error') {
      toast({
        title: 'Connection Error',
        description: message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    // Clear URL parameters
    if (status) {
      router.replace('/provider/dashboard/paypal');
    }
  }, [searchParams, toast, router]);

  // Load PayPal status from API
  useEffect(() => {
    if (session?.user?.id) {
      fetchProviderData();
    }
  }, [session]);

  const fetchProviderData = async () => {
    try {
      const response = await fetch('/api/provider/profile');
      if (response.ok) {
        const data = await response.json();
        const provider = data.provider;
        
        // Handle case where provider record doesn't exist yet
        if (!provider) {
          setPaypalStatus({
            isConnected: false,
            merchantId: null,
            email: null,
            onboardingStatus: 'NOT_STARTED',
            canReceivePayments: false,
            issues: []
          });
        } else {
          setPaypalStatus({
            isConnected: !!provider.paypalMerchantId,
            merchantId: provider.paypalMerchantId,
            email: provider.paypalEmail,
            onboardingStatus: provider.paypalOnboardingStatus || 'NOT_STARTED',
            canReceivePayments: provider.paypalCanReceivePayments || false,
            issues: provider.paypalStatusIssues ? JSON.parse(provider.paypalStatusIssues) : []
          });
        }
        
        // Pre-fill form with user data
        setFormData({
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          email: session.user.email || ''
        });
      } else {
        console.error('Failed to fetch provider data');
        toast({
          title: 'Error Loading Data',
          description: 'Failed to load your provider information.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConnect = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/paypal/onboard-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create onboarding link');
      }

      if (data.success && data.data.onboardingUrl) {
        // Check if manual sync is required (localhost development)
        if (data.data.instructions?.requiresManualSync) {
          toast({
            title: 'Development Mode Instructions',
            description: data.data.instructions.message,
            status: 'info',
            duration: 10000,
            isClosable: true,
          });
        }
        
        // Redirect to PayPal onboarding
        window.location.href = data.data.onboardingUrl;
      } else {
        throw new Error('No onboarding URL received');
      }
      
    } catch (error) {
      console.error('PayPal onboarding error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to start PayPal onboarding process.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleDisconnect = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Disconnecting your PayPal account will prevent you from offering PayPal services and products on your website. Do you wish to continue?'
    );
    
    if (!confirmed) return;

    try {
      // API call to disconnect PayPal account
      // This would clear the PayPal merchant ID and related fields
      toast({
        title: 'PayPal Disconnected',
        description: 'Your PayPal account has been disconnected.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Update local state
      setPaypalStatus(prev => ({
        ...prev,
        isConnected: false,
        merchantId: null,
        email: null,
        onboardingStatus: 'NOT_STARTED',
        canReceivePayments: false,
        issues: []
      }));
      
    } catch (error) {
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect PayPal account. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/paypal/refresh-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to refresh status');
      }

      if (data.success) {
        // Update local state with refreshed data
        setPaypalStatus(prev => ({
          ...prev,
          merchantId: data.data.merchantId,
          email: data.data.email,
          canReceivePayments: data.data.canReceivePayments,
          onboardingStatus: data.data.onboardingStatus,
          issues: data.data.issues
        }));

        if (data.data.canReceivePayments) {
          toast({
            title: 'Payment Processing Enabled!',
            description: 'Your PayPal account is now ready to receive payments.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Status Updated',
            description: 'PayPal status refreshed. Please complete any required actions.',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }

        // Refresh the full provider data
        await fetchProviderData();
      }
      
    } catch (error) {
      console.error('Refresh status error:', error);
      toast({
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh PayPal status.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!paypalStatus) {
    return (
      <ProviderLayout>
        <Container maxW="container.lg" py={8}>
          <Box textAlign="center">
            <Spinner size="xl" />
            <Text mt={4}>Loading PayPal settings...</Text>
          </Box>
        </Container>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>PayPal Payment Settings</Heading>
            <Text color="gray.600">
              Connect your PayPal account to receive payments from customers.
            </Text>
          </Box>

          {/* Connection Status */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="semibold">Connection Status</Text>
                  <Badge 
                    colorScheme={paypalStatus.isConnected ? 'green' : 'gray'}
                    size="lg"
                  >
                    {paypalStatus.isConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </HStack>

                {paypalStatus.isConnected && (
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                        Merchant ID:
                      </Text>
                      <Text fontSize="sm" fontFamily="mono" color="gray.800">
                        {paypalStatus.merchantId}
                      </Text>
                    </HStack>
                    {paypalStatus.email && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">
                          PayPal Email:
                        </Text>
                        <Text fontSize="sm" color="gray.800">
                          {paypalStatus.email}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                )}

                {/* Status Issues */}
                {paypalStatus.issues && paypalStatus.issues.length > 0 && (
                  <VStack spacing={3} align="stretch">
                    {paypalStatus.issues.map((issue, index) => (
                      <Alert key={index} status="warning">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Attention Required!</AlertTitle>
                          <AlertDescription>{issue.message}</AlertDescription>
                        </Box>
                      </Alert>
                    ))}
                  </VStack>
                )}

                {/* Pending Onboarding Instructions */}
                {!paypalStatus.isConnected && paypalStatus.onboardingStatus === 'PENDING' && (
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Onboarding Completed!</AlertTitle>
                      <AlertDescription>
                        You've successfully completed PayPal onboarding. Click "Refresh Status" below to sync your connection and enable payments.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {/* Action Buttons */}
                <HStack spacing={4}>
                  {!paypalStatus.isConnected ? (
                    <>
                      {paypalStatus.onboardingStatus === 'PENDING' ? (
                        <>
                          <Button
                            colorScheme="green"
                            size="lg"
                            onClick={handleRefreshStatus}
                            isLoading={isLoading}
                            loadingText="Syncing..."
                          >
                            Refresh Status
                          </Button>
                          <Button
                            colorScheme="blue"
                            variant="outline"
                            onClick={onOpen}
                          >
                            Start New Onboarding
                          </Button>
                        </>
                      ) : (
                        <Button
                          colorScheme="blue"
                          size="lg"
                          onClick={onOpen}
                          isLoading={isLoading}
                        >
                          Connect PayPal Account
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        colorScheme="green"
                        onClick={handleRefreshStatus}
                        isLoading={isLoading}
                        loadingText="Refreshing..."
                      >
                        Refresh Status
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDisconnect}
                      >
                        Disconnect Account
                      </Button>
                      <Button
                        colorScheme="blue"
                        onClick={onOpen}
                      >
                        Reconnect Account
                      </Button>
                    </>
                  )}
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Payment Capabilities */}
          {paypalStatus.isConnected && (
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text fontSize="lg" fontWeight="semibold">Payment Capabilities</Text>
                  
                  <HStack justify="space-between">
                    <Text>Receive Payments</Text>
                    <Badge colorScheme={paypalStatus.canReceivePayments ? 'green' : 'red'}>
                      {paypalStatus.canReceivePayments ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </HStack>

                  {!paypalStatus.canReceivePayments && (
                    <VStack spacing={3} align="stretch">
                      <Alert status="warning">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Payment Processing Disabled</AlertTitle>
                          <AlertDescription>
                            Your PayPal account is connected but cannot receive payments yet.
                          </AlertDescription>
                        </Box>
                      </Alert>
                      
                      <Alert status="info">
                        <AlertIcon />
                        <AlertDescription>
                          <strong>To enable payments:</strong>
                          <br />
                          1. Click "Refresh Status" to check your current PayPal account status
                          <br />
                          2. If you're using a sandbox account, payments should be enabled automatically
                          <br />
                          3. For live accounts, ensure your PayPal business account is fully verified
                        </AlertDescription>
                      </Alert>
                    </VStack>
                  )}

                  {paypalStatus.canReceivePayments && (
                    <Alert status="success">
                      <AlertIcon />
                      <AlertDescription>
                        Your PayPal account is ready to receive payments from customers.
                      </AlertDescription>
                    </Alert>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}

        </VStack>

        {/* Connect Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Connect PayPal Account</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text fontSize="sm" color="gray.600">
                  Please provide your information to connect your PayPal account.
                </Text>
                
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleConnect}
                isLoading={isLoading}
                loadingText="Connecting..."
              >
                Connect PayPal
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </ProviderLayout>
  );
} 