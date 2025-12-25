import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import ToasterProvider from '@/components/ToasterProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { DistrictProvider } from '@/contexts/DistrictContext';
import '../app/globals.css';

// Using Inter as base font, and we'll add Geom via CSS if available
// Note: Geom is not available on Google Fonts, so we'll use a similar geometric font
// If you have Geom font files, you can use localFont instead:
// const geom = localFont({
//   src: './fonts/Geom-Regular.woff2',
//   variable: '--font-geom',
//   display: 'swap',
// });

// For now, using Inter as a geometric sans-serif alternative
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// We'll define Geom via CSS @font-face if font files are available
// Otherwise, we'll use Inter as the header font
const geom = inter; // Temporary: using Inter until Geom font files are added

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
    <html lang="en" className={inter.variable}>
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
