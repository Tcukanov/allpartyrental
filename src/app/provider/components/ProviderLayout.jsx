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
  FiBarChart,
  FiMessageSquare,
  FiStar,
  FiCreditCard,
  FiFileText,
  FiShield,
  FiMenu
} from 'react-icons/fi';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const ProviderLayout = ({ children }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');

  // Navigation items - only include pages that actually exist
  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/provider/dashboard',
      icon: FiHome,
      description: 'Overview & analytics'
    },
    {
      label: 'My Services',
      href: '/provider/services',
      icon: FiPackage,
      description: 'Manage your services'
    },
    {
      label: 'Requests',
      href: '/provider/requests',
      icon: FiUsers,
      description: 'Client booking requests'
    },
    {
      label: 'Transactions',
      href: '/provider/transactions',
      icon: FiDollarSign,
      description: 'Payment history & earnings'
    },
    {
      label: 'Calendar',
      href: '/provider/calendar',
      icon: FiCalendar,
      description: 'Schedule & availability'
    }
  ];

  const settingsItems = [
    {
      label: 'Payment Settings',
      href: '/provider/dashboard/paypal',
      icon: FiCreditCard,
      description: 'PayPal & payment setup'
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
            AllPartyRental
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
        w={sidebarCollapsed ? "80px" : "280px"}
        h="100vh"
        bg={sidebarBg}
        borderRight="1px"
        borderColor={borderColor}
        zIndex={1000}
        transition="width 0.3s ease"
      >
        <SidebarContent isCollapsed={sidebarCollapsed} />
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
      <Box ml={{ base: 0, lg: sidebarCollapsed ? '80px' : '280px' }} transition="margin-left 0.3s ease">
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
          <HStack spacing={3}>
            <IconButton
              display={{ base: 'block', lg: 'none' }}
              onClick={onOpen}
              variant="outline"
              aria-label="Open menu"
              icon={<HamburgerIcon />}
            />
            
            {/* Desktop Sidebar Toggle */}
            <IconButton
              display={{ base: 'none', lg: 'block' }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              variant="ghost"
              aria-label="Toggle sidebar"
              icon={<Icon as={FiMenu} />}
            />
          </HStack>

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
                <MenuItem as={Link} href="/provider/cabinet" icon={<Icon as={FiUser} />}>
                  Profile & Cabinet
                </MenuItem>
                <MenuItem as={Link} href="/provider/transactions" icon={<Icon as={FiDollarSign} />}>
                  Transactions
                </MenuItem>
                <MenuItem as={Link} href="/provider/dashboard/paypal" icon={<Icon as={FiCreditCard} />}>
                  PayPal Settings
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