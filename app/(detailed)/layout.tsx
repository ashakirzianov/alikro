import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { NavigationPanel } from '@/app/NavigationPanel'
import Script from 'next/script'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

const title = 'Alikro'
const description = `Alikro, an artist.`
export const metadata: Metadata = {
  title,
  description,

  openGraph: {
    title, description,
  },

  twitter: {
    title, description,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en">
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-SER2JV0V21"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-SER2JV0V21');
        `}
      </Script>
      <body className={inter.className}>
        <main>
          <NavigationPanel />
          {children}
        </main>
      </body>
    </html>
  )
}
