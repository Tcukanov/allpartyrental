"use client";

import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, SimpleGrid, Card, CardBody, Image, Button, useToast, HStack, Badge, Icon, Spinner } from '@chakra-ui/react';
import { StarIcon, ViewIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import LocationServiceSearch from '@/components/search/LocationServiceSearch';

export default function ServicesPage() {
  const router = useRouter();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services/public');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to load services');
        }
        setServices(data.data);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load services',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServices();
  }, [toast]);
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Our Services</Heading>
          <Text color="gray.600" mt={2}>
            Discover our range of party and event services
          </Text>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <LocationServiceSearch />
        </Box>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={12}>
            <Spinner size="xl" color="brand.500" />
          </Box>
        ) : services.length === 0 ? (
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
            <Text fontSize="lg">No services found.</Text>
            <Text mt={2} color="gray.600">
              Try searching for a different service or location.
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {services.map((service) => (
              <Card key={service.id} cursor="pointer" onClick={() => router.push(`/services/${service.id}`)}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box position="relative" h="200px">
                      <Image
                        src={service.photos?.[0] || '/images/placeholder.jpg'}
                        alt={service.name}
                        objectFit="cover"
                        w="100%"
                        h="100%"
                        borderRadius="md"
                      />
                      <Badge
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme="brand"
                      >
                        Starting from ${Number(service.price).toFixed(2)}
                      </Badge>
                    </Box>
                    
                    <Box>
                      <Heading size="md">{service.name}</Heading>
                      <Text color="gray.600" mt={1}>
                        {service.description}
                      </Text>
                    </Box>

                    <HStack spacing={4}>
                      <HStack>
                        <Icon as={StarIcon} color="yellow.400" />
                        <Text>4.5</Text>
                      </HStack>
                      <HStack>
                        <Icon as={ViewIcon} />
                        <Text>{service.city?.name || 'Location not specified'}</Text>
                      </HStack>
                    </HStack>

                    <Button colorScheme="brand" size="sm">
                      View Details
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
}