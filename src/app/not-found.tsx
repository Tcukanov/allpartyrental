'use client';

import { Box, Container, Heading, Text, Button, VStack, Image, Flex } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();

  return (
    <Container maxW="container.xl" py={20}>
      <Flex 
        direction={{ base: 'column', md: 'row' }}
        align="center"
        justify="center"
        gap={10}
      >
        <Box>
          <Image 
            src="/images/not-found.svg" 
            alt="Page not found" 
            fallbackSrc="https://via.placeholder.com/400x300?text=404+Not+Found"
            maxW="400px"
          />
        </Box>
        
        <VStack spacing={6} align="start" maxW="500px">
          <Heading as="h1" size="2xl">404</Heading>
          <Heading as="h2" size="lg">Page Not Found</Heading>
          
          <Text fontSize="lg" color="gray.600">
            We're sorry, the page you requested could not be found. 
            This could be due to an incorrect URL, a missing resource, or a removed page.
          </Text>
          
          <Text fontSize="md" color="gray.600">
            Here are some helpful links:
          </Text>
          
          <VStack spacing={3} align="stretch" w="100%">
            <Button colorScheme="brand" size="lg" onClick={() => router.push('/')}>
              Go to Home Page
            </Button>
            
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
            
            <Flex gap={4} mt={4} wrap="wrap">
              <Link href="/services">
                <Text color="brand.500" fontWeight="medium">Browse Services</Text>
              </Link>
              <Link href="/contact">
                <Text color="brand.500" fontWeight="medium">Contact Support</Text>
              </Link>
              <Link href="/how-it-works">
                <Text color="brand.500" fontWeight="medium">How It Works</Text>
              </Link>
            </Flex>
          </VStack>
        </VStack>
      </Flex>
    </Container>
  );
} 