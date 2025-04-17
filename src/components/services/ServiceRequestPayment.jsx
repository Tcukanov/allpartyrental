const BookingSummary = ({ bookingInfo }) => (
  <VStack align="stretch" spacing={3} w="100%" bg="gray.50" p={4} borderRadius="md">
    <Heading size="md">Booking Summary</Heading>
    <Box>
      <Text fontWeight="bold">Date:</Text>
      <Text>{bookingInfo.formattedDate}</Text>
    </Box>
    <Box>
      <Text fontWeight="bold">Time:</Text>
      <Text>{bookingInfo.time}</Text>
    </Box>
    <Box>
      <Text fontWeight="bold">Duration:</Text>
      <Text>{bookingInfo.duration} hours</Text>
    </Box>
    {bookingInfo.comments && (
      <Box>
        <Text fontWeight="bold">Comments:</Text>
        <Text>{bookingInfo.comments}</Text>
      </Box>
    )}
  </VStack>
); 