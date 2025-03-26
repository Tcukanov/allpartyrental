"use client";

import { Box, Container, Spinner } from '@chakra-ui/react';

export default function Loading() {
  return (
    <Box py={20}>
      <Container maxW="container.xl">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minH="400px"
        >
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Box>
      </Container>
    </Box>
  );
} 