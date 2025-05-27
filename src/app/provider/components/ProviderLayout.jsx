'use client';

import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  IconButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  useColorModeValue,
  Tooltip,
  Link as ChakraLink,
  Icon
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  ChevronDownIcon,
  SettingsIcon,
  CalendarIcon,
  BellIcon
} from '@chakra-ui/icons';
import {
  FiHome,
  FiCalendar,
  FiPackage,
  FiUsers,
  FiDollarSign,
  FiSettings,
  FiUser,
  FiLogOut,
  FiBarChart3,
  FiMessageSquare,
  FiStar,
  FiCreditCard,
  FiFileText,
  FiShield
} from 'react-icons/fi';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const ProviderLayout = ({ children }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');

  // Navigation items
  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/provider/dashboard',
      icon: FiHome,
      description: 'Overview & analytics'
    },
    {
      label: 'Calendar',
      href: '/provider/dashboard/calendar',
      icon: FiCalendar,
      description: 'Schedule & availability'
    },
    {
      label: 'Services',
      href: '/provider/dashboard/services',
      icon: FiPackage,
      description: 'Manage your services'
    },
    {
      label: 'Bookings',
      href: '/provider/dashboard/bookings',
      icon: FiUsers,
      description: 'Customer bookings'
    },
    {
      label: 'Payments',
      href: '/provider/dashboard/payments',
      icon: FiDollarSign,
      description: 'Earnings & transactions'
    },
    {
      label: 'Messages',
      href: '/provider/dashboard/messages',
      icon: FiMessageSquare,
      description: 'Customer communications'
    },
    {
      label: 'Reviews',
      href: '/provider/dashboard/reviews',
      icon: FiStar,
      description: 'Customer feedback'
    },
    {
      label: 'Analytics',
      href: '/provider/dashboard/analytics',
      icon: FiBarChart3,
      description: 'Business insights'
    }
  ];

  const settingsItems = [
    {
      label: 'Profile',
      href: '/provider/dashboard/profile',
      icon: FiUser,
      description: 'Business profile'
    },
    {
      label: 'Account Settings',
      href: '/provider/dashboard/settings',
      icon: FiSettings,
      description: 'Account preferences'
    },
    {
      label: 'Payment Settings',
      href: '/provider/dashboard/payment-settings',
      icon: FiCreditCard,
      description: 'Payment configuration'
    },
    {
      label: 'Security',
      href: '/provider/dashboard/security',
      icon: FiShield,
      description: 'Security settings'
    }
  ];

  const isActivePath = (href) => {
    if (href === '/provider/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const NavItem = ({ item, isCollapsed = false }) => (
    <Tooltip 
      label={isCollapsed ? `${item.label} - ${item.description}` : ''} 
      placement="right"
      isDisabled={!isCollapsed}
    >
      <ChakraLink
        as={Link}
        href={item.href}
        display="block"
        w="full"
        p={3}
        borderRadius="lg"
        bg={isActivePath(item.href) ? 'blue.50' : 'transparent'}
        color={isActivePath(item.href) ? 'blue.600' : 'gray.600'}
        borderLeft="3px solid"
        borderLeftColor={isActivePath(item.href) ? 'blue.500' : 'transparent'}
        _hover={{
          bg: 'blue.50',
          color: 'blue.600',
          borderLeftColor: 'blue.500',
          textDecoration: 'none'
        }}
        transition="all 0.2s"
      >
        <HStack spacing={3}>
          <Icon as={item.icon} boxSize={5} />
          {!isCollapsed && (
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium" fontSize="sm">
                {item.label}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {item.description}
              </Text>
            </VStack>
          )}
        </HStack>
      </ChakraLink>
    </Tooltip>
  );

  const SidebarContent = ({ isCollapsed = false }) => (
    <VStack spacing={6} align="stretch" h="full">
      {/* Logo */}
      <Box p={4}>
        {isCollapsed ? (
          <Text fontSize="xl" fontWeight="bold" color="blue.600" textAlign="center">
            AP
          </Text>
        ) : (
          <Text fontSize="xl" fontWeight="bold" color="blue.600">
            AllPartyRent
          </Text>
        )}
      </Box>

      {/* Main Navigation */}
      <VStack spacing={2} align="stretch" flex="1" px={4}>
        <Text 
          fontSize="xs" 
          fontWeight="bold" 
          color="gray.400" 
          textTransform="uppercase" 
          letterSpacing="wider"
          mb={2}
        >
          {isCollapsed ? '—' : 'Main'}
        </Text>
        {navigationItems.map((item) => (
          <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}

        {/* Settings Section */}
        <Text 
          fontSize="xs" 
          fontWeight="bold" 
          color="gray.400" 
          textTransform="uppercase" 
          letterSpacing="wider"
          mb={2}
          mt={6}
        >
          {isCollapsed ? '—' : 'Settings'}
        </Text>
        {settingsItems.map((item) => (
          <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}
      </VStack>

      {/* User Info */}
      <Box p={4} borderTop="1px" borderColor={borderColor}>
        {isCollapsed ? (
          <Flex justify="center">
            <Avatar size="sm" name={session?.user?.name} src={session?.user?.image} />
          </Flex>
        ) : (
          <HStack spacing={3}>
            <Avatar size="sm" name={session?.user?.name} src={session?.user?.image} />
            <VStack align="start" spacing={0} flex="1">
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {session?.user?.name || 'Provider'}
              </Text>
              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                {session?.user?.email}
              </Text>
            </VStack>
          </HStack>
        )}
      </Box>
    </VStack>
  );

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Desktop Sidebar */}
      <Box
        display={{ base: 'none', lg: 'block' }}
        position="fixed"
        left={0}
        top={0}
        w="280px"
        h="100vh"
        bg={sidebarBg}
        borderRight="1px"
        borderColor={borderColor}
        zIndex={1000}
      >
        <SidebarContent />
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={sidebarBg}>
          <DrawerCloseButton />
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box ml={{ base: 0, lg: '280px' }}>
        {/* Top Header */}
        <Flex
          bg={bgColor}
          borderBottom="1px"
          borderColor={borderColor}
          h="70px"
          align="center"
          justify="space-between"
          px={6}
          position="sticky"
          top={0}
          zIndex={999}
        >
          {/* Mobile Menu Button */}
          <IconButton
            display={{ base: 'block', lg: 'none' }}
            onClick={onOpen}
            variant="outline"
            aria-label="Open menu"
            icon={<HamburgerIcon />}
          />

          {/* Desktop Title */}
          <Box display={{ base: 'none', lg: 'block' }}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.800">
              Provider Dashboard
            </Text>
          </Box>

          {/* Right Side Actions */}
          <HStack spacing={4}>
            {/* Notifications */}
            <IconButton
              aria-label="Notifications"
              icon={<BellIcon />}
              variant="ghost"
              position="relative"
            >
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="0"
                right="0"
                fontSize="xs"
                w="5"
                h="5"
              >
                3
              </Badge>
            </IconButton>

            {/* User Menu */}
            <Menu>
              <MenuButton as={Button} variant="ghost" rightIcon={<ChevronDownIcon />}>
                <HStack spacing={2}>
                  <Avatar size="sm" name={session?.user?.name} src={session?.user?.image} />
                  <Text display={{ base: 'none', md: 'block' }}>
                    {session?.user?.name || 'Provider'}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem as={Link} href="/provider/dashboard/profile" icon={<Icon as={FiUser} />}>
                  Profile
                </MenuItem>
                <MenuItem as={Link} href="/provider/dashboard/settings" icon={<Icon as={FiSettings} />}>
                  Settings
                </MenuItem>
                <MenuDivider />
                <MenuItem 
                  icon={<Icon as={FiLogOut} />}
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Page Content */}
        <Box>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default ProviderLayout; 