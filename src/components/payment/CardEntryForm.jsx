import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  Flex,
  FormErrorMessage,
  useToast,
  Text,
  Image,
  useColorModeValue,
  Stack,
  Select
} from '@chakra-ui/react';
import { 
  FaCreditCard, 
  FaLock, 
  FaUser, 
  FaRegCalendarAlt, 
  FaShieldAlt,
  FaCheck
} from 'react-icons/fa';
import { 
  SiVisa, 
  SiMastercard, 
  SiAmericanexpress, 
  SiDiscover 
} from 'react-icons/si';

/**
 * Modern direct card entry form with card brand detection
 * This collects card details and sends them to our backend which can
 * then process them through PayPal's REST API
 */
const CardEntryForm = ({ onSubmit, isProcessing }) => {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  
  const [errors, setErrors] = useState({});
  const [cardBrand, setCardBrand] = useState(null);
  const [isCardNumberValid, setIsCardNumberValid] = useState(false);
  const toast = useToast();
  
  // Generate month and year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  
  // Colors
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
  const cardShadow = useColorModeValue('sm', 'md');
  const inputBgColor = useColorModeValue('white', 'gray.700');
  
  // Detect card brand based on number
  useEffect(() => {
    if (cardData.cardNumber) {
      const number = cardData.cardNumber.replace(/\s/g, '');
      
      // Very basic card detection regex patterns
      if (/^4/.test(number)) setCardBrand('visa');
      else if (/^5[1-5]/.test(number)) setCardBrand('mastercard');
      else if (/^3[47]/.test(number)) setCardBrand('amex');
      else if (/^6(?:011|5)/.test(number)) setCardBrand('discover');
      else setCardBrand(null);
      
      // Check if card number appears valid (basic length check)
      setIsCardNumberValid(number.length >= 15 && number.length <= 16);
    } else {
      setCardBrand(null);
      setIsCardNumberValid(false);
    }
  }, [cardData.cardNumber]);
  
  // Render the appropriate card brand logo component
  const CardBrandIcon = () => {
    switch (cardBrand) {
      case 'visa':
        return <SiVisa color="#1A1F71" size="24px" />;
      case 'mastercard':
        return <SiMastercard color="#EB001B" size="24px" />;
      case 'amex':
        return <SiAmericanexpress color="#006FCF" size="24px" />;
      case 'discover':
        return <SiDiscover color="#FF6600" size="24px" />;
      default:
        return <FaCreditCard color="#718096" size="20px" />;
    }
  };
  
  // Format expiry date as MM/YY for display
  const formatExpiryDate = () => {
    const { expiryMonth, expiryYear } = cardData;
    
    if (expiryMonth && expiryYear) {
      // If year is 4 digits, use just the last 2
      const year = expiryYear.toString().length === 4 
        ? expiryYear.toString().substr(2, 2) 
        : expiryYear.toString();
        
      return `${expiryMonth.padStart(2, '0')}/${year}`;
    }
    
    return '';
  };
  
  // Update form field values
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Remove non-digits
      const digits = value.replace(/\D/g, '');
      // Add spaces every 4 digits (for non-Amex) or 4-6-5 pattern for Amex
      let formatted;
      
      if (/^3[47]/.test(digits)) {
        // American Express format: XXXX XXXXXX XXXXX
        formatted = digits
          .replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3')
          .trim()
          .slice(0, 17); // Limit to 15 digits + 2 spaces
      } else {
        // Regular format: XXXX XXXX XXXX XXXX
        formatted = digits
          .replace(/(\d{4})(?=\d)/g, '$1 ')
          .trim()
          .slice(0, 19); // Limit to 16 digits + 3 spaces
      }
      
      setCardData({ ...cardData, [name]: formatted });
    } else {
      setCardData({ ...cardData, [name]: value });
    }
  };
  
  // Basic validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 15) {
      newErrors.cardNumber = 'Enter a valid card number';
    }
    
    if (!cardData.expiryMonth || parseInt(cardData.expiryMonth) < 1 || parseInt(cardData.expiryMonth) > 12) {
      newErrors.expiryMonth = 'Invalid month';
    }
    
    const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of year
    const yearValue = parseInt(cardData.expiryYear.toString().slice(-2));
    
    if (!cardData.expiryYear || yearValue < currentYear) {
      newErrors.expiryYear = 'Invalid year';
    }
    
    if (!cardData.cvv || cardData.cvv.length < 3) {
      newErrors.cvv = 'Enter CVV';
    }
    
    if (!cardData.cardholderName) {
      newErrors.cardholderName = 'Enter name on card';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Format data for submission
      const formattedData = {
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear.toString().length === 2 ? `20${cardData.expiryYear}` : cardData.expiryYear,
        cvv: cardData.cvv,
        cardholderName: cardData.cardholderName
      };
      
      onSubmit(formattedData);
    } else {
      toast({
        title: 'Form Error',
        description: 'Please check the card information and try again',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit}
      width="100%"
      bg={cardBgColor}
      borderRadius="xl"
      boxShadow={cardShadow}
      p={5}
    >
      <Stack spacing={4}>
        {/* Virtual Card Display */}
        <Box 
          bg="linear-gradient(45deg, #0070ba, #1546a0)" 
          color="white" 
          borderRadius="lg" 
          p={4} 
          mb={3}
          position="relative"
          boxShadow="md"
          height="160px"
        >
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Text fontWeight="bold" fontSize="xl">Credit Card</Text>
            <CardBrandIcon />
          </Flex>
          
          <Text letterSpacing="wider" fontSize="lg" mb={2}>
            {cardData.cardNumber || '•••• •••• •••• ••••'}
          </Text>
          
          <Flex justifyContent="space-between" mt="auto">
            <Box>
              <Text fontSize="xs" opacity={0.8}>CARD HOLDER</Text>
              <Text fontSize="sm" fontWeight="medium" textTransform="uppercase">
                {cardData.cardholderName || 'YOUR NAME'}
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" opacity={0.8}>EXPIRES</Text>
              <Text fontSize="sm" fontWeight="medium">
                {formatExpiryDate() || 'MM/YY'}
              </Text>
            </Box>
          </Flex>
          
          {/* Chip */}
          <Box 
            position="absolute"
            top="4" 
            right="4" 
            bg="rgba(255, 255, 255, 0.2)"
            borderRadius="sm"
            width="40px"
            height="30px"
          />
        </Box>
        
        {/* Card Holder Name */}
        <FormControl isInvalid={errors.cardholderName}>
          <FormLabel htmlFor="cardholderName" fontSize="sm">Name on Card</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FaUser color="gray.300" />
            </InputLeftElement>
            <Input
              id="cardholderName"
              name="cardholderName"
              placeholder="Name on card"
              value={cardData.cardholderName}
              onChange={handleChange}
              bg={inputBgColor}
              border="1px solid"
              borderColor={cardBorderColor}
              isRequired
            />
          </InputGroup>
          <FormErrorMessage>{errors.cardholderName}</FormErrorMessage>
        </FormControl>
        
        {/* Card Number */}
        <FormControl isInvalid={errors.cardNumber}>
          <FormLabel htmlFor="cardNumber" fontSize="sm">Card Number</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <CardBrandIcon />
            </InputLeftElement>
            <Input
              id="cardNumber"
              name="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardData.cardNumber}
              onChange={handleChange}
              maxLength={19}
              bg={inputBgColor}
              border="1px solid"
              borderColor={cardBorderColor}
              isRequired
            />
            {isCardNumberValid && (
              <InputRightElement>
                <FaCheck color="green" />
              </InputRightElement>
            )}
          </InputGroup>
          <FormErrorMessage>{errors.cardNumber}</FormErrorMessage>
        </FormControl>
        
        {/* Expiry & CVV - Switch to separate fields for better usability */}
        <Flex gap={4}>
          {/* Month Dropdown */}
          <FormControl isInvalid={errors.expiryMonth}>
            <FormLabel htmlFor="expiryMonth" fontSize="sm">Expiry Month</FormLabel>
            <InputGroup>
              <Select
                id="expiryMonth"
                name="expiryMonth"
                placeholder="Month"
                value={cardData.expiryMonth}
                onChange={handleChange}
                bg={inputBgColor}
                isRequired
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  return (
                    <option key={month} value={month.toString().padStart(2, '0')}>
                      {month.toString().padStart(2, '0')}
                    </option>
                  );
                })}
              </Select>
            </InputGroup>
            <FormErrorMessage>{errors.expiryMonth}</FormErrorMessage>
          </FormControl>
          
          {/* Year Dropdown */}
          <FormControl isInvalid={errors.expiryYear}>
            <FormLabel htmlFor="expiryYear" fontSize="sm">Expiry Year</FormLabel>
            <InputGroup>
              <Select
                id="expiryYear"
                name="expiryYear"
                placeholder="Year"
                value={cardData.expiryYear}
                onChange={handleChange}
                bg={inputBgColor}
                isRequired
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </InputGroup>
            <FormErrorMessage>{errors.expiryYear}</FormErrorMessage>
          </FormControl>
          
          {/* CVV */}
          <FormControl isInvalid={errors.cvv}>
            <FormLabel htmlFor="cvv" fontSize="sm">CVV</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaShieldAlt color="gray.300" />
              </InputLeftElement>
              <Input
                id="cvv"
                name="cvv"
                placeholder="123"
                value={cardData.cvv}
                onChange={handleChange}
                maxLength={4}
                type="password"
                bg={inputBgColor}
                border="1px solid"
                borderColor={cardBorderColor}
                isRequired
              />
            </InputGroup>
            <FormErrorMessage>{errors.cvv}</FormErrorMessage>
          </FormControl>
        </Flex>
        
        {/* Submit Button */}
        <Button
          type="submit"
          colorScheme="blue"
          width="100%"
          mt={4}
          py={6}
          leftIcon={<FaCreditCard />}
          isLoading={isProcessing}
          loadingText="Processing..."
          borderRadius="md"
          fontSize="md"
          fontWeight="bold"
        >
          Pay Now
        </Button>
        
        {/* Security Notice */}
        <Flex 
          align="center" 
          justify="center" 
          fontSize="sm" 
          color="gray.500"
          bg="gray.50"
          p={2}
          borderRadius="md"
        >
          <FaLock style={{ marginRight: '8px' }} />
          <Text>Secure and encrypted payment</Text>
        </Flex>
      </Stack>
    </Box>
  );
};

export default CardEntryForm; 