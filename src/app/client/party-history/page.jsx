"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Button,
  Spinner,
  useToast,
  Divider,
  Avatar,
  Flex,
  Icon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CalendarIcon, TimeIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';

export default function PartyHistoryPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [completedParties, setCompletedParties] = useState([]);
  
  // Fetch completed parties
  useEffect(() => {
    const fetchCompletedParties = async () => {
      if (sessionStatus !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/parties');
        const data = await response.json();
        
        if (data.success) {
          // Filter for completed parties
          const completed = data.data.filter(
            party => party.status === 'COMPLETED'
          );
          
          // Fetch detailed info for each completed party
          const completedWithDetails = await Promise.all(
            completed.map(async (party) => {
              const detailResponse = await fetch(`/api/parties/${party.id}`);
              const detailData = await detailResponse.json();
              
              if (detailData.success) {
                return detailData.data;
              }
              return party;
            })
          );
          
          setCompletedParties(completedWithDetails);
        } else {
          throw new Error(data.error.message || 'Failed to fetch parties');
        }
      } catch (error) {
        console.error('Fetch completed parties error:', error);
        toast({
          title: 'Error',
          description: 'An error occurred while loading the services. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompletedParties();
  }, [sessionStatus, toast]);
  
  // Format date for display
  const formatPartyDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" h="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" />
            <Text>Loading your party history...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }
  
  if (!session) {
    router.push('/auth/signin');
    return null;
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Party History</Heading>
          <Text color="gray.600" mt={2}>
            View your past events and completed parties
          </Text>
        </Box>
        
        {completedParties.length === 0 ? (
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="lg">
            <Heading size="md" mb={4}>No completed parties yet</Heading>
            <Text mb={6}>You don't have any completed parties in your history.</Text>
            <Button 
              colorScheme="brand" 
              onClick={() => router.push('/client/create-party')}
            >
              Create New Party
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {completedParties.map((party) => (
              <Card key={party.id} borderWidth="1px">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="md">{party.name}</Heading>
                      <Badge colorScheme="green" px={2} py={1}>
                        Completed
                      </Badge>
                    </Flex>
                    
                    <HStack spacing={4}>
                      <HStack>
                        <Icon as={CalendarIcon} color="brand.500" />
                        <Text>{formatPartyDate(party.date)}</Text>
                      </HStack>
                      <HStack>
                        <Icon as={TimeIcon} color="brand.500" />
                        <Text>{party.startTime} ({party.duration}h)</Text>
                      </HStack>
                    </HStack>
                    
                    <Divider />
                    
                    <Accordion allowToggle>
                      <AccordionItem border="none">
                        <AccordionButton px={0}>
                          <Box flex="1" textAlign="left" fontWeight="medium">
                            Services & Providers
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4} px={0}>
                          <VStack spacing={3} align="stretch">
                            {party.partyServices && party.partyServices.map((service) => {
                              // Find approved offer for this service
                              const approvedOffer = service.offers && service.offers.find(
                                offer => offer.status === 'APPROVED'
                              );
                              
                              return (
                                <Box 
                                  key={service.id} 
                                  p={3} 
                                  borderWidth="1px" 
                                  borderRadius="md"
                                >
                                  <HStack justify="space-between" mb={2}>
                                    <Text fontWeight="bold">
                                      {service.service?.name || 'Service'}
                                    </Text>
                                    <Badge colorScheme="green">
                                      <HStack spacing={1}>
                                        <CheckCircleIcon />
                                        <Text>Completed</Text>
                                      </HStack>
                                    </Badge>
                                  </HStack>
                                  
                                  {approvedOffer && (
                                    <HStack spacing={3} mt={2}>
                                      <Avatar 
                                        size="sm" 
                                        src={approvedOffer.provider?.profile?.avatar} 
                                        name={approvedOffer.provider?.name} 
                                      />
                                      <Text>{approvedOffer.provider?.name}</Text>
                                    </HStack>
                                  )}
                                </Box>
                              );
                            })}
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                    
                    <Divider />
                    
                    <Button
                      variant="outline"
                      colorScheme="brand"
                      onClick={() => router.push(`/client/my-party?id=${party.id}`)}
                    >
                      View Details
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
        
        <Button 
          mt={4} 
          variant="outline" 
          onClick={() => router.push('/client/dashboard')}
        >
          Back to Dashboard
        </Button>
      </VStack>
    </Container>
  );
} 