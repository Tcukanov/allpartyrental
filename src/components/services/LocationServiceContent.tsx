"use client";

import { Box, Container, Heading, Text, SimpleGrid, VStack } from '@chakra-ui/react';
import { Service, User, Profile, ServiceCategory } from '@prisma/client';
import ServiceCard from '@/components/services/ServiceCard';

type ServiceWithProvider = Service & {
  provider: User & {
    profile: Profile | null;
  };
  category: ServiceCategory;
};

interface LocationServiceContentProps {
  services: ServiceWithProvider[];
  cityName: string;
  categoryName: string;
}

export default function LocationServiceContent({ services, cityName, categoryName }: LocationServiceContentProps) {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="2xl" mb={4}>
            {categoryName} Rental in {cityName}
          </Heading>
          <Text fontSize="xl" color="gray.600">
            Find and compare the best {categoryName.toLowerCase()} rental services in {cityName}. 
            Read reviews, compare prices, and book your party equipment today!
          </Text>
        </Box>

        {services.length === 0 ? (
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
            <Text fontSize="lg">No {categoryName.toLowerCase()} rental services found in {cityName}.</Text>
            <Text mt={2} color="gray.600">
              Try searching for a different location or service.
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} cityName={cityName} />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
} 