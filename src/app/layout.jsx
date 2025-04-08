import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import MainLayout from '@/components/layout/MainLayout';
import '@/styles/globals.css';
import { Inter, Nunito } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const nunito = Nunito({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
});

export const metadata = {
  title: 'Party & Event Service Marketplace',
  description: 'Connect with service providers for your next party or event',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.className} ${nunito.variable}`}>
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
