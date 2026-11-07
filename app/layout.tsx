import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'ABA PayWay One-Page Checkout App',
  description: 'A responsive luxury resort checkout application with integrated ABA Bank PayWay payment gateway and KHQR payments.',
  openGraph: {
    title: 'ABA PayWay One-Page Checkout App',
    description: 'A responsive luxury resort checkout application with integrated ABA Bank PayWay payment gateway and KHQR payments.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABA PayWay One-Page Checkout App',
    description: 'A responsive luxury resort checkout application with integrated ABA Bank PayWay payment gateway and KHQR payments.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
