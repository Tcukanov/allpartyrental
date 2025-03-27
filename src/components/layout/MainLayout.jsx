"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  HStack, 
  IconButton, 
  Button, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  MenuDivider, 
  useDisclosure, 
  Container, 
  Image, 
  Stack, 
  Text, 
  Avatar, 
  useColorModeValue,
  useColorMode,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Divider,
  Spinner
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, ChevronDownIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import NotificationComponent from '@/components/notification/notificationComponent';

// Navigation links
const clientLinks = [
  { name: 'Dashboard', href: '/client/dashboard' },
  { name: 'My Party', href: '/client/my-party' },
  { name: 'Create Party', href: '/client/create-party' },
  { name: 'Calendar', href: '/client/calendar' },
  { name: 'History', href: '/client/party-history' },
];

const providerLinks = [
  { name: 'Dashboard', href: '/provider/cabinet' },
  { name: 'My Services', href: '/provider/services' },
  { name: 'Requests', href: '/provider/requests' },
  { name: 'Advertising', href: '/provider/advertising' },
];

const adminLinks = [
  { name: 'Admin Panel', href: '/admin/panel' },
];

// Public links
const publicLinks = [
  { name: 'Home', href: '/' },
  { name: 'Services', href: '/services' },
  { name: 'How It Works', href: '/about' },
];

export default function MainLayout({ children }) {
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle route change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Show loading for at least 500ms

    return () => clearTimeout(timer);
  }, [pathname]);
  
  // Determine which navigation links to show based on user role
  const navLinks = session?.user?.role === 'CLIENT' 
    ? clientLinks 
    : session?.user?.role === 'PROVIDER' 
      ? providerLinks 
      : session?.user?.role === 'ADMIN' 
        ? adminLinks 
        : publicLinks;
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };
  
  return (
    <Box>
      <Box 
        bg={useColorModeValue('white', 'gray.900')} 
        borderBottom={1} 
        borderStyle="solid" 
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <IconButton
              size="md"
              icon={isMobileNavOpen ? <CloseIcon /> : <HamburgerIcon />}
              aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
              display={{ md: 'none' }}
              onClick={isMobileNavOpen ? onMobileNavClose : onMobileNavOpen}
            />
            
            <HStack spacing={8} alignItems="center">
              <Box as={Link} href="#">
                <Image 
                  src="/images/logo.png" 
                  alt="Party Marketplace" 
                  h="65px" 
                />
              </Box>
              
              <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
                {navLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    passHref
                  >
                    <Button
                      variant={pathname === link.href ? 'solid' : 'ghost'}
                      colorScheme={pathname === link.href ? 'brand' : undefined}
                      color={pathname === link.href ? 'white' : 'black'}
                      _hover={{ color: 'brand.500' }}
                    >
                      {link.name}
                    </Button>
                  </Link>
                ))}
              </HStack>
            </HStack>
            
            <HStack spacing={4}>
              <IconButton
                aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                variant="ghost"
                onClick={toggleColorMode}
              />
              
              {status === 'authenticated' && (
                <NotificationComponent />
              )}
              
              {status === 'authenticated' ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded="full"
                    variant="link"
                    cursor="pointer"
                    minW={0}
                  >
                    <Avatar
                      size="sm"
                      name={session.user.name}
                      src={session.user.image}
                    />
                  </MenuButton>
                  <MenuList>
                    <MenuItem isDisabled>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{session.user.name}</Text>
                        <Text fontSize="xs" color="gray.500">{session.user.email}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {session.user.role === 'CLIENT' ? 'Client' : 
                           session.user.role === 'PROVIDER' ? 'Service Provider' : 
                           'Administrator'}
                        </Text>
                      </VStack>
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem 
                      as={Link} 
                      href={session.user.role === 'CLIENT' 
                        ? '/client/profile' 
                        : session.user.role === 'PROVIDER'
                          ? '/provider/profile'
                          : '/admin/profile'
                      }
                    >
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <HStack spacing={2}>
                  <Button 
                    as={Link} 
                    href="/auth/signin"
                    variant="ghost"
                  >
                    Sign In
                  </Button>
                  <Button 
                    as={Link} 
                    href="/auth/signup"
                    colorScheme="brand"
                  >
                    Sign Up
                  </Button>
                </HStack>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>
      
      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={isMobileNavOpen}
        placement="left"
        onClose={onMobileNavClose}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Image 
              src="/images/logo.png" 
              alt="Party Marketplace" 
              h="40px" 
            />
          </DrawerHeader>

          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  passHref
                  onClick={onMobileNavClose}
                >
                  <Button
                    variant={pathname === link.href ? 'solid' : 'ghost'}
                    colorScheme={pathname === link.href ? 'brand' : undefined}
                    color={pathname === link.href ? 'white' : 'black'}
                    _hover={{ color: 'brand.500' }}
                    w="full"
                    justifyContent="flex-start"
                  >
                    {link.name}
                  </Button>
                </Link>
              ))}
              
              <Divider />
              
              {status === 'authenticated' ? (
                <>
                  <Button
                    as={Link}
                    href={session.user.role === 'CLIENT' 
                      ? '/client/profile' 
                      : session.user.role === 'PROVIDER'
                        ? '/provider/profile'
                        : '/admin/profile'
                    }
                    variant="ghost"
                    w="full"
                    justifyContent="flex-start"
                    onClick={onMobileNavClose}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    w="full"
                    justifyContent="flex-start"
                    onClick={() => {
                      handleSignOut();
                      onMobileNavClose();
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    as={Link}
                    href="/auth/signin"
                    variant="ghost"
                    w="full"
                    justifyContent="flex-start"
                    onClick={onMobileNavClose}
                  >
                    Sign In
                  </Button>
                  <Button
                    as={Link}
                    href="/auth/signup"
                    colorScheme="brand"
                    w="full"
                    justifyContent="flex-start"
                    onClick={onMobileNavClose}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onMobileNavClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box position="relative">
        {isLoading && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(255, 255, 255, 0.8)"
            zIndex={9999}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Spinner size="xl" color="brand.500" thickness="4px" />
          </Box>
        )}
        {children}
      </Box>
      
      {/* Footer */}
      <Box
        bg={useColorModeValue('gray.50', 'gray.900')}
        color={useColorModeValue('gray.700', 'gray.200')}
        borderTopWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Container maxW="container.xl" py={10}>
          <Flex direction={{ base: 'column', md: 'row' }} spacing={8} justify="space-between">
            <Box w={{ base: 'full', md: '30%' }} mb={{ base: 8, md: 0 }}>
              <Image 
                src="/images/logo.png" 
                alt="Party Marketplace" 
                h="50px" 
                mb={4}
              />
              <Text>
                Connecting clients with the best service providers for all your party and event needs.
              </Text>
            </Box>
            
            <Stack direction="row" spacing={6} flex={1} justify="space-around">
              <Box>
                <Text fontWeight="bold" fontSize="lg" mb={4}>For Clients</Text>
                <VStack align="flex-start" spacing={2}>
                  <Link href="/client/create-party">Plan a Party</Link>
                  <Link href="/services">Find Services</Link>
                  <Link href="/how-it-works">How It Works</Link>
                </VStack>
              </Box>
              
              <Box>
                <Text fontWeight="bold" fontSize="lg" mb={4}>For Providers</Text>
                <VStack align="flex-start" spacing={2}>
                  <Link href="/provider/join">Join as Provider</Link>
                  <Link href="/provider/how-it-works">How It Works</Link>
                  <Link href="/provider/advertising">Advertise</Link>
                </VStack>
              </Box>
              
              <Box>
                <Text fontWeight="bold" fontSize="lg" mb={4}>Company</Text>
                <VStack align="flex-start" spacing={2}>
                  <Link href="/about">About Us</Link>
                  <Link href="/contact">Contact</Link>
                  <Link href="/terms">Terms of Service</Link>
                  <Link href="/privacy">Privacy Policy</Link>
                </VStack>
              </Box>
            </Stack>
          </Flex>
          
          <Divider my={6} />
          
          <Text textAlign="center">
            © {new Date().getFullYear()} Party Marketplace. All rights reserved.
          </Text>
        </Container>
      </Box>
    </Box>
  );
}