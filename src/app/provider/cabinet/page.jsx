"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  SimpleGrid, 
  Card, 
  CardBody, 
  Flex, 
  Badge, 
  Button, 
  useToast, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea, 
  Switch, 
  HStack, 
  Image, 
  Select,
  Avatar,
  Spinner,
  Icon,
  Tooltip,
  CardHeader,
  Progress,
  IconButton
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, CloseIcon, ChatIcon, StarIcon } from '@chakra-ui/icons';
import { useSession } from 'next-auth/react';
import { FaComment, FaEye, FaBuilding, FaIdCard, FaPlus, FaTrash, FaMoneyBillWave, FaPaypal } from 'react-icons/fa';
import { BsChatDots, BsFillGeoAltFill } from 'react-icons/bs';
import NextLink from 'next/link';

// Mock data for service provider dashboard
const mockServices = [
  {
    id: 1,
    name: 'Premium Decoration Package',
    category: 'Decoration',
    price: 299.99,
    description: 'Complete decoration setup with balloons, banners, table settings, and themed decorations.',
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    isActive: true,
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 2,
    name: 'Balloon Arch',
    category: 'Decoration',
    price: 149.99,
    description: 'Custom balloon arch in colors of your choice. Perfect for photo opportunities.',
    availability: ['Friday', 'Saturday', 'Sunday'],
    isActive: true,
    image: 'https://images.unsplash.com/photo-1533294455009-a77b7557d2d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 3,
    name: 'DJ Services',
    category: 'Entertainment',
    price: 399.99,
    description: 'Professional DJ with sound equipment. Will play requested songs and keep the party going.',
    availability: ['Friday', 'Saturday'],
    isActive: false,
    image: 'https://images.unsplash.com/photo-1571266028243-5c6d8c2a0d6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  }
];

const mockRequests = [
  {
    id: 1,
    clientName: 'Sarah Johnson',
    partyType: 'Birthday Party',
    date: '2025-04-15',
    time: '14:00',
    location: 'New York',
    serviceType: 'Decoration',
    status: 'New',
    details: 'Looking for princess themed decorations for my daughter\'s 7th birthday party.',
    chatId: 1
  },
  {
    id: 2,
    clientName: 'Michael Brown',
    partyType: 'Anniversary Celebration',
    date: '2025-04-22',
    time: '18:00',
    location: 'New York',
    serviceType: 'Decoration',
    status: 'Offer Sent',
    details: 'Need elegant decorations for our 25th anniversary celebration. Gold and white theme preferred.',
    chatId: 2
  },
  {
    id: 3,
    clientName: 'Jennifer Davis',
    partyType: 'Graduation Party',
    date: '2025-05-10',
    time: '16:00',
    location: 'New York',
    serviceType: 'Entertainment',
    status: 'In Progress',
    details: 'Looking for a DJ for my son\'s high school graduation party. Need someone who can play a mix of current hits and classics.'
  },
  {
    id: 4,
    clientName: 'Robert Wilson',
    partyType: 'Corporate Event',
    date: '2025-04-30',
    time: '19:00',
    location: 'New York',
    serviceType: 'Catering',
    status: 'Approved',
    details: 'Corporate year-end celebration. Need catering for 50 people with vegetarian options.',
    chatId: 3
  }
];

const mockChats = [
  {
    id: 1,
    clientName: 'Michael Brown',
    lastMessage: 'Can you provide more details about the gold decorations?',
    timestamp: '2025-03-19T14:30:00',
    unread: 2
  },
  {
    id: 2,
    clientName: 'Jennifer Davis',
    lastMessage: 'I\'ve sent you my playlist preferences.',
    timestamp: '2025-03-18T09:15:00',
    unread: 0
  }
];

const mockAdPackages = [
  {
    id: 1,
    name: '1 Day Spotlight',
    description: 'Your service featured in the "Best in Your Location" section for 1 day',
    price: 19.99,
    duration: '1 day'
  },
  {
    id: 2,
    name: '7 Day Spotlight',
    description: 'Your service featured in the "Best in Your Location" section for 7 days',
    price: 99.99,
    duration: '7 days'
  },
  {
    id: 3,
    name: 'First Wave Weekly',
    description: 'Get early access to new client requests for 7 days',
    price: 49.99,
    duration: '7 days',
    type: 'First Wave'
  },
  {
    id: 4,
    name: 'First Wave Monthly',
    description: 'Get early access to new client requests for 30 days',
    price: 149.99,
    duration: '30 days',
    type: 'First Wave'
  },
  {
    id: 5,
    name: 'Premium Bundle',
    description: '7 Day Spotlight + First Wave Weekly',
    price: 129.99,
    duration: '7 days',
    type: 'Bundle'
  }
];

// Helper function to get color scheme for status badges
const getStatusColor = (status) => {
  // Normalize status to uppercase for consistent comparison
  const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : 'UNKNOWN';
  
  switch (normalizedStatus) {
    case 'NEW':
    case 'DRAFT':
      return 'green';
    case 'IN PROGRESS':
    case 'PENDING':
      return 'blue';
    case 'OFFER SENT':
      return 'purple';
    case 'PROVIDER_REVIEW':
      return 'orange';
    case 'APPROVED':
    case 'CONFIRMED':
      return 'teal';
    case 'COMPLETED':
    case 'PAID':
      return 'green';
    case 'REJECTED':
    case 'DECLINED':
    case 'CANCELLED':
      return 'red';
    case 'ESCROW':
      return 'cyan';
    case 'DISPUTED':
      return 'orange';
    case 'REFUNDED':
      return 'gray';
    default:
      return 'gray';
  }
};

// Service categories
const serviceCategories = [
  'Decoration',
  'Catering',
  'Entertainment',
  'Venue',
  'Photography',
  'Music',
  'Bounce House',
  'Clown/Entertainer'
];

// Days of the week
const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function ProviderCabinetPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const [services, setServices] = useState(mockServices);
  const [requests, setRequests] = useState(mockRequests);
  const [chats, setChats] = useState([]);
  const [adPackages, setAdPackages] = useState(mockAdPackages);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [filteredRequests, setFilteredRequests] = useState(mockRequests);
  const [requestFilter, setRequestFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    googleBusinessUrl: '',
    description: '',
    avatar: '',
    socialLinks: {}
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileCompletionPercent, setProfileCompletionPercent] = useState(0);
  const [businessVerified, setBusinessVerified] = useState(false);
  const [hasEIN, setHasEIN] = useState(false);
  const [serviceCount, setServiceCount] = useState(0);
  const [cities, setCities] = useState([]);
  const [providerCities, setProviderCities] = useState([]);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Clear any outdated localStorage values but preserve important data
  useEffect(() => {
    // Clear outdated localStorage provider data while preserving important items
    const clearOutdatedLocalStorage = () => {
      console.log('Cleaning up outdated provider profile data from localStorage');
      
      // Save important data
      const savedCities = localStorage.getItem('provider_cities');
      
      // Clear provider_ keys that are not essential
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('provider_') && key !== 'provider_cities') {
          localStorage.removeItem(key);
        }
      });
      
      // Restore important data if it existed
      if (savedCities) {
        localStorage.setItem('provider_cities', savedCities);
      }
    };
    
    clearOutdatedLocalStorage();
  }, []);

  // Authentication check
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (sessionStatus === 'authenticated') {
      if (session?.user?.role !== 'PROVIDER') {
        router.push('/');
        toast({
          title: 'Access Denied',
          description: 'Only service providers can access this page',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        fetchProviderStats();
        // Fetch notifications and chat data initially
        fetchChats();
      }
    }
  }, [session, sessionStatus, router, toast]);

  // Check for new messages every minute
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    
    const checkNewMessages = () => {
      fetchChats();
      console.log('Checking for new messages...');
    };
    
    // Initial check
    checkNewMessages();
    
    // Set up interval
    const interval = setInterval(checkNewMessages, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [sessionStatus]);

  // Fetch recent chats with clients
  const fetchChats = async () => {
    try {
      setIsChatsLoading(true);
      console.log("Fetching chats for user:", session?.user);
      
      const response = await fetch('/api/chats');
      
      if (!response.ok) {
        throw new Error(`Error fetching chats: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Chats API response:", data);
      
      if (data.chats && Array.isArray(data.chats)) {
        // Transform the data to match our component's expected format
        const formattedChats = data.chats.map(chat => {
          if (!chat.offer) {
            console.warn(`Chat ${chat.id} has no associated offer`);
            return null;
          }
          
          // Check if current user is the provider (more robust check)
          const isProvider = session?.user?.role === 'PROVIDER' && 
                            (session?.user?.id === chat.offer?.providerId || 
                             session?.user?.id === chat.offer?.provider?.id);
          
          console.log(`Chat ${chat.id}: User role=${session?.user?.role}, isProvider=${isProvider}`);
          console.log(`Chat ${chat.id}: Provider ID=${chat.offer?.providerId}, Client ID=${chat.offer?.clientId}`);
          
          // Get other user based on current user role
          let otherUser;
          if (isProvider) {
            otherUser = chat.offer?.client;
            console.log(`Chat ${chat.id}: Other user (client):`, otherUser);
          } else {
            otherUser = chat.offer?.provider;
            console.log(`Chat ${chat.id}: Other user (provider):`, otherUser);
          }
          
          // If we can't determine the other user, use a fallback
          if (!otherUser) {
            console.warn(`Chat ${chat.id}: Could not determine other user`);
            otherUser = {
              name: isProvider ? 'Client' : 'Provider',
              profile: { avatar: null }
            };
          }
          
          // Calculate unread messages - messages from other user that haven't been read
          const unreadCount = chat.messages
            ? chat.messages.filter(msg => 
                msg.senderId !== session?.user?.id && 
                !msg.isRead
              ).length
            : 0;
          
          console.log(`Chat ${chat.id} with ${otherUser?.name}: ${unreadCount} unread messages`);
          
          return {
            id: chat.id,
            clientName: otherUser?.name || 'Anonymous',
            clientAvatar: otherUser?.profile?.avatar || null,
            serviceName: chat.offer?.service?.name || 'Service request',
            lastMessage: chat.messages?.[0]?.content || 'No messages yet',
            timestamp: chat.messages?.[0]?.createdAt || chat.updatedAt || new Date().toISOString(),
            unread: unreadCount, 
          };
        }).filter(Boolean); // Remove any null entries
        
        console.log("Formatted chats:", formattedChats);
        setChats(formattedChats);
        
        // Show toast if there are unread messages
        const totalUnread = formattedChats.reduce((sum, chat) => sum + chat.unread, 0);
        if (totalUnread > 0) {
          toast({
            title: `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`,
            description: "Click on the message button to view your conversations",
            status: "info",
            duration: 3000,
            isClosable: true,
            position: "bottom-right"
          });
        }
      } else {
        console.warn("No chats found in API response:", data);
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      
      // Set empty chats array on error
      setChats([]);
    } finally {
      setIsChatsLoading(false);
    }
  };
  
  // Handle Socket.io connection for real-time updates
  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Initialize Socket.io if needed
    if (typeof window !== 'undefined') {
      const initSocket = async () => {
        try {
          const { io } = await import('socket.io-client');
          const socket = io({
            path: '/api/socket',
            auth: {
              token: session.accessToken,
            },
          });
          
          socket.on('connect', () => {
            console.log('Socket connected for provider cabinet updates');
          });
          
          socket.on('notification:new', (notification) => {
            console.log('New notification received:', notification);
            // If it's a message notification, refresh chats
            if (notification.type === 'MESSAGE') {
              fetchChats();
            }
          });
          
          return socket;
        } catch (error) {
          console.error('Error initializing socket:', error);
          return null;
        }
      };
      
      const socketPromise = initSocket();
      
      return () => {
        socketPromise.then(socket => {
          if (socket) {
            socket.disconnect();
          }
        });
      };
    }
  }, [session]);
  
  // Initial data fetch for provider cabinet
  const fetchProviderStats = async () => {
    setIsLoading(true);
    
    try {
      // Fetch profile data
      const profileResponse = await fetch('/api/provider/profile');
      const profileResult = await profileResponse.json();
      
      console.log('Profile fetch response:', JSON.stringify(profileResult, null, 2));
      
      if (profileResult.success) {
        // Get profile data from response
        const profileData = profileResult.data || {};
        
        // Get user name from session or profile for company name
        const companyName = session?.user?.name || '';
        
        // Ensure all fields have default values
        setProfileData({
          companyName: companyName, // Use the user's name from session as company name
          contactPerson: profileData.contactPerson || '',
          email: session?.user?.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          website: profileData.website || '',
          googleBusinessUrl: profileData.googleBusinessUrl || '',
          description: profileData.description || '',
          avatar: profileData.avatar || '',
          socialLinks: profileData.socialLinks || {}
        });
      }
      
      // Fetch requests data with chats
      try {
        // First fetch offers to get complete data
        const offersResponse = await fetch('/api/provider/requests');
        const offersData = await offersResponse.json();
        
        // Then fetch party history data
        const partyHistoryResponse = await fetch('/api/provider/service-requests');
        const partyHistoryData = await partyHistoryResponse.json();
        
        // Combine the data
        let allRequests = [];
        
        // Map offers to request format
        if (offersData.success && Array.isArray(offersData.data)) {
          const mappedOffers = offersData.data.map(offer => {
            // Extract party details
            const partyDetails = offer.partyService?.party;
            
            return {
              id: offer.id,
              offerId: offer.id,
              partyId: offer.partyService?.partyId,
              partyType: partyDetails?.name || 'Service Request',
              clientName: offer.client?.name || 'Anonymous Client',
              clientId: offer.client?.id,
              date: partyDetails?.date ? new Date(partyDetails.date).toLocaleDateString() : 'TBD',
              time: partyDetails?.startTime || 'TBD',
              location: partyDetails?.location || 'TBD',
              serviceType: offer.service?.name || 'Service',
              status: offer.status || 'New',
              details: offer.message || 'No details provided',
              amount: offer.amount || offer.service?.price || 0,
              chatId: offer.chatId || offer.chat?.id || null
            };
          });
          
          allRequests = [...mappedOffers];
        }
        
        // Map party history data to requests
        if (partyHistoryData.success && Array.isArray(partyHistoryData.data)) {
          const mappedPartyHistory = partyHistoryData.data.map(party => {
            // Get the first party service related to this provider
            const relevantService = party.partyServices.find(ps => 
              ps.service?.providerId === session.user.id
            );
            
            // Get related offer if any
            const relevantOffer = relevantService?.offers?.find(o => 
              o.providerId === session.user.id
            );
            
            return {
              id: `party-${party.id}-${relevantService?.id || '0'}`,
              partyId: party.id,
              offerId: relevantOffer?.id,
              partyType: party.name || 'Party',
              clientName: party.client?.name || 'Anonymous Client',
              clientId: party.clientId,
              date: party.date ? new Date(party.date).toLocaleDateString() : 'TBD',
              time: party.startTime || 'TBD',
              location: party.location || 'TBD',
              serviceType: relevantService?.service?.name || 'Service',
              status: relevantOffer?.status || party.status || 'New',
              details: relevantService?.specificOptions?.details || 'No details provided',
              amount: relevantOffer?.amount || relevantService?.service?.price || 0,
              chatId: relevantOffer?.chatId || relevantOffer?.chat?.id || null
            };
          });
          
          // Add to the list but avoid duplicates
          mappedPartyHistory.forEach(partyItem => {
            if (!allRequests.some(req => 
              (req.offerId && req.offerId === partyItem.offerId) || 
              (req.partyId && req.partyId === partyItem.partyId && req.serviceType === partyItem.serviceType)
            )) {
              allRequests.push(partyItem);
            }
          });
        }
              
        console.log('Combined requests with chat info:', allRequests);
        
        // Only update if we have data
        if (allRequests.length > 0) {
          setRequests(allRequests);
          setFilteredRequests(allRequests);
        }
      } catch (requestsError) {
        console.error('Error fetching provider requests:', requestsError);
        // Falls back to mock data if the API call fails
      }
      
      // Fetch chats data
      fetchChats();
      
    } catch (error) {
      console.error('Error fetching provider dashboard data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch services when component mounts
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setServices(result.data);
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: error.message || 'Failed to load services',
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setServices([]);
      }
    };

    if (session?.user?.role === 'PROVIDER') {
      fetchServices();
    }
  }, [session, toast]);

  // Filter requests based on status
  useEffect(() => {
    if (requestFilter === 'All') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(request => request.status === requestFilter));
    }
  }, [requestFilter, requests]);

  // Handle service form submission
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    
    try {
    if (isEditing && currentService) {
      // Update existing service
        const response = await fetch(`/api/services/${currentService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentService),
        });

        if (!response.ok) {
          throw new Error('Failed to update service');
        }

        const result = await response.json();
        if (result.success) {
      setServices(services.map(service => 
            service.id === result.data.id ? result.data : service
      ));
          
      toast({
        title: "Service updated",
            description: `${result.data.name} has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
        }
    } else {
      // Add new service
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentService),
        });

        if (!response.ok) {
          throw new Error('Failed to create service');
        }

        const result = await response.json();
        if (result.success) {
          setServices([...services, result.data]);
          
      toast({
        title: "Service added",
            description: `${result.data.name} has been added successfully.`,
        status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      }
      
      setIsEditing(false);
      setCurrentService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save service',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle service edit
  const handleEditService = (service) => {
    setCurrentService(service);
    setIsEditing(true);
  };

  // Handle service delete
  const handleDeleteService = async (serviceId) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      const result = await response.json();
      if (result.success) {
    setServices(services.filter(service => service.id !== serviceId));
    toast({
      title: "Service deleted",
      description: "The service has been deleted successfully.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to delete service',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle service activation toggle
  const handleToggleActive = async (serviceId) => {
    try {
      const service = services.find(s => s.id === serviceId);
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...service,
          status: service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service status');
      }

      const result = await response.json();
      if (result.success) {
    setServices(services.map(service => 
          service.id === result.data.id ? result.data : service
        ));
      }
    } catch (error) {
      console.error('Error toggling service status:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update service status',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle input change for service form
  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentService({
      ...currentService,
      [name]: value
    });
  };

  // Handle availability change
  const handleAvailabilityChange = (day) => {
    const availability = currentService?.availability || [];
    if (availability.includes(day)) {
      setCurrentService({
        ...currentService,
        availability: availability.filter(d => d !== day)
      });
    } else {
      setCurrentService({
        ...currentService,
        availability: [...availability, day]
      });
    }
  };

  // Handle sending an offer
  const handleSendOffer = (requestId) => {
    // In a real app, this would open a form to create an offer
    toast({
      title: "Offer form",
      description: "This would open a form to create and send an offer to the client.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle purchasing an ad package
  const handlePurchaseAd = (packageId) => {
    // In a real app, this would open a payment form
    toast({
      title: "Purchase ad package",
      description: "This would open a payment form to purchase the selected ad package.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle navigating to a chat
  const handleNavigateToChat = (chatId, e) => {
    e.stopPropagation(); // Prevent triggering the card click event
    if (chatId) {
      router.push(`/chats/${chatId}`);
    } else {
      toast({
        title: "No Chat Available",
        description: "There is no chat associated with this request yet.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle navigating to a party
  const handleViewParty = (partyId, e) => {
    if (e) e.stopPropagation(); // Prevent triggering other click events
    
    if (!partyId) {
      toast({
        title: "Error",
        description: "Party ID is missing",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Navigate to party details page
    router.push(`/provider/party/${partyId}`);
  };

  // Create a new chat for a service request
  const handleCreateChat = async (request, e) => {
    e.stopPropagation(); // Prevent triggering the card click event
    
    try {
      // Debug log the request object
      console.log("Creating chat for request:", request);
      
      // Show loading toast
      const loadingToastId = toast({
        title: "Creating chat",
        description: "Setting up a new conversation...",
        status: "loading",
        duration: null,
        isClosable: false,
      });
      
      // Extract the offerId from the request - use different possible paths
      const offerId = request.offerId || request.offer?.id || request.partyService?.offers?.[0]?.id;
      
      console.log("Extracted offerId:", offerId);
      
      if (!offerId) {
        // Close loading toast
        toast.close(loadingToastId);
        
        // Show error
        toast({
          title: "Cannot create chat",
          description: "No offer associated with this request. A chat can only be created for an offer.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Create chat via API
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId }),
      });
      
      const data = await response.json();
      console.log("Chat creation response:", data);
      
      // Close loading toast
      toast.close(loadingToastId);
      
      if (data.chat && data.chat.id) {
        // Success - navigate to chat
        toast({
          title: "Chat created",
          description: "Successfully created a new conversation.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh data first
        await fetchProviderStats();
        
        // Navigate to chat
        router.push(`/chats/${data.chat.id}`);
      } else {
        // Error creating chat
        toast({
          title: "Error",
          description: data.error || "Failed to create chat. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create chat",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value || '' // Ensure value is never undefined
    }));
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsProfileSaving(true);
      
      // Create a clean profile object with all fields
      const profileToSave = {
        companyName: profileData.companyName || session?.user?.name || '',
        contactPerson: profileData.contactPerson || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        website: profileData.website || '',
        googleBusinessUrl: profileData.googleBusinessUrl || '',
        description: profileData.description || '',
        avatar: profileData.avatar || '',
        socialLinks: profileData.socialLinks || {}
      };
      
      console.log('Saving profile data to API:', JSON.stringify(profileToSave, null, 2));
      
      // First try to save to the API
      const response = await fetch('/api/provider/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileToSave)
      });
      
      console.log('Profile save response status:', response.status);
      const result = await response.json();
      console.log('Profile save response:', JSON.stringify(result, null, 2));
      
      // Check if company name was updated in the session
      if (response.ok && result.success && profileToSave.companyName !== session?.user?.name) {
        console.log('Company name updated, refreshing session');
        // Optionally refresh the session or update UI state
      }
      
      // Always save to localStorage for backup
      for (const [key, value] of Object.entries(profileToSave)) {
        if (typeof value === 'object') {
          localStorage.setItem(`provider_${key}`, JSON.stringify(value));
        } else {
          localStorage.setItem(`provider_${key}`, value || '');
        }
      }
      
      if (response.ok && result.success) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // API save failed but we saved locally
        toast({
          title: 'Profile Saved Locally',
          description: 'Your profile was saved locally but could not be saved to the server. Changes will persist in this browser only.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleResetProfile = () => {
    // Clear all provider_ keys from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('provider_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reset profile to defaults with proper empty values
    setProfileData({
      companyName: session?.user?.name || '',
      contactPerson: '',
      email: session?.user?.email || '',
      phone: '',
      address: '',
      website: '',
      googleBusinessUrl: '',
      description: '',
      avatar: '',
      socialLinks: { instagram: '', facebook: '' }
    });
    
    toast({
      title: 'Profile Reset',
      description: 'Your profile has been reset to defaults',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const onProfileSectionOpen = () => {
    // Implement the logic to open the profile section
    console.log("Opening profile section");
  };

  // Calculate profile completion percentage
  useEffect(() => {
    const calculateProfileCompletion = () => {
      const { companyName, contactPerson, phone, website, avatar, description } = profileData;
      
      let completion = 0;
      
      // Basic profile - 60%
      if (companyName) completion += 20;
      if (contactPerson) completion += 10;
      if (phone) completion += 30;
      
      // Extended profile - 40%
      if (website) completion += 20;
      if (avatar) completion += 10;
      if (description) completion += 10;

      setProfileCompletionPercent(completion);
    };

    calculateProfileCompletion();
  }, [profileData]);

  // Calculate service count
  useEffect(() => {
    const calculateServiceCount = () => {
      setServiceCount(services.filter(s => s.status === 'ACTIVE').length);
    };

    calculateServiceCount();
  }, [services]);

  // Add a function to fetch cities and provider's service locations
  const fetchServiceLocations = async () => {
    try {
      setIsLoadingCities(true);
      const userId = session?.user?.id;
      console.log('Fetching service locations, user ID:', userId);
      
      if (!userId) {
        console.log('Cannot fetch service locations: No user ID');
        setIsLoadingCities(false);
        return;
      }
      
      // Fetch all available cities
      const citiesResponse = await fetch('/api/cities', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      if (!citiesResponse.ok) {
        console.error('Failed to fetch cities:', citiesResponse.status);
        throw new Error(`Failed to fetch cities: ${citiesResponse.status}`);
      }
      
      const citiesData = await citiesResponse.json();
      
      if (citiesData.data && Array.isArray(citiesData.data)) {
        setCities(citiesData.data);
        console.log('Fetched all cities, count:', citiesData.data.length);
      }
      
      // Fetch provider's service locations with cache-busting
      const timestamp = Date.now();
      const providerCitiesResponse = await fetch(`/api/provider/cities?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      console.log('Provider cities response status:', providerCitiesResponse.status);
      
      if (!providerCitiesResponse.ok) {
        throw new Error(`Failed to fetch provider cities: ${providerCitiesResponse.status}`);
      }
      
      const providerCitiesData = await providerCitiesResponse.json();
      console.log('Provider cities API response:', providerCitiesData);
      
      if (providerCitiesData.success) {
        const providerCitiesArray = providerCitiesData.data || [];
        console.log('Setting provider cities from API, count:', providerCitiesArray.length);
        
        // Transform data if needed to ensure consistent structure
        const formattedCities = providerCitiesArray.map(city => ({
          id: city.id,
          name: city.name,
          state: city.state,
          slug: city.slug,
          providerCityId: city.providerCityId || city.id
        }));
        
        setProviderCities(formattedCities);
        
        // Make provider cities data persistent in storage
        try {
          const citiesJson = JSON.stringify(formattedCities);
          sessionStorage.setItem('provider_cities', citiesJson);
          localStorage.setItem('provider_cities', citiesJson);
          
          // Also store timestamp for cache validation
          sessionStorage.setItem('provider_cities_timestamp', timestamp.toString());
          localStorage.setItem('provider_cities_timestamp', timestamp.toString());
          
          console.log('Saved provider cities to storage, count:', formattedCities.length);
        } catch (storageError) {
          console.error('Error storing cities in storage:', storageError);
        }
      } else {
        console.log('API returned error, attempting to load from storage');
        loadFromStorage();
      }
    } catch (error) {
      console.error('Error fetching service locations:', error);
      loadFromStorage();
      
      toast({
        title: 'Error',
        description: 'Failed to load service locations from server, using cached data if available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingCities(false);
    }
  };
  
  // Helper function to load cities from storage
  const loadFromStorage = () => {
    try {
      // Try sessionStorage first (current session)
      let storedCities = sessionStorage.getItem('provider_cities');
      
      // If not in sessionStorage, try localStorage
      if (!storedCities) {
        storedCities = localStorage.getItem('provider_cities');
      }
      
      if (storedCities) {
        const parsedCities = JSON.parse(storedCities);
        console.log('Loaded cities from storage:', parsedCities);
        setProviderCities(parsedCities);
        return true;
      }
    } catch (parseError) {
      console.error('Error parsing cities from storage:', parseError);
    }
    return false;
  };
  
  // Add initial loading from localStorage and sessionStorage
  useEffect(() => {
    // Try to load cities from storage first for quick rendering
    console.log('Initial cities load attempt from storage');
    const loaded = loadFromStorage();
    console.log('Initial load successful:', loaded);
  }, []);
  
  // Load locations from API when authenticated
  useEffect(() => {
    const loadProviderLocations = async () => {
      // Only proceed if we have a valid provider session
      if (!session?.user?.id || session?.user?.role !== 'PROVIDER') {
        console.log('Cannot load provider locations: User not authenticated as provider');
        return;
      }
      
      console.log('Provider authenticated, checking provider record');
      
      try {
        // First check if provider record exists and create if needed
        const setupResponse = await fetch('/api/provider/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          }
        });
        
        if (!setupResponse.ok) {
          console.error('Failed to set up provider record:', setupResponse.status);
          toast({
            title: 'Error',
            description: 'Failed to set up provider account. Please try again later.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        
        const setupResult = await setupResponse.json();
        console.log('Provider setup result:', setupResult);
        
        if (setupResult.success) {
          // Now that we have a provider record, load the service locations
          console.log('Provider record confirmed, loading service locations');
          fetchServiceLocations().catch(err => {
            console.error('Error in fetchServiceLocations:', err);
            // If API fetch fails, try to load from storage as fallback
            loadFromStorage();
          });
        } else {
          console.error('Failed to set up provider:', setupResult.error);
          toast({
            title: 'Error',
            description: setupResult.error?.message || 'Failed to set up provider account',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error setting up provider:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    // When session is ready or changes, load provider data
    if (sessionStatus === 'authenticated') {
      loadProviderLocations();
    } else if (sessionStatus === 'loading') {
      console.log('Session loading, will fetch locations when ready');
    } else {
      console.log('No session available, cannot load provider locations');
    }
  }, [sessionStatus, session?.user?.id, session?.user?.role]);
  
  // Add a function to add a city to provider's service locations
  const handleAddCity = async () => {
    if (!selectedCityId) {
      toast({
        title: 'Error',
        description: 'Please select a city to add',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsAddingCity(true);
      console.log('Adding city ID:', selectedCityId);
      
      const response = await fetch('/api/provider/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          cityId: selectedCityId,
        }),
      });
      
      console.log('Add city response status:', response.status);
      
      const data = await response.json();
      console.log('Add city response data:', data);
      
      if (data.success) {
        // Handle case where city already exists
        if (data.data?.alreadyExists) {
          toast({
            title: 'Information',
            description: 'This location is already in your service areas',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Success',
            description: 'Service location added successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
        
        // Add the new city to the state immediately if not already exists
        if (!data.data?.alreadyExists) {
          const selectedCity = cities.find(city => city.id === selectedCityId);
          if (selectedCity) {
            // Add providerCityId if available in the response
            const cityWithRelation = {
              ...selectedCity,
              providerCityId: data.data?.providerCityId || selectedCity.id
            };
            
            const updatedCities = [...providerCities, cityWithRelation];
            console.log('Updating provider cities state with new city:', selectedCity.name);
            setProviderCities(updatedCities);
            
            // Update both sessionStorage and localStorage
            try {
              const citiesToStore = JSON.stringify(updatedCities);
              sessionStorage.setItem('provider_cities', citiesToStore);
              localStorage.setItem('provider_cities', citiesToStore);
              console.log('Updated storage with new city, count:', updatedCities.length);
            } catch (storageError) {
              console.error('Error storing updated cities in storage:', storageError);
            }
          }
        }
        
        // Refresh service locations to get the latest data
        console.log('Refreshing service locations after add');
        setTimeout(() => fetchServiceLocations(), 1000); // Longer delay to ensure the server has processed
        setSelectedCityId('');
        setIsAddingCity(false);
      } else {
        throw new Error(data.error?.message || 'Failed to add service location');
      }
    } catch (error) {
      console.error('Error adding service location:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add service location',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAddingCity(false);
    }
  };

  // Add a function to remove a city from provider's service locations
  const handleRemoveCity = async (cityId) => {
    try {
      setIsLoadingCities(true);
      console.log('Removing city ID:', cityId);
      
      const response = await fetch(`/api/provider/cities/${cityId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('Remove city response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remove city error response:', errorText);
        throw new Error(`Failed to remove city: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Remove city response data:', data);
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Service location removed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Remove the city from state immediately
        const updatedCities = providerCities.filter(city => city.id !== cityId);
        console.log('Updating provider cities state after removal, count:', updatedCities.length);
        setProviderCities(updatedCities);
        
        // Update both sessionStorage and localStorage
        try {
          const citiesToStore = JSON.stringify(updatedCities);
          sessionStorage.setItem('provider_cities', citiesToStore);
          localStorage.setItem('provider_cities', citiesToStore);
          // Also update timestamp
          const timestamp = Date.now();
          sessionStorage.setItem('provider_cities_timestamp', timestamp.toString());
          localStorage.setItem('provider_cities_timestamp', timestamp.toString());
          console.log('Updated storage after city removal, count:', updatedCities.length);
        } catch (storageError) {
          console.error('Error updating cities in storage after removal:', storageError);
        }
        
        // Refresh service locations from server to sync with a small delay
        console.log('Refreshing service locations after removal');
        setTimeout(() => fetchServiceLocations(), 1000);
      } else {
        throw new Error(data.error?.message || 'Failed to remove service location');
      }
    } catch (error) {
      console.error('Error removing service location:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove service location',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      
      // Try to refresh data from the server in case of error
      setTimeout(() => fetchServiceLocations(), 1500);
    } finally {
      setIsLoadingCities(false);
    }
  };

  return (
      <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center" mb={2}>
          <Heading as="h1" size="xl">Service Provider Dashboard</Heading>
          
          {/* Notification and chat quick access */}
          <HStack spacing={4}>
            <Tooltip label="View all messages">
              <Button 
                leftIcon={<Icon as={FaComment} />} 
                colorScheme="brand"
                onClick={() => router.push('/chats')}
                position="relative"
                variant="outline"
              >
                Messages
                {chats.filter(c => c.unread > 0).length > 0 && (
                  <Badge 
                    colorScheme="red" 
                    borderRadius="full" 
                    position="absolute" 
                    top="-8px" 
                    right="-8px"
                  >
                    {chats.filter(c => c.unread > 0).length}
                  </Badge>
                )}
              </Button>
            </Tooltip>
          </HStack>
        </Flex>
        
        <Tabs variant="enclosed" colorScheme="brand">
          <TabList>
            <Tab>Profile</Tab>
            <Tab>Service Locations</Tab>
            <Tab>Party History</Tab>
            <Tab>Chats</Tab>
          </TabList>
          
          <TabPanels>
            {/* Profile Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading as="h2" size="lg">Provider Profile</Heading>
                
                <Card>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Company Name</FormLabel>
                        <Input 
                          name="companyName"
                          value={profileData.companyName}
                          onChange={handleProfileChange}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Contact Person</FormLabel>
                        <Input 
                          name="contactPerson"
                          value={profileData.contactPerson}
                          onChange={handleProfileChange}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input 
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          isReadOnly
                          isDisabled
                          opacity={0.8}
                          cursor="not-allowed"
                          _hover={{ cursor: "not-allowed" }}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Email cannot be changed as it is used for account identification
                        </Text>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Phone</FormLabel>
                        <Input 
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Website (Optional)</FormLabel>
                        <Input 
                          name="website"
                          value={profileData.website}
                          onChange={handleProfileChange}
                          placeholder="https://www.example.com"
                        />
                      </FormControl>
                      
                      <FormControl gridColumn={{ md: "span 2" }}>
                        <FormLabel>Company Description</FormLabel>
                        <Textarea
                          name="description"
                          value={profileData.description}
                          onChange={handleProfileChange}
                          placeholder="Describe your services and experience"
                          rows={4}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Instagram</FormLabel>
                        <Input 
                          name="instagramUrl"
                          value={profileData.socialLinks?.instagram || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setProfileData(prev => ({
                              ...prev,
                              socialLinks: {
                                ...prev.socialLinks,
                                instagram: value || ""
                              }
                            }));
                          }}
                          placeholder="Instagram URL" 
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Facebook</FormLabel>
                        <Input 
                          name="facebookUrl"
                          value={profileData.socialLinks?.facebook || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setProfileData(prev => ({
                              ...prev,
                              socialLinks: {
                                ...prev.socialLinks,
                                facebook: value || ""
                              }
                            }));
                          }}
                          placeholder="Facebook URL" 
                        />
                      </FormControl>
                    </SimpleGrid>
                    
                    <Button 
                      mt={6} 
                      colorScheme="brand"
                      _hover={{ bg: '#ffcba5' }}
                      _active={{ bg: '#ffcba5' }}
                      onClick={handleSaveProfile}
                      isLoading={isProfileSaving}
                    >
                      Save Profile
                    </Button>
                    
                    <Button 
                      mt={6} 
                      ml={4}
                      variant="outline"
                      colorScheme="red"
                      onClick={handleResetProfile}
                    >
                      Reset Profile
                    </Button>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
            
            {/* Service Locations Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading as="h2" size="lg">Service Locations</Heading>
                <Text>Add cities where you offer your services. Clients will see your services when searching in these locations.</Text>
                
                {isLoadingCities ? (
                  <Flex justifyContent="center" py={8} direction="column" align="center">
                    <Spinner size="xl" color="brand.500" mb={4} />
                    <Text color="gray.600">Loading your service locations...</Text>
                  </Flex>
                ) : (
                  <>
                    <Box borderWidth="1px" borderRadius="lg" p={4}>
                      <VStack spacing={4} align="stretch">
                        <Flex justifyContent="space-between" alignItems="center">
                          <Heading as="h3" size="md">My Service Areas</Heading>
                          <Button 
                            leftIcon={<AddIcon />} 
                            colorScheme="brand" 
                            size="sm"
                            onClick={() => setIsAddingCity(true)}
                            isDisabled={isLoadingCities}
                          >
                            Add Location
                          </Button>
                        </Flex>
                        
                        {isAddingCity && (
                          <Box borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
                            <HStack spacing={4} mb={1}>
                              <FormControl isRequired flex="1">
                                <FormLabel fontSize="sm">Select Location</FormLabel>
                                <Select 
                                  placeholder="Select city" 
                                  value={selectedCityId}
                                  onChange={(e) => setSelectedCityId(e.target.value)}
                                  isDisabled={isLoadingCities}
                                >
                                  {cities
                                    .filter(city => !providerCities.some(pc => pc.id === city.id))
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(city => (
                                      <option key={city.id} value={city.id}>
                                        {city.name}, {city.state}
                                      </option>
                                    ))
                                  }
                                </Select>
                              </FormControl>
                            </HStack>
                            <Flex justify="flex-end" mt={2}>
                              <Button 
                                colorScheme="brand" 
                                onClick={handleAddCity}
                                isLoading={isLoadingCities}
                                size="sm"
                                mr={2}
                              >
                                Add
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setIsAddingCity(false);
                                  setSelectedCityId('');
                                }}
                                size="sm"
                                isDisabled={isLoadingCities}
                              >
                                Cancel
                              </Button>
                            </Flex>
                          </Box>
                        )}
                        
                        {providerCities.length === 0 ? (
                          <Box textAlign="center" py={6} borderWidth="1px" borderRadius="md" bg="gray.50">
                            <Icon as={BsFillGeoAltFill} w={8} h={8} color="gray.400" mb={3} />
                            <Text color="gray.500" mb={3}>You haven't added any service locations yet.</Text>
                            {!isAddingCity && (
                              <Button 
                                mt={2} 
                                leftIcon={<AddIcon />} 
                                colorScheme="brand" 
                                size="sm"
                                onClick={() => setIsAddingCity(true)}
                              >
                                Add Your First Location
                              </Button>
                            )}
                          </Box>
                        ) : (
                          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mt={2}>
                            {providerCities
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(city => (
                                <Box 
                                  key={city.id} 
                                  borderWidth="1px" 
                                  borderRadius="md" 
                                  p={3}
                                  position="relative"
                                  transition="all 0.2s"
                                  _hover={{
                                    shadow: "sm",
                                    borderColor: "gray.300"
                                  }}
                                >
                                  <Flex align="center">
                                    <Icon as={BsFillGeoAltFill} color="brand.500" mr={2} />
                                    <Text fontWeight="medium">{city.name}</Text>
                                    <Text ml={1} color="gray.500">, {city.state}</Text>
                                  </Flex>
                                  <Tooltip label="Remove location">
                                    <IconButton
                                      aria-label="Remove location"
                                      icon={<DeleteIcon />}
                                      size="xs"
                                      colorScheme="red"
                                      variant="ghost"
                                      position="absolute"
                                      top={2}
                                      right={2}
                                      onClick={() => handleRemoveCity(city.id)}
                                      isDisabled={isLoadingCities}
                                    />
                                  </Tooltip>
                                </Box>
                              ))}
                          </SimpleGrid>
                        )}
                      </VStack>
                    </Box>
                    
                    <Box mt={6} borderWidth="1px" borderRadius="lg" p={4}>
                      <Heading as="h3" size="md" mb={4}>Add New Location</Heading>
                      <Text mb={4}>
                        Don't see your city? <Button as="a" href="#" variant="link" colorScheme="brand">Contact us</Button> to request adding a new location.
                      </Text>
                    </Box>
                  </>
                )}
              </VStack>
            </TabPanel>
            
            {/* Party History Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading as="h2" size="lg" mb={4}>Party History</Heading>
                
                {isLoading ? (
                  <Flex justify="center" p={6}>
                    <Spinner size="xl" />
                  </Flex>
                ) : filteredRequests.filter(request => 
                    request.status === 'COMPLETED' || 
                    request.status === 'Completed' || 
                    request.status === 'PAID'
                  ).length === 0 ? (
                  <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
                    <Text>No completed parties yet.</Text>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                    {filteredRequests
                      .filter(request => 
                        request.status === 'COMPLETED' || 
                        request.status === 'Completed' || 
                        request.status === 'PAID'
                      )
                      .map(request => (
                        <Card key={request.id} mb={4} variant="outline">
                          <CardBody>
                            <Flex direction="column">
                              <Flex justify="space-between" align="flex-start" mb={4}>
                                <VStack align="flex-start" spacing={1}>
                                  <Heading as="h3" size="md">{request.partyType}</Heading>
                                  <Badge colorScheme={getStatusColor(request.status)}>Completed</Badge>
                                </VStack>
                                
                                <Text fontWeight="bold" fontSize="lg">
                                  ${typeof request.amount === 'number' ? request.amount.toFixed(2) : request.amount}
                                </Text>
                              </Flex>
                              
                              <VStack align="flex-start" spacing={2} mb={4}>
                                <Text><strong>Client:</strong> {request.clientName}</Text>
                                <Text><strong>Date:</strong> {request.date}</Text>
                                <Text><strong>Service:</strong> {request.serviceType}</Text>
                                <Text><strong>Location:</strong> {request.location}</Text>
                              </VStack>
                              
                              <Flex mt={2} gap={2} justifyContent="flex-end">
                                {/* Message Button - Show with conditional styling */}
                                <Tooltip label={request.chatId ? `Chat ID: ${request.chatId}` : "Create a chat to communicate"}>
                                  <Button
                                    size="sm"
                                    onClick={(e) => request.chatId ? handleNavigateToChat(request.chatId, e) : handleCreateChat(request, e)}
                                    colorScheme={request.chatId ? "green" : "gray"}
                                    variant="outline"
                                    leftIcon={<Icon as={BsChatDots} />}
                                  >
                                    {request.chatId ? "Message" : "Create Chat"}
                                  </Button>
                                </Tooltip>
                                
                                {/* View Party Button */}
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewParty(request?.partyId);
                                  }}
                                  leftIcon={<Icon as={FaEye} />}
                                >
                                  View Party
                                </Button>
                              </Flex>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>
            
            {/* Chats Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading as="h2" size="md">Recent Messages</Heading>
                  <Button 
                    size="sm"
                    colorScheme="brand"
                    leftIcon={<Icon as={FaComment} />}
                    onClick={() => router.push('/chats')}
                  >
                    View All Chats
                  </Button>
                </Flex>
                
                {isChatsLoading ? (
                  <Flex justify="center" p={6}>
                    <Spinner size="xl" />
                  </Flex>
                ) : chats.length === 0 ? (
                  <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md">
                    <Text mb={4}>No active chats.</Text>
                    <Button 
                      colorScheme="brand" 
                      onClick={() => router.push('/chats')}
                    >
                      Go to Messages
                    </Button>
                  </Box>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {chats.slice(0, 3).map(chat => (
                      <Card key={chat.id} cursor="pointer" onClick={(e) => handleNavigateToChat(chat.id, e)} _hover={{ shadow: 'md' }} transition="all 0.2s">
                        <CardBody>
                          <Flex justify="space-between" align="center">
                            <Flex align="center">
                              <Avatar 
                                name={chat.clientName} 
                                src={chat.clientAvatar} 
                                size="md" 
                                mr={3}
                              />
                              <Box>
                                <Text fontWeight="bold">{chat.clientName}</Text>
                                <Text fontSize="xs" color="gray.600">
                                  Re: {chat.serviceName || 'Service request'}
                                </Text>
                                <Text noOfLines={1} fontSize="sm" color="gray.600">
                                  {chat.lastMessage}
                                </Text>
                              </Box>
                            </Flex>
                            <Box textAlign="right">
                              <Text fontSize="xs" color="gray.500">
                                {new Date(chat.timestamp).toLocaleDateString()}
                              </Text>
                              {chat.unread > 0 && (
                                <Badge colorScheme="red" borderRadius="full" mt={1}>
                                  {chat.unread}
                                </Badge>
                              )}
                            </Box>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                    {chats.length > 3 && (
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/chats')}
                        alignSelf="center"
                      >
                        See All ({chats.length}) Conversations
                      </Button>
                    )}
                  </VStack>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
      
      {/* Floating Chat Button */}
      <Box 
        position="fixed" 
        bottom="30px" 
        right="30px" 
        zIndex={10}
      >
        <Tooltip label="Go to Messages">
          <Button
            size="lg"
            colorScheme="brand"
            borderRadius="full"
            width="60px"
            height="60px"
            boxShadow="lg"
            onClick={() => router.push('/chats')}
            position="relative"
          >
            <Icon as={FaComment} w={6} h={6} />
            
            {chats.filter(c => c.unread > 0).length > 0 && (
              <Badge 
                colorScheme="red" 
                borderRadius="full" 
                position="absolute" 
                top="-5px" 
                right="-5px"
                px={2}
              >
                {chats.filter(c => c.unread > 0).length}
              </Badge>
            )}
          </Button>
        </Tooltip>
      </Box>

      {/* Main Content Area */}
      <Box flex="1" p={6}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          
          {/* Profile Completion Card */}
          <Card>
            <CardHeader>
              <Heading size="md">Profile Completion</Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>Complete your profile to attract more clients</Text>
              
              <Progress 
                value={profileCompletionPercent} 
                size="sm" 
                colorScheme="green" 
                mb={3} 
                borderRadius="md"
              />
              
              <Text fontSize="sm" mb={3}>
                {profileCompletionPercent}% Complete
              </Text>
              
              <Button 
                colorScheme="blue" 
                variant="outline" 
                size="sm" 
                onClick={onProfileSectionOpen}
              >
                Complete Profile
              </Button>
            </CardBody>
          </Card>
          
          {/* Service Stats Card */}
          <Card>
            <CardHeader bg="purple.50" _dark={{ bg: "purple.900" }}>
              <HStack>
                <Icon as={FaPlus} boxSize="6" color="purple.500" />
                <Heading size="md">Services</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text mb={4}>Create and manage your service offerings</Text>
              
              <SimpleGrid columns={2} spacing={4} mb={4}>
                <Box textAlign="center" p={3} borderWidth="1px" borderRadius="md">
                  <Heading size="md">{serviceCount}</Heading>
                  <Text fontSize="sm">Active Services</Text>
                </Box>
                <Box textAlign="center" p={3} borderWidth="1px" borderRadius="md">
                  <Heading size="md">{services.length - serviceCount}</Heading>
                  <Text fontSize="sm">Inactive</Text>
                </Box>
              </SimpleGrid>
              
              <Button 
                colorScheme="purple" 
                leftIcon={<FaPlus />}
                onClick={() => {
                  setCurrentService({
                    id: null,
                    name: '',
                    categoryId: '',
                    price: '',
                    description: '',
                    availability: [],
                    isActive: true,
                    image: null
                  });
                  setIsEditing(true);
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }}
              >
                Create New Service
              </Button>
            </CardBody>
          </Card>

          {/* PayPal Connect Card */}
          <Card>
            <CardHeader bg="green.50" _dark={{ bg: "green.900" }}>
              <HStack>
                <Icon as={FaMoneyBillWave} boxSize="6" color="green.500" />
                <Heading size="md">Payments</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text mb={4}>Connect with PayPal to receive payments from clients</Text>
              
              <Button 
                as={NextLink}
                href="/provider/settings/payments"
                colorScheme="blue" 
                leftIcon={<FaPaypal />}
              >
                Connect PayPal Account
              </Button>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
    </Container>
  );
}