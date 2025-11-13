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
  FiZap,
  FiFilter,
  FiTag,
  FiAlertCircle,
  FiFileText,
  FiMap,
  FiUserCheck,
} from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import NotificationComponent from '@/components/notification/notificationComponent';

export const AdminNavbarItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: FiHome,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: FiUsers,
  },
  {
    label: 'Provider Applications',
    href: '/admin/providers',
    icon: FiUserCheck,
  },
  {
    label: 'Services',
    href: '/admin/services',
    icon: FiTag,
  },
  {
    label: 'Service Approvals',
    href: '/admin/services/approval',
    icon: FiAlertCircle,
  },
  {
    label: 'Transactions',
    href: '/admin/transactions',
    icon: FiDollarSign,
  },
  {
    label: 'Locations',
    href: '/admin/locations',
    icon: FiMap,
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: FiServer,
  },
  {
    label: 'Category Filters',
    href: '/admin/category-filters',
    icon: FiFilter,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: FiFileText,
  },
  {
    label: 'Activity Logs',
    href: '/admin/activity',
    icon: FiActivity,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: FiSettings,
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
              <Link as={NextLink} href="/admin/dashboard" _hover={{ textDecoration: 'none' }}>
                <Flex align="center">
                  <Icon as={FiZap} w={6} h={6} color="brand.500" mr={2} />
                  <Text fontWeight="bold" fontSize="lg">AllPartyAdmin</Text>
                </Flex>
              </Link>
            </Box>
            
            <Box 
              as="nav" 
              display={{ base: 'none', md: 'block' }}
              maxW={{ md: "calc(100vw - 400px)", lg: "100%" }}
              overflowX="auto"
              sx={{
                '&::-webkit-scrollbar': {
                  height: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '6px',
                },
              }}
            >
              <Stack spacing={1}>
                {/* First row of items */}
                <Flex>
                  {AdminNavbarItems.slice(0, 6).map((navItem) => (
                    <Link
                      key={navItem.label}
                      as={NextLink}
                      href={navItem.href}
                      px={2}
                      py={1}
                      mx={1}
                      rounded="md"
                      color={pathname === navItem.href ? 'blue.500' : 'gray.500'}
                      fontWeight={pathname === navItem.href ? 'bold' : 'normal'}
                      whiteSpace="nowrap"
                      _hover={{
                        textDecoration: 'none',
                        color: 'blue.500',
                      }}
                    >
                      <HStack spacing={1}>
                        <Icon as={navItem.icon} />
                        <Text fontSize="sm">{navItem.label}</Text>
                      </HStack>
                    </Link>
                  ))}
                </Flex>
                
                {/* Second row of items */}
                <Flex>
                  {AdminNavbarItems.slice(6).map((navItem) => (
                    <Link
                      key={navItem.label}
                      as={NextLink}
                      href={navItem.href}
                      px={2}
                      py={1}
                      mx={1}
                      rounded="md"
                      color={pathname === navItem.href ? 'blue.500' : 'gray.500'}
                      fontWeight={pathname === navItem.href ? 'bold' : 'normal'}
                      whiteSpace="nowrap"
                      _hover={{
                        textDecoration: 'none',
                        color: 'blue.500',
                      }}
                    >
                      <HStack spacing={1}>
                        <Icon as={navItem.icon} />
                        <Text fontSize="sm">{navItem.label}</Text>
                      </HStack>
                    </Link>
                  ))}
                </Flex>
              </Stack>
            </Box>
          </HStack>
          
          <Flex alignItems="center">
            <NotificationComponent />
            
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
              {AdminNavbarItems.map((navItem) => (
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