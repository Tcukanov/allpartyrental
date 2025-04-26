'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  Spinner,
  VStack,
  HStack,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  IconButton,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { 
  FiActivity, 
  FiSearch, 
  FiFilter, 
  FiChevronLeft, 
  FiChevronRight, 
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiInfo,
  FiUser,
  FiUsers,
  FiEdit,
  FiTrash2,
  FiLogIn,
  FiLogOut,
  FiSettings,
  FiMoreVertical
} from 'react-icons/fi';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: string;
  action: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SETTINGS' | 'OTHER';
  resource: string;
  resourceId?: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

interface ActivityLogResponse {
  success: boolean;
  data: ActivityLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: {
    message: string;
    details?: string;
  };
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  const toast = useToast();

  const fetchActivityLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (userFilter !== 'all') params.append('userId', userFilter);
      if (actionFilter !== 'all') params.append('actionType', actionFilter);
      if (dateFilter !== 'all') params.append('dateRange', dateFilter);
      
      const response = await fetch(`/api/admin/activity?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: ActivityLogResponse = await response.json();
      
      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.meta?.pages || 1);
        setTotalItems(data.meta?.total || 0);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch activity logs');
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      
      toast({
        title: 'Error fetching logs',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Keep the loading overlay from blocking the UI if we have an error
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, searchQuery, userFilter, actionFilter, dateFilter, toast]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const getActionTypeIcon = (actionType: string) => {
    const icons = {
      'CREATE': FiEdit,
      'UPDATE': FiEdit,
      'DELETE': FiTrash2,
      'LOGIN': FiLogIn,
      'LOGOUT': FiLogOut,
      'SETTINGS': FiSettings,
      'OTHER': FiActivity
    };
    
    return icons[actionType as keyof typeof icons] || FiActivity;
  };

  const getActionTypeColor = (actionType: string) => {
    const colors = {
      'CREATE': 'green',
      'UPDATE': 'blue',
      'DELETE': 'red',
      'LOGIN': 'teal',
      'LOGOUT': 'gray',
      'SETTINGS': 'purple',
      'OTHER': 'orange'
    };
    
    return colors[actionType as keyof typeof colors] || 'gray';
  };

  const getRoleBadge = (role: string) => {
    const colorScheme = {
      'ADMIN': 'purple',
      'PROVIDER': 'blue',
      'CLIENT': 'green',
      'SYSTEM': 'gray'
    }[role] || 'gray';

    return (
      <Badge colorScheme={colorScheme} fontSize="xs">
        {role.toLowerCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return `${diffSec} sec ago`;
    } else if (diffMin < 60) {
      return `${diffMin} min ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hr ago`;
    } else {
      return `${diffDay} day ago`;
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    fetchActivityLogs();
  };

  const handleExport = () => {
    toast({
      title: 'Export initiated',
      description: 'Your activity log export is being generated.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    
    // In a real implementation, this would trigger the export process
    // For now just download the current data as JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `activity_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleRefresh = () => {
    fetchActivityLogs();
    toast({
      title: 'Refreshed',
      description: 'Activity logs have been refreshed.',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading as="h1" size="xl">Activity Logs</Heading>
          <Text color="gray.600">System and user activity history</Text>
        </Box>
        
        <HStack>
          <Tooltip label="Refresh logs" hasArrow>
            <IconButton
              aria-label="Refresh logs"
              icon={<Icon as={FiRefreshCw} />}
              onClick={handleRefresh}
            />
          </Tooltip>
          <Tooltip label="Export logs" hasArrow>
            <IconButton
              aria-label="Export logs"
              icon={<Icon as={FiDownload} />}
              onClick={handleExport}
            />
          </Tooltip>
        </HStack>
      </Flex>
      
      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <form onSubmit={handleSearch}>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search activity logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">All Actions</option>
                <option value="CREATE">Creation</option>
                <option value="UPDATE">Updates</option>
                <option value="DELETE">Deletions</option>
                <option value="LOGIN">Logins</option>
                <option value="LOGOUT">Logouts</option>
                <option value="SETTINGS">Settings</option>
              </Select>
              
              <Select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="ADMIN">Admins</option>
                <option value="PROVIDER">Providers</option>
                <option value="CLIENT">Clients</option>
              </Select>
              
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </Select>
            </SimpleGrid>
            
            <Flex justify="flex-end" mt={4}>
              <Button type="submit" leftIcon={<Icon as={FiFilter} />} colorScheme="blue">
                Apply Filters
              </Button>
            </Flex>
          </form>
        </CardBody>
      </Card>
      
      {/* Activity Logs */}
      <Card>
        <CardBody p={0}>
          {loading ? (
            <Flex justify="center" align="center" minH="300px">
              <Spinner size="xl" />
            </Flex>
          ) : error ? (
            <Box p={8} textAlign="center">
              <Text color="red.500">Error: {error}</Text>
              <Button 
                mt={4} 
                onClick={handleRefresh}
                leftIcon={<Icon as={FiRefreshCw} />}
              >
                Try Again
              </Button>
            </Box>
          ) : logs.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text>No activity logs found matching your criteria.</Text>
              <Button 
                mt={4} 
                onClick={() => {
                  setSearchQuery('');
                  setUserFilter('all');
                  setActionFilter('all');
                  setDateFilter('all');
                  setPage(1);
                  fetchActivityLogs();
                }}
              >
                Reset Filters
              </Button>
            </Box>
          ) : (
            <>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Timestamp</Th>
                      <Th>User</Th>
                      <Th>Action</Th>
                      <Th>Resource</Th>
                      <Th>Details</Th>
                      <Th width="80px"></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {logs.map((log) => (
                      <Tr key={log.id}>
                        <Td>
                          <Tooltip label={formatDate(log.timestamp)} hasArrow>
                            <Text>{formatTimeAgo(log.timestamp)}</Text>
                          </Tooltip>
                        </Td>
                        <Td>
                          <HStack>
                            <Avatar size="xs" name={log.userName} src={log.userAvatar} />
                            <Box>
                              <Text fontSize="sm" fontWeight="medium">{log.userName}</Text>
                              <Box>{getRoleBadge(log.userRole)}</Box>
                            </Box>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack>
                            <Icon 
                              as={getActionTypeIcon(log.actionType)} 
                              color={`${getActionTypeColor(log.actionType)}.500`} 
                            />
                            <Text fontSize="sm">{log.action}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{log.resource}</Text>
                          {log.resourceId && (
                            <Text fontSize="xs" color="gray.500">
                              ID: {log.resourceId}
                            </Text>
                          )}
                        </Td>
                        <Td>
                          <Text fontSize="sm" noOfLines={2}>
                            {log.details || 'No details provided'}
                          </Text>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              size="sm"
                              aria-label="More options"
                            />
                            <MenuList>
                              <MenuItem icon={<Icon as={FiEye} />}>View Details</MenuItem>
                              {log.userId && log.userId !== 'system' && (
                                <MenuItem 
                                  icon={<Icon as={FiUser} />}
                                  as="a" 
                                  href={`/admin/users/${log.userId}`}
                                >
                                  View User
                                </MenuItem>
                              )}
                              {log.resourceId && (
                                <MenuItem 
                                  icon={<Icon as={FiInfo} />}
                                  as="a"
                                  href={`/admin/${log.resource}s/${log.resourceId}`}
                                >
                                  View {log.resource.charAt(0).toUpperCase() + log.resource.slice(1)}
                                </MenuItem>
                              )}
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              
              {/* Pagination */}
              <Flex p={4} justify="space-between" align="center">
                <Text color="gray.500">
                  Showing {logs.length} of {totalItems} entries
                </Text>
                <HStack>
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    isDisabled={page === 1}
                    leftIcon={<Icon as={FiChevronLeft} />}
                  >
                    Previous
                  </Button>
                  <Text>
                    Page {page} of {totalPages}
                  </Text>
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    isDisabled={page === totalPages}
                    rightIcon={<Icon as={FiChevronRight} />}
                  >
                    Next
                  </Button>
                  <Select
                    size="sm"
                    width="80px"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </Select>
                </HStack>
              </Flex>
            </>
          )}
        </CardBody>
      </Card>
    </Container>
  );
} 