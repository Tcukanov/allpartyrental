'use client';

import { Box, Container, Heading, Text, VStack, List, ListItem, ListIcon } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

export default function AuthorizedUsePage() {
  // Get current date in format: September 15, 2023
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Box py={16} bg="gray.50">
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center">
            Authorized Use Policy
          </Heading>
          
          <Text fontSize="lg" color="gray.600">
            Effective Date: {currentDate}
          </Text>

          <Text fontSize="md">
            Welcome to AllPartyRental.com ("we", "our", or "us"). This Authorized Use Policy ("Policy") governs the acceptable use 
            of our website and services available at https://allpartyrental.com/ ("Platform").
          </Text>

          <Text fontSize="md">
            By accessing or using the Platform, you agree to comply with this Policy, which is designed to promote a positive and safe 
            environment for all users, including customers and service providers (vendors).
          </Text>

          <VStack spacing={6} align="stretch">
            <Box>
              <Heading as="h2" size="md" mb={4}>
                1. Permitted Use
              </Heading>
              <Text mb={3}>
                You are authorized to use Allpartyrental.com solely for the purpose of:
              </Text>
              <List spacing={3} pl={5}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Browsing and booking event-related services (if you are a client)
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Creating and managing service listings (if you are a vendor)
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Communicating with other users for legitimate business or event-planning purposes
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  Using the platform in accordance with applicable laws and our Terms of Service
                </ListItem>
              </List>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                2. Prohibited Activities
              </Heading>
              <Text mb={3}>
                You may not use the Platform to:
              </Text>
              <List spacing={3} pl={5}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Post false, misleading, or fraudulent listings or reviews
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Impersonate another person or entity, or misrepresent your affiliation
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Collect or harvest any personal data or contact information without consent
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Upload or transmit viruses, malware, or other harmful code
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Interfere with the security, integrity, or operation of the Platform
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Circumvent payment systems or avoid platform fees and commissions
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Use bots, scripts, or automated methods to access, scrape, or manipulate the Platform
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Engage in abusive, harassing, discriminatory, or unlawful behavior toward other users or staff
                </ListItem>
              </List>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                3. Vendor-Specific Rules
              </Heading>
              <Text mb={3}>
                Vendors are strictly prohibited from:
              </Text>
              <List spacing={3} pl={5}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Offering illegal or dangerous services
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Falsifying availability, pricing, or service descriptions
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="red.500" />
                  Requesting off-platform payment or communication
                </ListItem>
              </List>
              <Text mt={3}>
                Violations may result in listing removal, account suspension, or legal action.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                4. Reporting Violations
              </Heading>
              <Text>
                If you believe someone is violating this Policy, please contact us at support@party-vendors.com with detailed information. 
                We investigate all reports and take action where appropriate.
              </Text>
            </Box>

            <Box>
              <Heading as="h2" size="md" mb={4}>
                5. Changes to This Policy
              </Heading>
              <Text>
                We reserve the right to update or modify this Policy at any time. Your continued use of the Platform after changes are posted 
                constitutes your acceptance of the updated Policy.
              </Text>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
} 