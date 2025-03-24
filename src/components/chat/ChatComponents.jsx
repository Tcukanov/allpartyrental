"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Flex, 
  VStack, 
  HStack, 
  Text, 
  Input, 
  Button, 
  Avatar, 
  Divider, 
  Badge, 
  IconButton,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { 
  ArrowUpIcon, 
  WarningIcon, 
  InfoIcon, 
  ChatIcon
} from '@chakra-ui/icons';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';

let socket;

const ChatComponent = ({ chatId, offerId }) => {
  const { data: session } = useSession();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Initialize socket connection
  useEffect(() => {
    if (!session || !session.user || !chatId) return;
    
    // Fetch existing messages first
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chats/${chatId}`);
        const data = await response.json();
        
        if (data.success) {
          setMessages(data.data.messages || []);
        } else {
          throw new Error(data.error.message || 'Failed to fetch messages');
        }
      } catch (error) {
        console.error('Fetch messages error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // Initialize Socket.io
    if (!socket) {
      socket = io({
        path: '/api/socket',
        auth: {
          token: session.accessToken,
        },
      });
      
      socket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');
      });
      
      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });
      
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        toast({
          title: 'Connection Error',
          description: error.message || 'Failed to connect to chat server',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    }
    
    // Join chat room
    socket.emit('join:chat', chatId);
    
    // Listen for new messages
    socket.on('message:received', (message) => {
      setMessages((prev) => [...prev, message]);
    });
    
    // User typing indicator
    socket.on('user:typing', (data) => {
      if (data.userId !== session.user.id) {
        setIsTyping(true);
        
        // Reset typing indicator after 3 seconds
        setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    });
    
    // Cleanup function
    return () => {
      if (socket) {
        socket.emit('leave:chat', chatId);
        socket.off('message:received');
        socket.off('user:typing');
      }
    };
  }, [session, chatId, toast]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected) return;
    
    // Get recipient ID (the other person in the chat)
    const offer = messages.length > 0 ? messages[0].offer : null;
    const recipientId = offer
      ? offer.clientId === session.user.id
        ? offer.providerId
        : offer.clientId
      : null;
    
    // Emit message to socket server
    socket.emit('message:send', {
      chatId,
      content: newMessage,
      receiverId: recipientId,
    });
    
    // Clear input
    setNewMessage('');
  };
  
  // Handle typing indication
  const handleTyping = () => {
    if (isConnected) {
      socket.emit('user:typing', {
        chatId,
        userId: session.user.id,
      });
    }
  };
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      height="600px"
      display="flex"
      flexDirection="column"
    >
      {/* Chat Header */}
      <Flex
        p={4}
        borderBottomWidth="1px"
        align="center"
        justify="space-between"
        bg="gray.50"
      >
        <HStack>
          <ChatIcon color="brand.500" />
          <Text fontWeight="bold">Chat</Text>
          {!isConnected && (
            <Badge colorScheme="red">Offline</Badge>
          )}
        </HStack>
        
        <HStack spacing={2}>
          <Tooltip label="Messages are moderated for safety">
            <InfoIcon color="gray.500" />
          </Tooltip>
        </HStack>
      </Flex>
      
      {/* Messages Area */}
      <VStack 
        flex="1" 
        overflowY="auto" 
        p={4} 
        spacing={4}
        align="stretch"
      >
        {isLoading ? (
          <Flex justify="center" align="center" height="100%">
            <Text>Loading messages...</Text>
          </Flex>
        ) : messages.length === 0 ? (
          <Flex justify="center" align="center" height="100%">
            <Text color="gray.500">No messages yet. Start the conversation!</Text>
          </Flex>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === session.user.id;
            
            return (
              <Flex
                key={message.id}
                justify={isCurrentUser ? 'flex-end' : 'flex-start'}
              >
                <Box
                  maxW="70%"
                  bg={isCurrentUser ? 'brand.100' : 'gray.100'}
                  p={3}
                  borderRadius="lg"
                  position="relative"
                >
                  {!isCurrentUser && (
                    <HStack mb={1}>
                      <Avatar 
                        size="xs" 
                        name={message.sender?.name} 
                        src={message.sender?.profile?.avatar} 
                      />
                      <Text fontWeight="bold" fontSize="sm">
                        {message.sender?.name}
                      </Text>
                    </HStack>
                  )}
                  
                  <Text>{message.content}</Text>
                  
                  <HStack spacing={1} mt={1} justify="flex-end">
                    <Text fontSize="xs" color="gray.500">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </Text>
                    
                    {message.isModerated && (
                      <Tooltip label="This message was moderated for safety">
                        <WarningIcon color="orange.500" fontSize="xs" />
                      </Tooltip>
                    )}
                  </HStack>
                </Box>
              </Flex>
            );
          })
        )}
        
        {isTyping && (
          <Flex justify="flex-start">
            <Box bg="gray.100" p={3} borderRadius="lg">
              <Text fontSize="sm">Typing...</Text>
            </Box>
          </Flex>
        )}
        
        {/* This empty div is used for scrolling to the bottom */}
        <div ref={messagesEndRef} />
      </VStack>
      
      {/* Message Input */}
      <Box p={4} borderTopWidth="1px">
        <form onSubmit={handleSendMessage}>
          <HStack>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleTyping}
              placeholder="Type a message..."
              borderRadius="full"
              isDisabled={!isConnected}
            />
            <IconButton
              icon={<ArrowUpIcon />}
              colorScheme="brand"
              borderRadius="full"
              type="submit"
              isDisabled={!newMessage.trim() || !isConnected}
              aria-label="Send message"
            />
          </HStack>
        </form>
      </Box>
    </Box>
  );
};

export default ChatComponent;