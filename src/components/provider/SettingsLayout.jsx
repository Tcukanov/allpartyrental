'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Container,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Divider,
  useColorModeValue,
  Icon,
  Link
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { FiSettings, FiCreditCard, FiUser, FiShield, FiLogOut } from 'react-icons/fi';

const SettingsLayout = ({ children }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const menuItems = [
    { 
      name: 'General',
      path: '/provider/settings',
      icon: FiSettings
    },
    { 
      name: 'Payments',
      path: '/provider/settings/payments',
      icon: FiCreditCard
    },
    { 
      name: 'Profile',
      path: '/provider/settings/profile',
      icon: FiUser
    },
    { 
      name: 'Security',
      path: '/provider/settings/security',
      icon: FiShield
    }
  ];

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        <VStack
          width={{ base: 'full', md: '250px' }}
          align="stretch"
          spacing={2}
          borderRight={{ base: 'none', md: '1px' }}
          borderColor={borderColor}
          pr={{ base: 0, md: 4 }}
        >
          <Heading size="md" mb={4}>Settings</Heading>
          
          {menuItems.map((item) => (
            <Link
              key={item.path}
              as={NextLink}
              href={item.path}
              _hover={{ textDecoration: 'none' }}
            >
              <Button
                variant={isActive(item.path) ? 'solid' : 'ghost'}
                colorScheme={isActive(item.path) ? 'blue' : 'gray'}
                justifyContent="flex-start"
                width="full"
                leftIcon={<Icon as={item.icon} />}
              >
                {item.name}
              </Button>
            </Link>
          ))}
          
          <Divider my={4} />
          
          <Button
            variant="ghost"
            colorScheme="gray"
            justifyContent="flex-start"
            width="full"
            leftIcon={<Icon as={FiLogOut} />}
            onClick={() => router.push('/provider/dashboard')}
          >
            Back to Dashboard
          </Button>
        </VStack>
        
        <Box flex={1}>
          {children}
        </Box>
      </Flex>
    </Container>
  );
};

export default SettingsLayout; 