import MainLayout from '@/components/layout/MainLayout';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
} 