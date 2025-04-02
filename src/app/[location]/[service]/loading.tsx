import { Box, Container, Skeleton, SkeletonText, SimpleGrid, VStack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Skeleton height="60px" width="70%" mb={4} />
          <SkeletonText mt={2} noOfLines={2} spacing={4} skeletonHeight={4} />
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {Array(6).fill(0).map((_, i) => (
            <Box key={i} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <Skeleton height="200px" />
              <Box p={6}>
                <SkeletonText mt={2} noOfLines={1} spacing={4} skeletonHeight={6} />
                <SkeletonText mt={4} noOfLines={1} spacing={4} skeletonHeight={3} />
                <SkeletonText mt={6} noOfLines={2} spacing={4} skeletonHeight={3} />
                <SkeletonText mt={6} noOfLines={1} spacing={4} skeletonHeight={5} />
                <SkeletonText mt={6} noOfLines={1} spacing={4} skeletonHeight={3} />
                <Skeleton height="40px" mt={6} />
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
} 