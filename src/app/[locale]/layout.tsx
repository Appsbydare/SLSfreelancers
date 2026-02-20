import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import { DistrictProvider } from '@/contexts/DistrictContext';
import { AuthProvider } from '@/contexts/AuthContext';
import NotificationListener from '@/components/NotificationListener';
import ToasterProvider from '@/components/ToasterProvider';
import { supabaseServer } from '@/lib/supabase-server';

const locales = ['en', 'si', 'ta'];

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <DistrictProvider>
          <ToasterProvider />
          <NotificationListener />
          <Layout>
            {children}
          </Layout>
        </DistrictProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
