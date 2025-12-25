import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Geom } from 'next/font/google';
import ToasterProvider from '@/components/ToasterProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { DistrictProvider } from '@/contexts/DistrictContext';
import '../app/globals.css';

const geom = Geom({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geom',
  display: 'swap',
});

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
    <html lang="en" className={geom.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <DistrictProvider>
              <ToasterProvider />
              {children}
            </DistrictProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
