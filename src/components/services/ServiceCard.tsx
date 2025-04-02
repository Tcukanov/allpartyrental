"use client";

import { Box, Card, CardBody, Image, VStack, HStack, Badge, Button, Icon, Text, Heading, Center } from '@chakra-ui/react';
import { StarIcon, ViewIcon } from '@chakra-ui/icons';
import { Service, User, Profile, ServiceCategory } from '@prisma/client';

type ServiceWithProvider = Service & {
  provider: User & {
    profile: Profile | null;
  };
  category: ServiceCategory;
};

interface ServiceCardProps {
  service: ServiceWithProvider;
  cityName: string;
}

export default function ServiceCard({ service, cityName }: ServiceCardProps) {
  return (
    <Card overflow="hidden">
      <Image
        src={service.photos?.[0] || ''}
        alt={service.name}
        height="200px"
        objectFit="cover"
        fallback={
          <Center height="200px" bg="gray.200">
            <Text color="gray.500">No Image Available</Text>
          </Center>
        }
      />
      <CardBody>
        <VStack align="stretch" spacing={4}>
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
              <Text>{cityName}</Text>
            </HStack>
          </HStack>

          <Badge colorScheme="brand" alignSelf="start">
            Starting from ${Number(service.price).toFixed(2)}
          </Badge>

          <Button colorScheme="brand" size="lg">
            View Details
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
} 