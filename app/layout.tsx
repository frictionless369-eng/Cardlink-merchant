import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Cardlink VPOS One-Page Checkout & Merchant Gateway',
  description: 'A luxury resort booking & checkout platform with Cardlink VPOS, 3D-Secure shophandlermpi redirection, xmlpayvpos settlement, Visa Direct & Mastercard Send mTLS Keytool promotion, and real-time webhook audit logging.',
  openGraph: {
    title: 'Cardlink VPOS One-Page Checkout & Merchant Gateway',
    description: 'A luxury resort booking & checkout platform with Cardlink VPOS, 3D-Secure shophandlermpi redirection, xmlpayvpos settlement, Visa Direct & Mastercard Send mTLS Keytool promotion, and real-time webhook audit logging.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cardlink VPOS One-Page Checkout & Merchant Gateway',
    description: 'A luxury resort booking & checkout platform with Cardlink VPOS, 3D-Secure shophandlermpi redirection, xmlpayvpos settlement, Visa Direct & Mastercard Send mTLS Keytool promotion, and real-time webhook audit logging.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
