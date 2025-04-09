import '@/app/globals.css'
import clsx from 'clsx'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const title = 'Console'
const description = 'Admin console for the website'
export const metadata: Metadata = {
    title, description,
    openGraph: {
        title, description,
    },
}

export default async function RootLayout({
    children, header, main, aside,
}: {
    children: React.ReactNode,
    header: React.ReactNode,
    main: React.ReactNode,
    aside: React.ReactNode,
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="flex flex-col h-screen">
                    <section className="flex flex-col min-h-screen">
                        {/* Header */}
                        <header className="w-full">
                            {header}
                        </header>

                        {/* Content Area */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Main content */}
                            <div className={clsx("flex-1 overflow-auto p-4 w-full")}>
                                {children}
                                {main}
                            </div>

                            {/* Sticky Aside */}
                            {aside && (
                                <aside className="w-1/3 p-4 overflow-auto">
                                    <div className="sticky top-0">
                                        {aside}
                                    </div>
                                </aside>
                            )}
                        </div>
                    </section>
                </div>
            </body>
        </html>
    )
}