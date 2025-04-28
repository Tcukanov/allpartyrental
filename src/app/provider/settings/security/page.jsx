'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  Divider,
  useToast,
  VStack,
  HStack,
  Switch,
  FormHelperText,
  InputGroup,
  InputRightElement,
  IconButton,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiShield, FiSave } from 'react-icons/fi';
import SettingsLayout from '@/components/provider/SettingsLayout';

export default function ProviderSecuritySettingsPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSecuritySettingChange = (setting) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePasswordUpdate = async () => {
    // Validation
    if (!passwordData.currentPassword) {
      toast({
        title: 'Current password required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'New password too short',
        description: 'Password must be at least 8 characters long',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirmation must match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, you would call your API here
      // const response = await fetch('/api/provider/password', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     currentPassword: passwordData.currentPassword,
      //     newPassword: passwordData.newPassword,
      //   }),
      // });

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Clear the form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySettingsUpdate = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would call your API here
      // const response = await fetch('/api/provider/security-settings', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(securitySettings),
      // });

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Security settings updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update security settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsLayout>
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
        <Heading size="lg" mb={4}>Security Settings</Heading>
        <Text mb={6}>Manage your account security and authentication preferences</Text>
        <Divider mb={6} />

        <Stack spacing={10}>
          <Box>
            <Heading size="md" mb={4}>Change Password</Heading>
            <VStack spacing={4} align="start">
              <FormControl isRequired>
                <FormLabel>Current Password</FormLabel>
                <InputGroup>
                  <Input
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      icon={showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>New Password</FormLabel>
                <InputGroup>
                  <Input
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your new password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      icon={showNewPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText>Password must be at least 8 characters long</FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Confirm New Password</FormLabel>
                <InputGroup>
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm your new password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                leftIcon={<FiSave />}
                colorScheme="blue"
                isLoading={isLoading}
                onClick={handlePasswordUpdate}
                alignSelf="flex-end"
              >
                Update Password
              </Button>
            </VStack>
          </Box>

          <Divider />

          <Box>
            <Heading size="md" mb={4}>Security Preferences</Heading>
            <Alert status="info" mb={4}>
              <AlertIcon />
              Some security features may not be available during the beta phase
            </Alert>
            <VStack spacing={4} align="start">
              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={securitySettings.twoFactorEnabled}
                  onChange={() => handleSecuritySettingChange('twoFactorEnabled')}
                  id="two-factor"
                  colorScheme="blue"
                  isDisabled
                />
                <FormLabel htmlFor="two-factor" mb="0" ml={3}>
                  Two-Factor Authentication (Coming Soon)
                </FormLabel>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={securitySettings.emailNotifications}
                  onChange={() => handleSecuritySettingChange('emailNotifications')}
                  id="email-notifications"
                  colorScheme="blue"
                />
                <FormLabel htmlFor="email-notifications" mb="0" ml={3}>
                  Email Notifications for Account Activity
                </FormLabel>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={securitySettings.loginAlerts}
                  onChange={() => handleSecuritySettingChange('loginAlerts')}
                  id="login-alerts"
                  colorScheme="blue"
                />
                <FormLabel htmlFor="login-alerts" mb="0" ml={3}>
                  Alert Me About Unusual Login Activity
                </FormLabel>
              </FormControl>

              <Button
                leftIcon={<FiShield />}
                colorScheme="blue"
                isLoading={isLoading}
                onClick={handleSecuritySettingsUpdate}
                alignSelf="flex-end"
                mt={2}
              >
                Save Preferences
              </Button>
            </VStack>
          </Box>
        </Stack>
      </Box>
    </SettingsLayout>
  );
} 