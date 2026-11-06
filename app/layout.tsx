import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'One-Page Checkout App',
  description: 'A responsive one-page checkout application with integrated Cardlink payment gateway simulation.',
  openGraph: {
    title: 'One-Page Checkout App',
    description: 'A responsive one-page checkout application with integrated Cardlink payment gateway simulation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'One-Page Checkout App',
    description: 'A responsive one-page checkout application with integrated Cardlink payment gateway simulation.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
