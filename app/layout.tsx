import { ClerkProvider } from '@clerk/nextjs';
import ChatWidget from 'components/chatbot/chat-widget';
import Navbar from 'components/layout/navbar';
import ScrollReveal from 'components/scroll-reveal';
import { GeistSans } from 'geist/font/sans';
import { ReactNode, Suspense } from 'react';
import './globals.css';

const siteName = process.env.SITE_NAME || 'LEATHER MART 313';
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  robots: {
    follow: true,
    index: true
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <html lang="en" className={GeistSans.className}>
        <body className="bg-paper text-ink selection:bg-[#c6f36b] selection:text-[#17211f]" style={{ backgroundColor: 'var(--store-background)' }}>
          <Navbar />
          <Suspense>
            <main>{children}</main>
          </Suspense>
          <ScrollReveal />
          <ChatWidget />
        </body>
      </html>
    </ClerkProvider>
  );
}
