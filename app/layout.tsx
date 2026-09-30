import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EVO PIXEL — Sistema Operacional Comercial & Operacional',
  description: 'Plataforma proprietária de gestão comercial, prospecção por nicho, automação n8n e inteligência de vendas.',
  icons: {
    icon: '/logo-icon-dark.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`light ${inter.variable} ${plusJakarta.variable}`}>
      <body className="bg-evo-bg text-evo-text antialiased selection:bg-evo-accent/20 selection:text-evo-accent font-sans transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

