import { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  Divider,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';

export default function ChatComponent({ offer, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!offer?.id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chat/${offer.id}`);
        const data = await response.json();
        
        if (data.success) {
          setMessages(data.messages);
        } else {
          throw new Error(data.error.message || 'Failed to fetch chat history');
        }
      } catch (error) {
        console.error('Fetch chat error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat history',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [offer?.id, toast]);

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !offer?.id) return;

    try {
      const response = await fetch(`/api/chat/${offer.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      } else {
        throw new Error(data.error.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  return (
    <Box h="500px" display="flex" flexDirection="column">
      <Box p={4} borderBottom="1px" borderColor="gray.200">
        <Text fontWeight="bold">Chat with {offer?.serviceProvider?.name}</Text>
      </Box>

      <Box flex={1} overflowY="auto" p={4}>
        <VStack spacing={4} align="stretch">
          {messages.map((message, index) => (
            <HStack
              key={index}
              spacing={3}
              align="flex-start"
              justify={message.isClient ? 'flex-end' : 'flex-start'}
            >
              {!message.isClient && (
                <Avatar size="sm" name={offer?.serviceProvider?.name} />
              )}
              <Box
                maxW="70%"
                bg={message.isClient ? 'brand.500' : 'gray.100'}
                color={message.isClient ? 'white' : 'gray.800'}
                p={3}
                borderRadius="lg"
                position="relative"
              >
                <Text>{message.content}</Text>
                <Text fontSize="xs" color={message.isClient ? 'whiteAlpha.800' : 'gray.500'} mt={1}>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </Text>
              </Box>
            </HStack>
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Box p={4} borderTop="1px" borderColor="gray.200">
        <form onSubmit={handleSendMessage}>
          <HStack>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              size="md"
            />
            <Button
              type="submit"
              colorScheme="brand"
              leftIcon={<ArrowForwardIcon />}
              isDisabled={!newMessage.trim()}
            >
              Send
            </Button>
          </HStack>
        </form>
      </Box>
    </Box>
  );
} 