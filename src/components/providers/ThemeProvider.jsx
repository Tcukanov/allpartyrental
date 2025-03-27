'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#fdf3f0',
      100: '#fbe4dd',
      200: '#f7d5ca',
      300: '#f3c6b7',
      400: '#efb7a4',
      500: '#de7e5d',
      600: '#c26b4a',
      700: '#a65837',
      800: '#8a4524',
      900: '#6e3211',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
});

export function ThemeProvider({ children }) {
  return (
    <ChakraProvider theme={theme}>
      {children}
    </ChakraProvider>
  );
} 