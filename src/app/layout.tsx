import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import MainLayout from '@/components/layout/MainLayout';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import '@/styles/globals.css';
import { Inter, Nunito } from 'next/font/google';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });
const nunito = Nunito({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
});

export const metadata = {
  title: 'Party & Event Service Marketplace',
  description: 'Connect with service providers for your next party or event',
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: { 
      url: '/favicon/apple-touch-icon.png', 
      sizes: '180x180', 
      type: 'image/png' 
    },
    other: [
      { 
        rel: 'android-chrome-192x192', 
        url: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      { 
        rel: 'android-chrome-512x512', 
        url: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        rel: 'manifest',
        url: '/favicon/site.webmanifest'
      }
    ]
  }
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.className} ${nunito.variable}`}>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={`${inter.className} ${nunito.variable}`}>
        <SessionProvider>
          <ThemeProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
} 