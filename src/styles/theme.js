// src/styles/theme.js

import { extendTheme } from '@chakra-ui/react';

// Brand colors for the Party Marketplace
const colors = {
  brand: {
    50: '#f0e4ff',
    100: '#d1b8ff',
    200: '#b28bfe',
    300: '#935dfd',
    400: '#7431fc',
    500: '#6610f2', // Primary brand color
    600: '#520bc6',
    700: '#3e089a',
    800: '#2a066e',
    900: '#170341',
  },
  secondary: {
    50: '#e7f5fe',
    100: '#c4e5fc',
    200: '#9ed5f9',
    300: '#78c5f7',
    400: '#52b5f5',
    500: '#3ba5f3', // Secondary color
    600: '#2e84c3',
    700: '#226393',
    800: '#164263',
    900: '#0a2234',
  },
  accent: {
    50: '#ffebef',
    100: '#ffc8d2',
    200: '#ffa5b5',
    300: '#ff8298',
    400: '#ff5f7a',
    500: '#ff3c5d', // Accent color
    600: '#cc304a',
    700: '#992438',
    800: '#661825',
    900: '#330c13',
  },
};

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'bold',
      borderRadius: 'md',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
        color: 'white',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.600' : undefined,
        },
      }),
      outline: (props) => ({
        borderColor: props.colorScheme === 'brand' ? 'brand.500' : undefined,
        color: props.colorScheme === 'brand' ? 'brand.500' : undefined,
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.50' : undefined,
        },
      }),
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'sm',
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      px: 2,
      py: 1,
      fontWeight: 'medium',
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'bold',
      letterSpacing: '-0.02em',
    },
    sizes: {
      '2xl': {
        fontSize: ['4xl', null, '5xl'],
        lineHeight: 1.2,
        fontWeight: 800,
      },
      xl: {
        fontSize: ['3xl', null, '4xl'],
        lineHeight: 1.2,
        fontWeight: 700,
      },
      lg: {
        fontSize: ['2xl', null, '3xl'],
        lineHeight: 1.3,
        fontWeight: 700,
      },
      md: {
        fontSize: 'xl',
        lineHeight: 1.4,
        fontWeight: 700,
      }
    }
  },
};

// Global style overrides
const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
  }),
};

// Fonts
const fonts = {
  heading: 'var(--font-nunito), sans-serif',
  body: '"Inter", sans-serif',
};

// Customize theme
const theme = extendTheme({
  colors,
  components,
  styles,
  fonts,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export { theme };