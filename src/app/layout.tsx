import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import ToasterProvider from '@/components/ToasterProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import '../app/globals.css';

export const metadata: Metadata = {
  title: 'EasyFinder - Get Any Task Done',
  description: 'Connect with skilled professionals in Sri Lanka. Get any task done quickly and reliably.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="en">
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ToasterProvider />
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
