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
import { io } from 'socket.io-client';

let socket;

const NotificationComponent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize socket connection and fetch notifications
  useEffect(() => {
    if (!session || !session.user) return;
    
    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/notifications');
        const data = await response.json();
        
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.data.filter(n => !n.isRead).length);
        } else {
          throw new Error(data.error.message || 'Failed to fetch notifications');
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
    
    // Initialize Socket.io
    if (!socket) {
      socket = io({
        path: '/api/socket',
        auth: {
          token: session.accessToken,
        },
      });
      
      socket.on('connect', () => {
        console.log('Socket connected for notifications');
      });
      
      socket.on('notification:new', (notification) => {
        // Add new notification to state
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast for new notification
        toast({
          title: notification.title,
          description: notification.content,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      });
    }
    
    // Cleanup function
    return () => {
      if (socket) {
        socket.off('notification:new');
      }
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
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'NEW_OFFER':
        router.push('/client/my-party');
        break;
      case 'OFFER_UPDATED':
        router.push('/client/my-party');
        break;
      case 'MESSAGE':
        if (notification.chatId) {
          router.push(`/chats/${notification.chatId}`);
        }
        break;
      case 'PAYMENT':
        router.push('/client/my-party');
        break;
      default:
        // For SYSTEM or other types, no navigation
        break;
    }
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type) => {
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
        return <WarningIcon color="red.500" />;
      default:
        return <InfoIcon color="gray.500" />;
    }
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
                  bg={notification.isRead ? 'white' : 'gray.50'}
                  _hover={{ bg: 'gray.100' }}
                  cursor="pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <HStack spacing={3} align="start">
                    <Box mt={1}>
                      {getNotificationIcon(notification.type)}
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
                        <Badge colorScheme="blue" mt={1} size="sm">
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