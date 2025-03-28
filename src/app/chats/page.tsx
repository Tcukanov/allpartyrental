'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  Flex,
  Spinner,
  Button,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaComment } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface Chat {
  id: string;
  offerId: string;
  createdAt: string;
  updatedAt: string;
  offer: {
    client: {
      id: string;
      name: string;
      profile?: {
        avatar?: string;
      };
    };
    provider: {
      id: string;
      name: string;
      profile?: {
        avatar?: string;
      };
    };
    service?: {
      id: string;
      name: string;
      photos?: string[];
    };
  };
  messages: ChatMessage[];
}

interface ApiResponse {
  chats: Chat[];
  error?: string;
}

export default function ChatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchChats();
    }
  }, [status, router]);

  // Fetch chats from API
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch chats');
      }

      setChats(data.chats || []);
      setFilteredChats(data.chats || []);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load chats',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChats(chats);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = chats.filter(chat => {
        const isClient = session?.user?.id === chat.offer.client.id;
        const otherParty = isClient ? chat.offer.provider : chat.offer.client;
        const lastMessage = chat.messages.length > 0 ? chat.messages[0] : null;
        
        return (
          otherParty.name.toLowerCase().includes(term) ||
          (chat.offer.service?.name.toLowerCase().includes(term) || false) ||
          (lastMessage?.content.toLowerCase().includes(term) || false)
        );
      });
      setFilteredChats(filtered);
    }
  }, [searchTerm, chats, session]);

  // Format chats for display
  const formatChats = (chats: Chat[]) => {
    return chats.map(chat => {
      const isClient = session?.user?.id === chat.offer.client.id;
      const otherParty = isClient ? chat.offer.provider : chat.offer.client;
      const lastMessage = chat.messages.length > 0 ? chat.messages[0] : null;
      
      return {
        id: chat.id,
        otherParty: {
          id: otherParty.id,
          name: otherParty.name,
          avatar: otherParty.profile?.avatar || null
        },
        serviceName: chat.offer.service?.name || 'Service request',
        serviceImage: chat.offer.service?.photos?.[0] || null,
        lastMessage: lastMessage?.content || 'No messages yet',
        lastMessageDate: lastMessage?.createdAt || chat.createdAt,
        unread: 0 // This would be calculated from backend in a real implementation
      };
    });
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading your conversations...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box p={8} borderWidth="1px" borderRadius="lg" textAlign="center">
          <Heading size="md" mb={4} color="red.500">Error Loading Chats</Heading>
          <Text mb={4}>{error}</Text>
          <Button onClick={fetchChats} colorScheme="blue">
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  const formattedChats = formatChats(filteredChats);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h1" size="xl">My Conversations</Heading>
          
          <Button 
            colorScheme="brand" 
            leftIcon={<Icon as={FaComment} />}
            onClick={() => router.push('/services')}
          >
            Find Services
          </Button>
        </Flex>
        
        <InputGroup mb={6}>
          <InputLeftElement>
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            borderRadius="full"
          />
        </InputGroup>

        {formattedChats.length === 0 ? (
          <Box p={8} borderWidth="1px" borderRadius="lg" textAlign="center">
            <Icon as={FaComment} boxSize={10} color="gray.400" mb={4} />
            <Heading as="h3" size="md" mb={2}>No Conversations Yet</Heading>
            <Text color="gray.600" mb={6}>
              You don't have any conversations yet. Request services from providers to start chatting.
            </Text>
            <Button 
              colorScheme="brand" 
              onClick={() => router.push('/services')}
            >
              Browse Services
            </Button>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            {formattedChats.map((chat) => (
              <Card 
                key={chat.id} 
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                cursor="pointer"
                onClick={() => router.push(`/chats/${chat.id}`)}
                _hover={{ shadow: 'md' }}
                transition="all 0.2s"
              >
                <CardBody>
                  <Flex>
                    <Avatar 
                      name={chat.otherParty.name} 
                      src={chat.otherParty.avatar || undefined} 
                      size="lg"
                      mr={4}
                    />
                    <Box flex="1">
                      <Flex justify="space-between" align="center" mb={2}>
                        <HStack>
                          <Heading size="md">{chat.otherParty.name}</Heading>
                          {chat.unread > 0 && (
                            <Badge colorScheme="red" borderRadius="full" px={2}>
                              {chat.unread} new
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="gray.500">
                          {formatDistanceToNow(new Date(chat.lastMessageDate), { addSuffix: true })}
                        </Text>
                      </Flex>
                      
                      <Text color="gray.600" mb={2} fontSize="sm">
                        <strong>Service:</strong> {chat.serviceName}
                      </Text>
                      
                      <Text noOfLines={2} color={chat.unread > 0 ? "black" : "gray.600"}>
                        {chat.lastMessage}
                      </Text>
                    </Box>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
} 