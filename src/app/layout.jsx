import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import MainLayout from '@/components/layout/MainLayout';
import '@/styles/globals.css';

export const metadata = {
  title: 'Party & Event Service Marketplace',
  description: 'Connect with service providers for your next party or event',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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
