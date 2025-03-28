'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Code,
  Alert,
  AlertIcon,
  Divider,
  Card,
  CardBody,
  Badge,
  Image,
  Link,
  Button,
  Flex,
  Stack,
  HStack,
  VStack,
  useColorModeValue,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { 
  FiChevronRight, 
  FiUsers, 
  FiDollarSign, 
  FiSettings, 
  FiServer, 
  FiAlertCircle, 
  FiClipboard,
  FiDownload,
  FiHelpCircle,
} from 'react-icons/fi';
import NextLink from 'next/link';

export default function AdminDocsPage() {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Container maxW="container.xl">
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>Admin Documentation</Heading>
          <Text color="gray.600">Complete guide to the AllPartyRent admin panel</Text>
        </Box>
        
        <Flex justifyContent="flex-end">
          <Button leftIcon={<FiDownload />} colorScheme="blue" size="sm">
            Download PDF
          </Button>
        </Flex>
        
        {/* Introduction */}
        <Card bg={cardBg}>
          <CardBody>
            <Stack spacing={4}>
              <Heading as="h2" size="lg">Introduction</Heading>
              <Text>
                The AllPartyRent admin panel provides a comprehensive interface for managing all aspects of the platform.
                This documentation covers the key features and functions available to administrators.
              </Text>
              <Alert status="info">
                <AlertIcon />
                <Text>Access to the admin panel is restricted to users with admin privileges. If you need access, please contact the system administrator.</Text>
              </Alert>
            </Stack>
          </CardBody>
        </Card>
        
        {/* Navigation and Layout */}
        <Card bg={cardBg}>
          <CardBody>
            <Stack spacing={4}>
              <Heading as="h2" size="lg">Navigation and Layout</Heading>
              <Text>
                The admin panel is organized into several key sections accessible from the navigation menu:
              </Text>
              <List spacing={3}>
                <ListItem>
                  <HStack>
                    <Box as="span" fontSize="xl" mr={2}>📊</Box>
                    <Box>
                      <Text fontWeight="bold">Dashboard</Text>
                      <Text>Overview of platform metrics and system status</Text>
                    </Box>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Box as="span" fontSize="xl" mr={2}>💰</Box>
                    <Box>
                      <Text fontWeight="bold">Transactions</Text>
                      <Text>Manage and process user transactions</Text>
                    </Box>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Box as="span" fontSize="xl" mr={2}>👥</Box>
                    <Box>
                      <Text fontWeight="bold">Users</Text>
                      <Text>User account management</Text>
                    </Box>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Box as="span" fontSize="xl" mr={2}>💵</Box>
                    <Box>
                      <Text fontWeight="bold">Finances</Text>
                      <Text>Track revenue and financial metrics</Text>
                    </Box>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Box as="span" fontSize="xl" mr={2}>🖥️</Box>
                    <Box>
                      <Text fontWeight="bold">System</Text>
                      <Text>System status and maintenance</Text>
                    </Box>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Box as="span" fontSize="xl" mr={2}>⚙️</Box>
                    <Box>
                      <Text fontWeight="bold">Settings</Text>
                      <Text>Platform configuration options</Text>
                    </Box>
                  </HStack>
                </ListItem>
 