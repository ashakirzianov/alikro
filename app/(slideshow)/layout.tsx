import '@/app/globals.css'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

const title = 'Alikro'
const description = `Alikro, an artist.`
export const metadata: Metadata = {
    title, description,
    openGraph: {
        title, description,
    },
    twitter: {
        title, description,
    },
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
                    {children}
                </main>
            </body>
        </html>
    )
}
