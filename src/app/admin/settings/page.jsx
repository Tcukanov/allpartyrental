'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightAddon,
  Switch,
  Select,
  Button,
  Flex,
  Stack,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  HStack,
  RadioGroup,
  Radio,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSave, FiCheckCircle, FiSettings, FiCreditCard, FiMail, FiGlobe, FiLock, FiClock, FiPercent } from 'react-icons/fi';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    general: {
      siteName: '',
      tagline: '',
      adminEmail: '',
      supportEmail: '',
      timezone: '',
      maintenanceMode: false,
    },
    payments: {
      currency: '',
      platformFeePercent: 0,
      stripeMode: '',
      stripeTestPublicKey: '',
      stripeTestSecretKey: '',
      stripeLivePublicKey: '',
      stripeLiveSecretKey: '',
      escrowPeriodDays: 0,
      reviewPeriodHours: 0,
      clientFeePercent: 0,
      providerFeePercent: 0,
    },
    notifications: {
      emailNotifications: false,
      smsNotifications: false,
      adminAlerts: false,
      emailService: '',
      sendgridApiKey: '',
      smsService: '',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
    },
    security: {
      registrationEnabled: false,
      requireEmailVerification: false,
      twoFactorEnabled: false,
      loginAttempts: 0,
      sessionTimeout: 0,
      passwordMinLength: 0,
      passwordRequireUppercase: false,
      passwordRequireNumbers: false,
      passwordRequireSpecial: false,
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  
  useEffect(() => {
    // Fetch settings from the API
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/settings');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load settings');
        }
        
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings: ' + err.message);
        
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [toast]);
  
  const handleGeneralChange = (e) => {
    const { name, value, checked } = e.target;
    const finalValue = e.target.type === 'checkbox' ? checked : value;
    
    setSettings({
      ...settings,
      general: {
        ...settings.general,
        [name]: finalValue
      }
    });
  };
  
  const handlePaymentsChange = (e) => {
    const { name, value, checked } = e.target;
    const finalValue = e.target.type === 'checkbox' ? checked : value;
    
    setSettings({
      ...settings,
      payments: {
        ...settings.payments,
        [name]: finalValue
      }
    });
  };
  
  const handleNotificationsChange = (e) => {
    const { name, value, checked } = e.target;
    const finalValue = e.target.type === 'checkbox' ? checked : value;
    
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [name]: finalValue
      }
    });
  };
  
  const handleSecurityChange = (e) => {
    const { name, value, checked } = e.target;
    const finalValue = e.target.type === 'checkbox' ? checked : value;
    
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [name]: finalValue
      }
    });
  };
  
  const handleRadioChange = (section, name, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [name]: value
      }
    });
  };
  
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      const result = await response.json();
      setSaveSuccess(true);
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings: ' + err.message);
      
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
      
      // Auto-clear success message after 3 seconds
      if (saveSuccess) {
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    }
  };
  
  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }
  
  return (
    <Container maxW="container.xl">
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>Settings</Heading>
          <Text color="gray.600">Configure system settings and preferences</Text>
        </Box>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {saveSuccess && (
          <Alert status="success">
            <AlertIcon />
            Settings saved successfully
          </Alert>
        )}
        
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <HStack spacing={1}>
                <FiSettings />
                <Text>General</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={1}>
                <FiCreditCard />
                <Text>Payments</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={1}>
                <FiMail />
                <Text>Notifications</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={1}>
                <FiLock />
                <Text>Security</Text>
              </HStack>
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* General Settings */}
            <TabPanel>
              <Card bg={cardBg}>
                <CardHeader>
                  <Heading size="md">General Settings</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                    <Stack spacing={5}>
                      <FormControl>
                        <FormLabel>Site Name</FormLabel>
                        <Input
                          name="siteName"
                          value={settings.general.siteName}
                          onChange={handleGeneralChange}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Tagline</FormLabel>
                        <Input
                          name="tagline"
                          value={settings.general.tagline}
                          onChange={handleGeneralChange}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Admin Email</FormLabel>
                        <Input
                          name="adminEmail"
                          type="email"
                          value={settings.general.adminEmail}
                          onChange={handleGeneralChange}
                        />
                      </FormControl>
                    </Stack>
                    
                    <Stack spacing={5}>
                      <FormControl>
                        <FormLabel>Support Email</FormLabel>
                        <Input
                          name="supportEmail"
                          type="email"
                          value={settings.general.supportEmail}
                          onChange={handleGeneralChange}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          name="timezone"
                          value={settings.general.timezone}
                          onChange={handleGeneralChange}
                        >
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                          <option value="Europe/London">London (GMT)</option>
                          <option value="Europe/Paris">Paris (CET)</option>
                          <option value="Asia/Tokyo">Tokyo (JST)</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Maintenance Mode
                        </FormLabel>
                        <Switch
                          name="maintenanceMode"
                          isChecked={settings.general.maintenanceMode}
                          onChange={handleGeneralChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                    </Stack>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* Payment Settings */}
            <TabPanel>
              <Stack spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Platform Fees</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                      <FormControl>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          name="currency"
                          value={settings.payments.currency}
                          onChange={handlePaymentsChange}
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Client Fee (%)</FormLabel>
                        <InputGroup>
                          <Input
                            name="clientFeePercent"
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            value={settings.payments.clientFeePercent}
                            onChange={handlePaymentsChange}
                          />
                          <InputRightAddon children="%" />
                        </InputGroup>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Fee charged to clients, added on top of the service price
                        </Text>
                      </FormControl>
                      
                      <FormControl gridColumn={{ md: 'span 2' }}>
                        <FormLabel>Provider Fee (%)</FormLabel>
                        <InputGroup>
                          <Input
                            name="providerFeePercent"
                            type="number"
                            min="0"
                            max="30"
                            step="0.1"
                            value={settings.payments.providerFeePercent}
                            onChange={handlePaymentsChange}
                          />
                          <InputRightAddon children="%" />
                        </InputGroup>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Fee deducted from the provider's payment when funds are released from escrow
                        </Text>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg}>
                  <CardHeader>
                    <HStack>
                      <Heading size="md">Stripe Configuration</Heading>
                      <Badge colorScheme={settings.payments.stripeMode === 'live' ? 'green' : 'blue'}>
                        {settings.payments.stripeMode === 'live' ? 'Live' : 'Test'} Mode
                      </Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={6}>
                      <RadioGroup
                        value={settings.payments.stripeMode}
                        onChange={(value) => handleRadioChange('payments', 'stripeMode', value)}
                      >
                        <Stack direction="row" spacing={5}>
                          <Radio value="test" colorScheme="blue">Test Mode</Radio>
                          <Radio value="live" colorScheme="green">Live Mode</Radio>
                        </Stack>
                      </RadioGroup>
                      
                      <Accordion allowToggle>
                        <AccordionItem>
                          <h2>
                            <AccordionButton>
                              <Box flex="1" textAlign="left">
                                Test Credentials
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4}>
                            <Stack spacing={4}>
                              <FormControl>
                                <FormLabel>Stripe Test Public Key</FormLabel>
                                <Input
                                  name="stripeTestPublicKey"
                                  value={settings.payments.stripeTestPublicKey}
                                  onChange={handlePaymentsChange}
                                />
                              </FormControl>
                              
                              <FormControl>
                                <FormLabel>Stripe Test Secret Key</FormLabel>
                                <Input
                                  name="stripeTestSecretKey"
                                  value={settings.payments.stripeTestSecretKey}
                                  onChange={handlePaymentsChange}
                                  type="password"
                                />
                              </FormControl>
                            </Stack>
                          </AccordionPanel>
                        </AccordionItem>
                        
                        <AccordionItem>
                          <h2>
                            <AccordionButton>
                              <Box flex="1" textAlign="left">
                                Live Credentials
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4}>
                            <Stack spacing={4}>
                              <FormControl>
                                <FormLabel>Stripe Live Public Key</FormLabel>
                                <Input
                                  name="stripeLivePublicKey"
                                  value={settings.payments.stripeLivePublicKey}
                                  onChange={handlePaymentsChange}
                                />
                              </FormControl>
                              
                              <FormControl>
                                <FormLabel>Stripe Live Secret Key</FormLabel>
                                <Input
                                  name="stripeLiveSecretKey"
                                  value={settings.payments.stripeLiveSecretKey}
                                  onChange={handlePaymentsChange}
                                  type="password"
                                />
                              </FormControl>
                            </Stack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </Stack>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Escrow Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                      <FormControl>
                        <FormLabel>Escrow Period (Days)</FormLabel>
                        <InputGroup>
                          <Input
                            name="escrowPeriodDays"
                            type="number"
                            min="1"
                            max="60"
                            value={settings.payments.escrowPeriodDays}
                            onChange={handlePaymentsChange}
                          />
                          <InputRightAddon children="days" />
                        </InputGroup>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Provider Review Period (Hours)</FormLabel>
                        <InputGroup>
                          <Input
                            name="reviewPeriodHours"
                            type="number"
                            min="1"
                            max="72"
                            value={settings.payments.reviewPeriodHours}
                            onChange={handlePaymentsChange}
                          />
                          <InputRightAddon children="hours" />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              </Stack>
            </TabPanel>
            
            {/* Notification Settings */}
            <TabPanel>
              <Stack spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Notification Preferences</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={4}>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Email Notifications
                        </FormLabel>
                        <Switch
                          name="emailNotifications"
                          isChecked={settings.notifications.emailNotifications}
                          onChange={handleNotificationsChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          SMS Notifications
                        </FormLabel>
                        <Switch
                          name="smsNotifications"
                          isChecked={settings.notifications.smsNotifications}
                          onChange={handleNotificationsChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Admin Alerts
                        </FormLabel>
                        <Switch
                          name="adminAlerts"
                          isChecked={settings.notifications.adminAlerts}
                          onChange={handleNotificationsChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                    </Stack>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Email Service Configuration</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={5}>
                      <FormControl>
                        <FormLabel>Email Service</FormLabel>
                        <Select
                          name="emailService"
                          value={settings.notifications.emailService}
                          onChange={handleNotificationsChange}
                        >
                          <option value="sendgrid">SendGrid</option>
                          <option value="mailchimp">Mailchimp</option>
                          <option value="smtp">Custom SMTP</option>
                        </Select>
                      </FormControl>
                      
                      {settings.notifications.emailService === 'sendgrid' && (
                        <FormControl>
                          <FormLabel>SendGrid API Key</FormLabel>
                          <Input
                            name="sendgridApiKey"
                            value={settings.notifications.sendgridApiKey}
                            onChange={handleNotificationsChange}
                            type="password"
                          />
                        </FormControl>
                      )}
                    </Stack>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">SMS Service Configuration</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={5}>
                      <FormControl>
                        <FormLabel>SMS Service</FormLabel>
                        <Select
                          name="smsService"
                          value={settings.notifications.smsService}
                          onChange={handleNotificationsChange}
                          isDisabled={!settings.notifications.smsNotifications}
                        >
                          <option value="twilio">Twilio</option>
                          <option value="nexmo">Nexmo</option>
                        </Select>
                      </FormControl>
                      
                      {settings.notifications.smsService === 'twilio' && settings.notifications.smsNotifications && (
                        <>
                          <FormControl>
                            <FormLabel>Twilio Account SID</FormLabel>
                            <Input
                              name="twilioAccountSid"
                              value={settings.notifications.twilioAccountSid}
                              onChange={handleNotificationsChange}
                            />
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel>Twilio Auth Token</FormLabel>
                            <Input
                              name="twilioAuthToken"
                              value={settings.notifications.twilioAuthToken}
                              onChange={handleNotificationsChange}
                              type="password"
                            />
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel>Twilio Phone Number</FormLabel>
                            <Input
                              name="twilioPhoneNumber"
                              value={settings.notifications.twilioPhoneNumber}
                              onChange={handleNotificationsChange}
                            />
                          </FormControl>
                        </>
                      )}
                    </Stack>
                  </CardBody>
                </Card>
              </Stack>
            </TabPanel>
            
            {/* Security Settings */}
            <TabPanel>
              <Stack spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">User Registration</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={4}>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Enable User Registration
                        </FormLabel>
                        <Switch
                          name="registrationEnabled"
                          isChecked={settings.security.registrationEnabled}
                          onChange={handleSecurityChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Require Email Verification
                        </FormLabel>
                        <Switch
                          name="requireEmailVerification"
                          isChecked={settings.security.requireEmailVerification}
                          onChange={handleSecurityChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                    </Stack>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Authentication</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Two-Factor Authentication
                        </FormLabel>
                        <Switch
                          name="twoFactorEnabled"
                          isChecked={settings.security.twoFactorEnabled}
                          onChange={handleSecurityChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Max Login Attempts</FormLabel>
                        <Input
                          name="loginAttempts"
                          type="number"
                          min="1"
                          max="10"
                          value={settings.security.loginAttempts}
                          onChange={handleSecurityChange}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Session Timeout (hours)</FormLabel>
                        <InputGroup>
                          <Input
                            name="sessionTimeout"
                            type="number"
                            min="1"
                            max="168"
                            value={settings.security.sessionTimeout}
                            onChange={handleSecurityChange}
                          />
                          <InputRightAddon children="hours" />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Password Requirements</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                      <FormControl>
                        <FormLabel>Minimum Password Length</FormLabel>
                        <Input
                          name="passwordMinLength"
                          type="number"
                          min="6"
                          max="20"
                          value={settings.security.passwordMinLength}
                          onChange={handleSecurityChange}
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Require Uppercase
                        </FormLabel>
                        <Switch
                          name="passwordRequireUppercase"
                          isChecked={settings.security.passwordRequireUppercase}
                          onChange={handleSecurityChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Require Numbers
                        </FormLabel>
                        <Switch
                          name="passwordRequireNumbers"
                          isChecked={settings.security.passwordRequireNumbers}
                          onChange={handleSecurityChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Require Special Characters
                        </FormLabel>
                        <Switch
                          name="passwordRequireSpecial"
                          isChecked={settings.security.passwordRequireSpecial}
                          onChange={handleSecurityChange}
                          colorScheme="blue"
                        />
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <Flex justify="flex-end">
          <Button
            leftIcon={<FiSave />}
            colorScheme="blue"
            onClick={handleSaveSettings}
            isLoading={saving}
            loadingText="Saving"
            size="lg"
          >
            Save Settings
          </Button>
        </Flex>
      </Stack>
    </Container>
  );
} 