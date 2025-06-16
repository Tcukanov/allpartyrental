"use client";

import { 
  Box, 
  Flex, 
  Button, 
  HStack, 
  Text, 
  Avatar, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  useDisclosure, 
  IconButton, 
  Drawer, 
  DrawerOverlay, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  VStack,
  CloseButton
} from '@chakra-ui/react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  const isLoggedIn = status === 'authenticated';
  const isClient = isLoggedIn && session?.user?.role === 'CLIENT';
  const isProvider = isLoggedIn && session?.user?.role === 'PROVIDER';
  const isAdmin = isLoggedIn && session?.user?.role === 'ADMIN';

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleSignIn = () => {
    signIn(null, { callbackUrl: '/' });
  };

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'How It Works', href: '/how-it-works' },
  ];

  const clientItems = [
    // { label: 'My Parties', href: '/client/parties' },
    { label: 'My Profile', href: '/client/profile' },
    { label: 'Calendar', href: '/client/calendar' },
    { label: 'My bookings', href: '/client/my-bookings' },
    { label: 'Transactions', href: '/client/transactions' },
  ];

  const providerItems = [
    // Provider pages now use ProviderLayout - no need for navigation items here
  ];

  const adminItems = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Disputes', href: '/admin/disputes' },
    { label: 'Moderation', href: '/admin/moderation' },
  ];

  return (
    <Box as="nav" bg="white" boxShadow="sm" position="sticky" top={0} zIndex={10}>
      <Flex h="16" alignItems="center" justifyContent="space-between" mx="auto" px={4} maxW="1200px">
        <Flex alignItems="center">
          <Link href="/" passHref>
            <Text fontSize="xl" fontWeight="bold" color="brand.600">
             All Party Rental
            </Text>
          </Link>

          <HStack spacing={4} ml={8} display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Text px={2} py={1} rounded="md" _hover={{ bg: 'gray.100' }}>
                  {item.label}
                </Text>
              </Link>
            ))}
          </HStack>
        </Flex>

        <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
          {isLoggedIn ? (
            <>
              {isClient && (
                /* 
                <Button 
                  colorScheme="brand" 
                  variant="solid" 
                  onClick={() => router.push('/client/create-party')}
                >
                  Organize My Party!
                </Button>
                */
                <></>
              )}
              
              {isProvider && (
                <Button 
                  colorScheme="brand" 
                  variant="solid" 
                  onClick={() => router.push('/provider/cabinet')}
                >
                  Provider Cabinet
                </Button>
              )}
              
              <Menu>
                <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
                  <Avatar size="sm" src={session?.user?.image || undefined} name={session?.user?.name || 'User'} />
                </MenuButton>
                <MenuList>
                  {isClient && clientItems.map((item) => (
                    <MenuItem key={item.href} as={Link} href={item.href}>
                      {item.label}
                    </MenuItem>
                  ))}
                  
                  {isProvider && (
                    <MenuItem as={Link} href="/provider/dashboard">
                      Provider Dashboard
                    </MenuItem>
                  )}
                  
                  {isAdmin && adminItems.map((item) => (
                    <MenuItem key={item.href} as={Link} href={item.href}>
                      {item.label}
                    </MenuItem>
                  ))}
                  
                  <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button colorScheme="brand" onClick={() => router.push('/auth/register')}>
                Sign Up
              </Button>
            </>
          )}
        </HStack>

        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          icon={<HamburgerIcon />}
          variant="ghost"
          aria-label="Open menu"
        />
      </Flex>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <CloseButton onClick={onClose} position="absolute" right={2} top={2} />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="start">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} passHref onClick={onClose}>
                  <Text px={2} py={1} rounded="md" _hover={{ bg: 'gray.100' }}>
                    {item.label}
                  </Text>
                </Link>
              ))}
              
              {isLoggedIn ? (
                <>
                  <Box pt={4} pb={2} w="full">
                    <Text fontWeight="semibold" color="gray.500">
                      {isClient ? 'Client Menu' : isProvider ? 'Provider Menu' : 'Admin Menu'}
                    </Text>
                  </Box>
                  
                  {isClient && clientItems.map((item) => (
                    <Link key={item.href} href={item.href} passHref onClick={onClose}>
                      <Text px={2} py={1} rounded="md" _hover={{ bg: 'gray.100' }}>
                        {item.label}
                      </Text>
                    </Link>
                  ))}
                  
                  {isProvider && (
                    <Link href="/provider/dashboard" passHref onClick={onClose}>
                      <Text px={2} py={1} rounded="md" _hover={{ bg: 'gray.100' }}>
                        Provider Dashboard
                      </Text>
                    </Link>
                  )}
                  
                  {isAdmin && adminItems.map((item) => (
                    <Link key={item.href} href={item.href} passHref onClick={onClose}>
                      <Text px={2} py={1} rounded="md" _hover={{ bg: 'gray.100' }}>
                        {item.label}
                      </Text>
                    </Link>
                  ))}
                  
                  <Button w="full" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <VStack spacing={4} w="full" pt={4}>
                  <Button w="full" variant="outline" onClick={handleSignIn}>
                    Sign In
                  </Button>
                  <Button w="full" colorScheme="brand" onClick={() => {
                    router.push('/auth/register');
                    onClose();
                  }}>
                    Sign Up
                  </Button>
                </VStack>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
