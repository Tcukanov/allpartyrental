'use client';

import { Box, Container, Heading, Text, VStack, List, ListItem, ListIcon } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

export default function TermsPage() {
  return (
    <Box py={16} bg="gray.50">
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center">
            Terms of Service
          </Heading>
          
          <Text fontSize="lg" color="gray.600">
            Last updated: {new Date().toLocaleDateString()}
          </Text>

          <VStack spacing={6} align="stretch">
            <Box>
              <Heading as="h2" size="md" mb={4}>
                1. Acceptance of Terms
              </Heading>
              <Text>
                By accessing and using AllPartyRent, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our platform.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                2. Service Description
              </Heading>
              <Text>
                AllPartyRent is a platform that connects party service providers with customers. We facilitate the booking and management of party services but are not responsible for the actual delivery of services.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                3. User Responsibilities
              </Heading>
              <List spacing={3}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Provide accurate and complete information
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Maintain the security of your account
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Comply with all applicable laws and regulations
                </ListItem>
              </List>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                4. Payment Terms
              </Heading>
              <Text>
                All payments are processed securely through our platform. Service providers receive payment after successful completion of services, minus our platform fees.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                5. Cancellation Policy
              </Heading>
              <Text>
                Cancellation policies vary by service provider. Please review the specific cancellation terms for each service before booking.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                6. Limitation of Liability
              </Heading>
              <Text>
                AllPartyRent is not liable for any damages arising from the use or inability to use our platform, including but not limited to direct, indirect, incidental, or consequential damages.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                7. Changes to Terms
              </Heading>
              <Text>
                We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
              </Text>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
} 