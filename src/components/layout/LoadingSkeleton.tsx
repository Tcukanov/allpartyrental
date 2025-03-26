"use client";

import { Box, Skeleton, Container, VStack } from '@chakra-ui/react';

export default function LoadingSkeleton() {
  return (
    <Box py={20}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Hero Section Skeleton */}
          <Box textAlign="center" maxW="800px" mx="auto">
            <Skeleton height="48px" mb={6} />
            <Skeleton height="24px" mb={8} />
            <Skeleton height="60px" />
          </Box>

          {/* Content Skeleton */}
          <Box>
            <Skeleton height="200px" mb={4} />
            <Skeleton height="24px" mb={4} />
            <Skeleton height="100px" />
          </Box>

          {/* Additional Content Skeleton */}
          <Box>
            <Skeleton height="24px" mb={4} />
            <Skeleton height="100px" />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
} 