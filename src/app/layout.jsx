import { Providers } from './providers';
import '@/styles/globals.css';

export const metadata = {
  title: 'Party & Event Service Marketplace',
  description: 'Connect with service providers for your next party or event',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
