'use client';

import React from 'react';
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
  useColorModeValue,
  Stack,
  Container,
  Text,
  Link,
  Badge,
  Avatar,
  Icon,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  FiMenu,
  FiX,
  FiHome,
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiSettings,
  FiServer,
  FiBell,
  FiLogOut,
  FiUser,
  FiHelpCircle,
} from 'react-icons/fi';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: FiHome,
  },
  {
    label: 'Transactions',
    href: '/admin/transactions',
    icon: FiDollarSign,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: FiUsers,
  },
  {
    label: 'Finances',
    href: '/admin/finances',
    icon: FiActivity,
  },
  {
    label: 'System Status',
    href: '/admin/system',
    icon: FiServer,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: FiSettings,
  },
  {
    label: 'Documentation',
    href: '/admin/docs',
    icon: FiHelpCircle,
  },
];

export default function AdminNavbar() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      bg={bgColor}
      borderBottom={1}
      borderStyle="solid"
      borderColor={borderColor}
      px={4}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <IconButton
            size="md"
            icon={isOpen ? <FiX /> : <FiMenu />}
            aria-label="Open Menu"
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          
          <HStack spacing={8} alignItems="center">
            <Box fontWeight="bold" fontSize="lg">
              <Link as={NextLink} href="/admin" _hover={{ textDecoration: 'none' }}>
                Admin Panel
              </Link>
            </Box>
            
            <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
              {NAV_ITEMS.map((navItem) => (
                <Link
                  key={navItem.label}
                  as={NextLink}
                  href={navItem.href}
                  px={2}
                  py={1}
                  rounded="md"
                  color={pathname === navItem.href ? 'blue.500' : 'gray.500'}
                  fontWeight={pathname === navItem.href ? 'bold' : 'normal'}
                  _hover={{
                    textDecoration: 'none',
                    color: 'blue.500',
                  }}
                >
                  <HStack spacing={1}>
                    <Icon as={navItem.icon} />
                    <Text>{navItem.label}</Text>
                  </HStack>
                </Link>
              ))}
            </HStack>
          </HStack>
          
          <Flex alignItems="center">
            <IconButton
              size="md"
              variant="ghost"
              aria-label="Notifications"
              icon={
                <>
                  <FiBell />
                  <Badge
                    position="absolute"
                    top="0"
                    right="0"
                    colorScheme="red"
                    variant="solid"
                    fontSize="0.6rem"
                    borderRadius="full"
                    transform="translate(25%, -25%)"
                  >
                    3
                  </Badge>
                </>
              }
              mr={2}
            />
            
            <Menu>
              <MenuButton
                as={Button}
                rounded="full"
                variant="link"
                cursor="pointer"
                minW={0}
              >
                <HStack>
                  <Avatar
                    size="sm"
                    name={session?.user?.name || 'Admin User'}
                    src={session?.user?.image}
                  />
                  <Box display={{ base: 'none', md: 'block' }}>
                    <Text fontWeight="medium" size="sm">
                      {session?.user?.name || 'Admin User'}
                    </Text>
                  </Box>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiUser />}>Profile</MenuItem>
                <MenuItem icon={<FiSettings />}>Settings</MenuItem>
                <MenuDivider />
                <MenuItem 
                  icon={<FiLogOut />} 
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
      </Container>

      {/* Mobile navigation drawer */}
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Admin Menu</DrawerHeader>

          <DrawerBody>
            <Stack spacing={4} mt={4}>
              {NAV_ITEMS.map((navItem) => (
                <Link
                  key={navItem.label}
                  as={NextLink}
                  href={navItem.href}
                  px={2}
                  py={3}
                  rounded="md"
                  color={pathname === navItem.href ? 'blue.500' : 'gray.600'}
                  fontWeight={pathname === navItem.href ? 'bold' : 'normal'}
                  _hover={{
                    textDecoration: 'none',
                    bg: 'gray.100',
                  }}
                  onClick={onClose}
                >
                  <HStack spacing={2}>
                    <Icon as={navItem.icon} boxSize={5} />
                    <Text>{navItem.label}</Text>
                  </HStack>
                </Link>
              ))}
              
              <Box pt={4} mt={4} borderTopWidth="1px">
                <Button
                  w="full"
                  leftIcon={<FiLogOut />}
                  onClick={() => signOut({ callbackUrl: '/' })}
                  colorScheme="red"
                  variant="outline"
                >
                  Sign Out
                </Button>
              </Box>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
} 