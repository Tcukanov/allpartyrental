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
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Code
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DeleteIcon, AddIcon, RepeatIcon } from '@chakra-ui/icons';

export default function WebhooksAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [isLoading, setIsLoading] = useState(true);
  const [webhooks, setWebhooks] = useState([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Check admin access
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      toast({
        title: 'Access Denied',
        description: 'Admin access required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
      return;
    }

    loadWebhooks();
  }, [session, status, router, toast]);

  const loadWebhooks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/paypal/webhooks/manage');
      const data = await response.json();

      if (data.success) {
        setWebhooks(data.data.webhooks || []);
      } else {
        throw new Error(data.error || 'Failed to load webhooks');
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
      toast({
        title: 'Error Loading Webhooks',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: 'Missing URL',
        description: 'Please enter a webhook URL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/paypal/webhooks/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookUrl }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Webhook Created',
          description: 'PayPal webhook created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setWebhookUrl('');
        onClose();
        loadWebhooks();
      } else {
        throw new Error(data.error || 'Failed to create webhook');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Error Creating Webhook',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteWebhook = async (webhookId) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      const response = await fetch(`/api/paypal/webhooks/manage?id=${webhookId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Webhook Deleted',
          description: 'PayPal webhook deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadWebhooks();
      } else {
        throw new Error(data.error || 'Failed to delete webhook');
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'Error Deleting Webhook',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getRecommendedWebhookUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/paypal/webhooks`;
  };

  if (status === 'loading' || isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading webhooks...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>PayPal Webhooks Management</Heading>
          <Text color="gray.600">
            Manage PayPal webhooks for real-time notifications about seller onboarding and payment events.
          </Text>
        </Box>

        {/* Webhook Information */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">What are PayPal Webhooks?</Heading>
              <Text fontSize="sm" color="gray.600">
                Webhooks are real-time notifications that PayPal sends to your server when important events happen:
              </Text>
              <VStack spacing={2} align="stretch" pl={4}>
                <Text fontSize="sm">• <strong>MERCHANT.PARTNER-CONSENT.REVOKED</strong> - When a provider revokes platform permissions</Text>
                <Text fontSize="sm">• <strong>CUSTOMER.MERCHANT-INTEGRATION.PRODUCT-SUBSCRIPTION-UPDATED</strong> - When provider capabilities change</Text>
                <Text fontSize="sm">• <strong>PAYMENT.CAPTURE.COMPLETED</strong> - When payments are successfully captured</Text>
                <Text fontSize="sm">• <strong>PAYMENT.CAPTURE.DENIED</strong> - When payment capture fails</Text>
              </VStack>
              
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Recommended Webhook URL:</AlertTitle>
                  <AlertDescription>
                    <Code>{getRecommendedWebhookUrl()}</Code>
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </CardBody>
        </Card>

        {/* Actions */}
        <HStack spacing={4}>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={onOpen}
          >
            Create Webhook
          </Button>
          <Button
            leftIcon={<RepeatIcon />}
            variant="outline"
            onClick={loadWebhooks}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </HStack>

        {/* Webhooks List */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Active Webhooks ({webhooks.length})</Heading>
              
              {webhooks.length === 0 ? (
                <Alert status="warning">
                  <AlertIcon />
                  <AlertDescription>
                    No webhooks configured. Create a webhook to receive real-time notifications from PayPal.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Webhook ID</Th>
                      <Th>URL</Th>
                      <Th>Event Types</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {webhooks.map((webhook) => (
                      <Tr key={webhook.id}>
                        <Td>
                          <Code fontSize="sm">{webhook.id}</Code>
                        </Td>
                        <Td>
                          <Text fontSize="sm" maxW="300px" isTruncated>
                            {webhook.url}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme="green">
                            {webhook.event_types?.length || 0} events
                          </Badge>
                        </Td>
                        <Td>
                          <IconButton
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            variant="outline"
                            size="sm"
                            onClick={() => deleteWebhook(webhook.id)}
                            aria-label="Delete webhook"
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Create Webhook Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create PayPal Webhook</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text fontSize="sm" color="gray.600">
                  Enter the URL where PayPal should send webhook notifications.
                </Text>
                
                <FormControl isRequired>
                  <FormLabel>Webhook URL</FormLabel>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder={getRecommendedWebhookUrl()}
                  />
                </FormControl>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWebhookUrl(getRecommendedWebhookUrl())}
                >
                  Use Recommended URL
                </Button>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={createWebhook}
                isLoading={isCreating}
                loadingText="Creating..."
              >
                Create Webhook
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
} 