'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Avatar,
  useToast,
  Spinner,
  Divider,
  Flex,
  Heading,
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    name: string;
    email: string;
  };
  receiver: {
    name: string;
    email: string;
  };
}

interface Chat {
  id: string;
  clientId: string;
  providerId: string;
  client: {
    name: string;
    email: string;
  };
  provider: {
    name: string;
    email: string;
  };
  messages: Message[];
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchChat();
    }
  }, [status, router, params.id]);

  // Fetch chat data
  const fetchChat = async () => {
    try {
      setLoading(true);
      console.log('Fetching chat with ID:', params.id);
      
      const response = await fetch(`/api/chats/${params.id}`);
      const responseData = await response.json();
      
      console.log('Chat API response:', responseData);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${responseData.error?.message || 'Failed to fetch chat'}`);
      }
      
      if (responseData.success === false) {
        throw new Error(responseData.error?.message || 'Failed to fetch chat');
      }
      
      const chatData = responseData.success ? responseData.data : responseData;
      
      if (!chatData || !chatData.id) {
        throw new Error('Invalid chat data received');
      }
      
      setChat(chatData);
    } catch (err) {
      console.error('Error fetching chat:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load chat',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !chat) return;
    
    setSending(true);
    
    try {
      const response = await fetch(`/api/chats/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          receiverId: session?.user?.id === chat.clientId ? chat.providerId : chat.clientId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${data.error?.message || 'Failed to send message'}`);
      }
      
      if (data.success === false) {
        throw new Error(data.error?.message || 'Failed to send message');
      }
      
      // Update the chat with the new message
      const newMessageData = data.success ? data.data : data.message;
      
      setChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessageData],
      } : null);
      
      setNewMessage('');
      
      toast({
        title: 'Success',
        description: 'Message sent successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading chat...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  if (error || !chat) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
          <Heading size="md" mb={4} color="red.500">Failed to load chat</Heading>
          <Text color="red.500" mb={4}>{error || 'Chat not found'}</Text>
          <Button onClick={fetchChat} colorScheme="blue">
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  const otherUser = session?.user?.id === chat.clientId ? chat.provider : chat.client;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch" height="calc(100vh - 200px)">
        {/* Chat Header */}
        <HStack spacing={4} p={4} borderWidth="1px" borderRadius="md">
          <Avatar name={otherUser?.name} />
          <Box>
            <Text fontWeight="bold">{otherUser?.name}</Text>
            <Text fontSize="sm" color="gray.500">{otherUser?.email}</Text>
          </Box>
        </HStack>

        {/* Messages */}
        <Box flex={1} overflowY="auto" p={4} borderWidth="1px" borderRadius="md">
          {chat.messages && chat.messages.length > 0 ? (
            <VStack spacing={4} align="stretch">
              {chat.messages.map((message) => (
                <Box
                  key={message.id}
                  alignSelf={message.senderId === session?.user?.id ? 'flex-end' : 'flex-start'}
                  maxW="70%"
                >
                  <Box
                    bg={message.senderId === session?.user?.id ? 'blue.500' : 'gray.100'}
                    color={message.senderId === session?.user?.id ? 'white' : 'black'}
                    p={3}
                    borderRadius="lg"
                  >
                    <Text>{message.content}</Text>
                    <Text fontSize="xs" mt={1} opacity={0.7}>
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </Text>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </VStack>
          ) : (
            <Flex justify="center" align="center" h="100%">
              <Text color="gray.500">No messages yet. Start the conversation!</Text>
            </Flex>
          )}
        </Box>

        {/* Message Input */}
        <form onSubmit={handleSendMessage}>
          <HStack spacing={2}>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
            />
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={sending}
              loadingText="Sending"
              isDisabled={!newMessage.trim()}
            >
              Send
            </Button>
          </HStack>
        </form>
      </VStack>
    </Container>
  );
} 