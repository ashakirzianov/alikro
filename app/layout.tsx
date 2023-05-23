import './globals.css'
import { Inter } from 'next/font/google'
import { Navigation } from './navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Alikro',
  description: 'Personal page of Alikro',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main>
          <Navigation />
          {children}
        </main>
      </body>
    </html>
  )
}
