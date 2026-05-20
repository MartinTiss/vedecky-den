import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vedecký deň kvíz',
  description: 'Asynchrónny kvíz s okamžitým vyhodnotením odpovedí a ochranou proti podvádzaniu.',
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
