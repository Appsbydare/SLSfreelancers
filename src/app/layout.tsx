import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import localFont from 'next/font/local';
import ToasterProvider from '@/components/ToasterProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { DistrictProvider } from '@/contexts/DistrictContext';
import '../app/globals.css';

// Load Geom font from public/fonts directory
const geom = localFont({
  src: [
    {
      path: '../public/fonts/Geom-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Geom-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Geom-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Geom-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
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
