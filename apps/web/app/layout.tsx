import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Mailroom Agents',
  description: 'Policy-controlled AI agents for every inbox.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
