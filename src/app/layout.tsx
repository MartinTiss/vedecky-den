import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vedecký deň kvíz',
  description: 'Kvíz pre vedecký deň na ZŠ Rajčianska',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}
