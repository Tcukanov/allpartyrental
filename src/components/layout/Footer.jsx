"use client";

import { Box, Flex, Text, Container } from '@chakra-ui/react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerSections = [
    {
      title: 'For Clients',
      links: [
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'Find Services', href: '/services' },
        { label: 'Create a Party', href: '/client/create-party' },
        { label: 'FAQs', href: '/faqs' }
      ]
    },
    {
      title: 'For Providers',
      links: [
        { label: 'Join as Provider', href: '/auth/provider-signup' },
        { label: 'List Your Services', href: '/provider/services/new' },
        { label: 'Advertising Options', href: '/provider/advertising' },
        { label: 'Provider Guidelines', href: '/provider-guidelines' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Careers', href: '/careers' },
        { label: 'Blog', href: '/blog' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Dispute Resolution', href: '/disputes' }
      ]
    }
  ];

  return (
    <Box as="footer" bg="gray.800" color="white" py={10}>
      <Container maxW="1200px">
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align={{ base: 'center', md: 'flex-start' }}
          wrap="wrap"
        >
          <Box mb={{ base: 8, md: 0 }} textAlign={{ base: 'center', md: 'left' }}>
            <Text fontSize="xl" fontWeight="bold" mb={4}>Party Marketplace</Text>
            <Text fontSize="sm" maxW="300px" color="gray.400">
              Connecting clients with the best service providers for parties and events across the United States.
            </Text>
          </Box>
          
          {footerSections.map((section) => (
            <Box 
              key={section.title} 
              mb={{ base: 8, md: 0 }}
              textAlign={{ base: 'center', md: 'left' }}
              minW={{ md: '150px' }}
            >
              <Text fontWeight="bold" mb={4}>{section.title}</Text>
              <Flex direction="column" gap={2}>
                {section.links.map((link) => (
                  <Link key={link.href} href={link.href} passHref>
                    <Text fontSize="sm" color="gray.400" _hover={{ color: 'white' }}>
                      {link.label}
                    </Text>
                  </Link>
                ))}
              </Flex>
            </Box>
          ))}
        </Flex>
        
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align="center"
          mt={12}
          pt={6}
          borderTopWidth={1}
          borderTopColor="gray.700"
        >
          <Text fontSize="sm" color="gray.500">
            © {currentYear} Party Marketplace. All rights reserved.
          </Text>
          <Flex gap={4} mt={{ base: 4, md: 0 }}>
            <Link href="https://facebook.com" passHref>
              <Text fontSize="sm" color="gray.500" _hover={{ color: 'white' }}>Facebook</Text>
            </Link>
            <Link href="https://twitter.com" passHref>
              <Text fontSize="sm" color="gray.500" _hover={{ color: 'white' }}>Twitter</Text>
            </Link>
            <Link href="https://instagram.com" passHref>
              <Text fontSize="sm" color="gray.500" _hover={{ color: 'white' }}>Instagram</Text>
            </Link>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
