'use client';

import { Box, Container, Heading, Text, VStack, List, ListItem, ListIcon, Button } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import Link from 'next/link';

export default function SoftPlayTermsPage() {
  return (
    <Box py={16} bg="gray.50">
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center">
            Soft Play Service Agreement
          </Heading>
          
          <Text fontSize="lg" color="gray.600">
            Last updated: {new Date().toLocaleDateString()}
          </Text>

          <Box mb={6}>
            <Link href="/terms" passHref>
              <Button variant="outline" size="sm">
                ← Back to General Terms
              </Button>
            </Link>
          </Box>

          <VStack spacing={6} align="stretch">
            <Box>
              <Heading as="h2" size="md" mb={4}>
                1. Safety Requirements
              </Heading>
              <Text mb={3}>
                The client agrees to ensure proper adult supervision at all times when children are using the soft play equipment.
              </Text>
              <List spacing={3}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Minimum of 1 adult supervisor per 5 children
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Children must remove shoes, jewelry, and sharp objects
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  No food or drinks allowed on the equipment
                </ListItem>
              </List>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                2. Space Requirements
              </Heading>
              <Text>
                The client must ensure adequate space as specified in the service description. Soft play setups require proper clearance from walls, furniture, and other obstacles to maintain safety.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                3. Set Up and Removal
              </Heading>
              <Text>
                Our team will handle the setup and removal of all equipment. The client must provide clear access to the installation area and ensure the space is clean and ready for setup at the agreed time.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                4. Damage Policy
              </Heading>
              <Text>
                The client is responsible for any damage to the equipment beyond normal wear and tear. All equipment will be inspected before and after the rental period.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                5. Cancellation Policy
              </Heading>
              <Text>
                Cancellations made with less than 48 hours notice may be subject to a cancellation fee of up to 50% of the booking value.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                6. Weather Conditions
              </Heading>
              <Text>
                For outdoor events, we reserve the right to cancel or postpone the service if weather conditions pose a safety risk. We will work with you to reschedule your event.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                7. Liability
              </Heading>
              <Text>
                While our equipment meets all safety standards, the client assumes responsibility for ensuring proper supervision and safe use of the equipment. The service provider is not liable for injuries resulting from improper use or inadequate supervision.
              </Text>
            </Box>
          </VStack>

          <Box mt={8} p={6} bg="blue.50" borderRadius="md">
            <Text fontWeight="bold" mb={2}>
              By booking our soft play service, you acknowledge that you have read, understood, and agree to these terms.
            </Text>
            <Link href="/services" passHref>
              <Button colorScheme="blue" size="sm" mt={2}>
                Return to Services
              </Button>
            </Link>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
} 