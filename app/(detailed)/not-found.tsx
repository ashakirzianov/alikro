import Link from "next/link"
import { getKindFilters } from "./filters"

export default function NotFound() {
    const kinds = getKindFilters()
    const links = [
        { title: 'all', href: '/all' },
        ...kinds.map(k => ({ title: k.title, href: k.href })),
    ]
    return (
        <div className="flex flex-col items-center text-accent text-2xl sm:text-5xl mt-4">
            <div className="flex flex-row flex-wrap whitespace-nowrap pb-2">
                <span><Link href="/" className="text-accent hover:bg-accent hover:text-secondary">Alikro</Link>&nbsp;//&nbsp;</span>
                <span className="bg-accent text-secondary">404</span>
            </div>
            <nav className="flex flex-col gap-0 items-end px-0 py-0 lg:px-4 lg:py-1 border-accent border-y-2 sm:border-2 lg:border-4 mt-4">
                {links.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="text-lg sm:text-3xl lg:text-6xl text-accent hover:text-secondary hover:bg-accent"
                    >
                        {link.title}
                    </Link>
                ))}
            </nav>
        </div>
    )
}
