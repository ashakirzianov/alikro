import './globals.css'
import { Inter } from 'next/font/google'
import { NavigationPanel } from './NavigationPanel'

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
          <NavigationPanel />
          {children}
        </main>
      </body>
    </html>
  )
}
