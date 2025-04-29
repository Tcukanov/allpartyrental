'use client';

import { Box, Container, Heading, Text, VStack, List, ListItem, ListIcon } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

export default function PrivacyPage() {
  return (
    <Box py={16} bg="gray.50">
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center">
            Privacy Policy
          </Heading>
          
          <Text fontSize="lg" color="gray.600">
            Last updated: {new Date().toLocaleDateString()}
          </Text>

          <VStack spacing={6} align="stretch">
            <Box>
              <Heading as="h2" size="md" mb={4}>
                1. Information We Collect
              </Heading>
              <Text>
                We collect information that you provide directly to us, including:
              </Text>
              <List spacing={3} mt={2}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Name and contact information
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Account credentials
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Payment information
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Service booking details
                </ListItem>
              </List>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                2. How We Use Your Information
              </Heading>
              <Text>
                We use the collected information to:
              </Text>
              <List spacing={3} mt={2}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Process your bookings and payments
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Communicate with you about your account
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Send you service updates and promotions
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Improve our platform and services
                </ListItem>
              </List>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                3. Information Sharing
              </Heading>
              <Text>
                We may share your information with:
              </Text>
              <List spacing={3} mt={2}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Service providers to fulfill your bookings
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Payment processors for secure transactions
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Law enforcement when required by law
                </ListItem>
              </List>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                4. Data Security
              </Heading>
              <Text>
                We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                5. Cookies and Tracking
              </Heading>
              <Text>
                We use cookies and similar tracking technologies to enhance your browsing experience and collect usage data. You can control cookie preferences through your browser settings.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                6. Your Rights
              </Heading>
              <Text>
                You have the right to:
              </Text>
              <List spacing={3} mt={2}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Access your personal information
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Correct inaccurate data
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Request deletion of your data
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Opt-out of marketing communications
                </ListItem>
              </List>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                7. Contact Us
              </Heading>
              <Text>
                If you have any questions about this Privacy Policy, please contact us at info@party-vendors.com
              </Text>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
} 