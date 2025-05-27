"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Popover, 
  PopoverTrigger, 
  PopoverContent, 
  PopoverBody, 
  PopoverHeader, 
  IconButton, 
  Text, 
  VStack, 
  HStack, 
  Button, 
  Divider, 
  Badge,
  Flex,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { BellIcon, TimeIcon, InfoIcon, WarningIcon, CheckIcon } from '@chakra-ui/icons';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

const NotificationComponent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (!session || !session.user) return;
    
    console.log(`Notification component effect runs for ${session.user.role} user:`, session.user.name);
    
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching notifications for user:', session.user.id);
        const response = await fetch('/api/notifications');
        
        if (!response.ok) {
          console.error('Notification fetch error:', response.status, response.statusText);
          throw new Error(`Failed to fetch notifications: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log(`Fetched ${data.data.length} notifications for ${session.user.role}:`, data.data);
          setNotifications(data.data || []);
          setUnreadCount(data.data.filter(n => !n.isRead).length);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch notifications');
        }
      } catch (error) {
        console.error('Fetch notifications error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load notifications',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Temporarily disable socket.io initialization to avoid connection errors
    // TODO: Re-implement socket.io properly for real-time notifications
    console.log('Socket.io temporarily disabled - using polling only');
    
    // Poll for new notifications every 10 seconds instead of 30
    const pollingInterval = setInterval(fetchNotifications, 10000);
    
    return () => {
      console.log('Notification component cleanup. User:', session?.user?.name);
      clearInterval(pollingInterval);
    };
  }, [session, toast]);
  
  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update notification in state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        
        // Decrease unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        throw new Error(data.error.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update all notifications in state
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
      } else {
        throw new Error(data.error.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
    }
  };
  
  // Handle notification click (navigate to relevant page)
  const handleNotificationClick = (notification) => {
    // Mark as read
    handleMarkAsRead(notification.id);
    
    // Close popover
    setIsOpen(false);
    
    // Navigate based on notification type and user role
    const userRole = session?.user?.role;
    
    switch (notification.type) {
      case 'NEW_OFFER':
        if (userRole === 'CLIENT') {
          router.push('/client/my-party');
        } else if (userRole === 'ADMIN') {
          router.push('/admin/transactions');
        }
        break;
      case 'OFFER_UPDATED':
        if (userRole === 'CLIENT') {
          router.push('/client/my-party');
        } else if (userRole === 'ADMIN') {
          router.push('/admin/transactions');
        }
        break;
      case 'MESSAGE':
        if (notification.chatId) {
          router.push(`/chats/${notification.chatId}`);
        } else {
          // Try to extract chat ID from the content
          const chatIdMatch = notification.content.match(/chat ID: ([a-zA-Z0-9]+)/);
          if (chatIdMatch && chatIdMatch[1]) {
            router.push(`/chats/${chatIdMatch[1]}`);
          } else {
            router.push('/chats');
          }
        }
        break;
      case 'PAYMENT':
        if (userRole === 'CLIENT') {
          router.push('/client/my-party');
        } else if (userRole === 'ADMIN') {
          router.push('/admin/finances');
        }
        break;
      case 'SYSTEM':
        // Handle system notifications based on content
        const content = notification.content.toLowerCase();
        
        if (userRole === 'ADMIN') {
          if (content.includes('transaction') || content.includes('payment')) {
            router.push('/admin/transactions');
          } else if (content.includes('user') || content.includes('account')) {
            router.push('/admin/users');
          } else if (content.includes('service')) {
            router.push('/admin/services');
          } else {
            router.push('/admin/dashboard');
          }
        } else if (userRole === 'PROVIDER') {
          if (content.includes('request')) {
            router.push('/provider/requests');
          } else if (content.includes('service')) {
            router.push('/provider/services');
          } else if (content.includes('transaction')) {
            router.push('/provider/requests');
          }
        } else if (userRole === 'CLIENT') {
          if (content.includes('approved')) {
            router.push('/client/my-party');
          } else if (content.includes('transaction')) {
            router.push('/client/transactions');
          }
        }
        break;
      default:
        // Default route based on user role if notification type not handled
        if (userRole === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (userRole === 'PROVIDER') {
          router.push('/provider/cabinet');
        } else if (userRole === 'CLIENT') {
          router.push('/client/cabinet');
        }
        break;
    }
  };
  
  // Get icon for notification type
  const getNotificationIcon = (notification) => {
    const type = notification.type;
    const content = notification.content.toLowerCase();
    
    // Check if it's a positive notification
    const isPositive = content.includes('approved') || 
                      content.includes('success') ||
                      content.includes('completed') ||
                      content.includes('confirmed');
    
    switch (type) {
      case 'NEW_OFFER':
        return <InfoIcon color="blue.500" />;
      case 'OFFER_UPDATED':
        return <InfoIcon color="purple.500" />;
      case 'MESSAGE':
        return <InfoIcon color="green.500" />;
      case 'PAYMENT':
        return <InfoIcon color="orange.500" />;
      case 'SYSTEM':
        return isPositive 
          ? <CheckIcon color="green.500" /> 
          : <WarningIcon color="red.500" />;
      default:
        return <InfoIcon color="gray.500" />;
    }
  };
  
  // Get the appropriate background color for notifications
  const getNotificationBackground = (notification) => {
    const content = notification.content.toLowerCase();
    const isPositive = content.includes('approved') || 
                      content.includes('success') ||
                      content.includes('completed') ||
                      content.includes('confirmed');
    
    if (!notification.isRead) {
      return isPositive ? 'green.50' : 'gray.50';
    }
    
    return 'white';
  };
  
  // Check if a notification is positive (success, approval, etc.)
  const isPositiveNotification = (notification) => {
    const content = notification.content.toLowerCase();
    return content.includes('approved') || 
          content.includes('success') ||
          content.includes('completed') ||
          content.includes('confirmed');
  };
  
  return (
    <Popover
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
    >
      <PopoverTrigger>
        <Box position="relative">
          <IconButton
            aria-label="Notifications"
            icon={<BellIcon />}
            variant="ghost"
            size="md"
          />
          {unreadCount > 0 && (
            <Badge
              colorScheme="red"
              borderRadius="full"
              position="absolute"
              top="-2px"
              right="-2px"
              fontSize="xs"
              minW="18px"
              textAlign="center"
            >
              {unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      
      <PopoverContent width="350px" maxH="500px">
        <PopoverHeader fontWeight="bold" display="flex" justifyContent="space-between" alignItems="center">
          <Text>Notifications</Text>
          {unreadCount > 0 && (
            <Button size="xs" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </PopoverHeader>
        
        <PopoverBody p={0} overflowY="auto" maxH="400px">
          {isLoading ? (
            <Flex justify="center" align="center" p={4}>
              <Spinner size="sm" mr={2} />
              <Text>Loading notifications...</Text>
            </Flex>
          ) : notifications.length === 0 ? (
            <Box p={4} textAlign="center">
              <Text color="gray.500">No notifications yet</Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch">
              {notifications.map((notification) => (
                <Box 
                  key={notification.id} 
                  p={3}
                  bg={getNotificationBackground(notification)}
                  _hover={{ bg: 'gray.100' }}
                  cursor="pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <HStack spacing={3} align="start">
                    <Box mt={1}>
                      {getNotificationIcon(notification)}
                    </Box>
                    
                    <Box flex="1">
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold" fontSize="sm">{notification.title}</Text>
                        <Text fontSize="xs" color="gray.500">
                          <TimeIcon mr={1} />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Text>
                      </Flex>
                      
                      <Text fontSize="sm" noOfLines={2}>
                        {notification.content}
                      </Text>
                      
                      {!notification.isRead && (
                        <Badge colorScheme={isPositiveNotification(notification) ? "green" : "blue"} mt={1} size="sm">
                          New
                        </Badge>
                      )}
                    </Box>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationComponent;