'use client';

import { useRouter } from 'next/navigation';
import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

export default function PaymentCancelPage() {
  const router = useRouter();

  const handleRetry = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  return (
    <Container maxW="md" py={8}>
      <VStack spacing={6} align="center">
        <WarningIcon boxSize={16} color="orange.500" />
        <Heading size="lg" color="orange.600">Payment Cancelled</Heading>
        
        <Alert status="warning" variant="subtle" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Payment Not Completed</AlertTitle>
            <AlertDescription>
              Your payment was cancelled. No charges have been made to your account.
              You can try again or explore other services.
            </AlertDescription>
          </Box>
        </Alert>

        <VStack spacing={4} w="full">
          <Box p={4} border="1px" borderColor="orange.200" borderRadius="md" bg="orange.50" w="full">
            <Text fontWeight="bold" mb={2}>What happens next?</Text>
            <Text fontSize="sm" color="gray.700">
              • Your booking request was not submitted
            </Text>
            <Text fontSize="sm" color="gray.700">
              • No payment was processed
            </Text>
            <Text fontSize="sm" color="gray.700">
              • You can try booking again at any time
            </Text>
          </Box>

          <VStack spacing={3} w="full">
            <Button colorScheme="blue" size="lg" w="full" onClick={handleRetry}>
              Try Payment Again
            </Button>
            <Button variant="outline" size="lg" w="full" onClick={handleContinue}>
              Browse Other Services
            </Button>
          </VStack>
        </VStack>
      </VStack>
    </Container>
  );
} 