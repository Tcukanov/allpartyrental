"use client";

import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '../styles/theme';
import { SessionProvider } from 'next-auth/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <ChakraProvider theme={theme}>
        <DndProvider backend={HTML5Backend}>
          {children}
        </DndProvider>
      </ChakraProvider>
    </SessionProvider>
  );
}
