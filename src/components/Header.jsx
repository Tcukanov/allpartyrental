import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useToast } from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import { Box, Container, Flex, HStack, Spacer, Link, Text, Heading, Avatar, Menu, MenuButton, MenuList, MenuItem, MenuDivider, IconButton, Button, Badge, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, VStack } from '@chakra-ui/react';
import { FaComment } from 'react-icons/fa';
import { HamburgerIcon } from '@chakra-ui/icons';
import { signOut } from 'next-auth/react';

const Header = () => {
  const { data: session, status } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Mobile navigation state
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();
  
  const toggleMobileNav = () => {
    if (isMobileNavOpen) {
      onMobileNavClose();
    } else {
      onMobileNavOpen();
    }
  };

  useEffect(() => {
    // Check authentication status
    setIsLoggedIn(status === 'authenticated');

    // If authenticated, fetch unread message count
    if (status === 'authenticated') {
      fetchUnreadMessageCount();
    }
  }, [status]);

  // Function to fetch unread message count
  const fetchUnreadMessageCount = async () => {
    try {
      // In a real app, this would be an API call
      // For now, just simulate some unread messages
      const mockUnreadCount = Math.floor(Math.random() * 5); // Random 0-4
      setUnreadMessages(mockUnreadCount);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  return (
    <>
      <Box 
        as="header" 
        py={2}
        px={4}
        borderBottom="1px"
        borderColor="gray.200"
        bg="white"
        position="sticky"
        top="0"
        zIndex="sticky"
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              {/* Logo or site name */}
              <Link href="/" _hover={{ textDecoration: 'none' }}>
                <Heading size="md" color="brand.500">All Party Rent</Heading>
              </Link>

              {/* Navigation links */}
              <Spacer />
              <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
                <Link href="/services" _hover={{ textDecoration: 'none' }}>
                  <Text fontWeight="medium">Services</Text>
                </Link>
                <Link href="/how-it-works" _hover={{ textDecoration: 'none' }}>
                  <Text fontWeight="medium">How it works</Text>
                </Link>
                <Link href="/prices" _hover={{ textDecoration: 'none' }}>
                  <Text fontWeight="medium">Pricing</Text>
                </Link>
                <Link href="/about" _hover={{ textDecoration: 'none' }}>
                  <Text fontWeight="medium">About</Text>
                </Link>
                <Link href="/contact" _hover={{ textDecoration: 'none' }}>
                  <Text fontWeight="medium">Contact</Text>
                </Link>
              </HStack>
            </HStack>

            <HStack spacing={4}>
              {/* Chat Messages Icon with Notification Badge */}
              {isLoggedIn && (
                <Box position="relative" cursor="pointer" onClick={() => router.push('/chats')}>
                  <IconButton
                    aria-label="Messages"
                    icon={<FaComment />}
                    variant="ghost"
                    colorScheme="brand"
                    size="md"
                  />
                  {unreadMessages > 0 && (
                    <Badge
                      position="absolute"
                      top="-2px"
                      right="-2px"
                      borderRadius="full"
                      bg="red.500"
                      color="white"
                      fontSize="xs"
                      boxSize="1.25rem"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {unreadMessages}
                    </Badge>
                  )}
                </Box>
              )}

              {/* User menu or login button */}
              {isLoggedIn ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded={'full'}
                    variant={'link'}
                    cursor={'pointer'}
                    minW={0}>
                    <Avatar
                      size={'sm'}
                      name={session?.user?.name}
                    />
                  </MenuButton>
                  <MenuList>
                    {session?.user?.role === 'CLIENT' && (
                      <MenuItem onClick={() => router.push('/client/cabinet')}>
                        Client Cabinet
                      </MenuItem>
                    )}
                    {session?.user?.role === 'PROVIDER' && (
                      <>
                        <MenuItem onClick={() => router.push('/provider/cabinet')}>
                          Provider Cabinet
                        </MenuItem>
                        <MenuItem onClick={() => router.push('/provider/settings/payments')}>
                          Payments
                        </MenuItem>
                      </>
                    )}
                    <MenuItem onClick={() => router.push('/chats')}>Messages</MenuItem>
                    <MenuItem onClick={() => router.push('/profile')}>Profile</MenuItem>
                    {session?.user?.role === 'CLIENT' && (
                      <MenuItem onClick={() => router.push('/client/transactions')}>
                        Transactions
                      </MenuItem>
                    )}
                    <MenuDivider />
                    <MenuItem onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <Button colorScheme="brand" onClick={onOpen}>Sign In</Button>
              )}

              {/* Mobile menu button - visible only on smaller screens */}
              <IconButton
                display={{ base: 'flex', md: 'none' }}
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                onClick={toggleMobileNav}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isMobileNavOpen} placement="right" onClose={onMobileNavClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch" mt={4}>
              <Link href="/services" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                <Text fontWeight="medium">Services</Text>
              </Link>
              <Link href="/how-it-works" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                <Text fontWeight="medium">How it works</Text>
              </Link>
              <Link href="/prices" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                <Text fontWeight="medium">Pricing</Text>
              </Link>
              <Link href="/about" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                <Text fontWeight="medium">About</Text>
              </Link>
              <Link href="/contact" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                <Text fontWeight="medium">Contact</Text>
              </Link>
              
              {isLoggedIn && (
                <>
                  <Link href="/chats" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                    <HStack>
                      <FaComment />
                      <Text fontWeight="medium">Messages</Text>
                      {unreadMessages > 0 && (
                        <Badge colorScheme="red" borderRadius="full">
                          {unreadMessages}
                        </Badge>
                      )}
                    </HStack>
                  </Link>
                  
                  {session?.user?.role === 'CLIENT' && (
                    <>
                      <Link href="/client/cabinet" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                        <Text fontWeight="medium">Client Cabinet</Text>
                      </Link>
                      <Link href="/client/transactions" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                        <Text fontWeight="medium">Transactions</Text>
                      </Link>
                    </>
                  )}
                  
                  {session?.user?.role === 'PROVIDER' && (
                    <>
                      <Link href="/provider/cabinet" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                        <Text fontWeight="medium">Provider Cabinet</Text>
                      </Link>
                      <Link href="/provider/settings/payments" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                        <Text fontWeight="medium">Payments</Text>
                      </Link>
                    </>
                  )}
                  
                  <Link href="/profile" _hover={{ textDecoration: 'none' }} onClick={onMobileNavClose}>
                    <Text fontWeight="medium">Profile</Text>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    colorScheme="red" 
                    onClick={() => {
                      onMobileNavClose();
                      signOut({ callbackUrl: '/' });
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              )}
              
              {!isLoggedIn && (
                <Button colorScheme="brand" onClick={() => {
                  onMobileNavClose();
                  onOpen();
                }}>
                  Sign In
                </Button>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Header; 