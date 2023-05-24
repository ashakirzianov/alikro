'use client'
import Link from "next/link"
import { useSelectedLayoutSegment } from 'next/navigation'

export function NavigationPanel() {
    let segment = useSelectedLayoutSegment()
    return (
        <nav className="flex flex-row flex-wrap text-accent text-4xl whitespace-nowrap pb-2">
            <NavigationLink
                href="/"
                title="Alikro"
                last
            />{'//'}&nbsp;
            <NavigationLink title="Drawings"
                href="/drawings"
                selected={segment === 'drawings'}
            />
            <NavigationLink title="Illustrations"
                href="/illustrations"
                selected={segment === 'illustrations'}
            />
            <NavigationLink title="Paintings"
                href="/paintings"
                selected={segment === 'paintings'}
            />
            <NavigationLink title="Posters"
                href="/posters"
                selected={segment === 'posters'}
            />
            <NavigationLink title="Collages"
                href="/collages"
                selected={segment === 'collages'}
            />
            <NavigationLink title="Tattoos"
                href="/tattoos"
                selected={segment === 'tattoos'}
            />
            <NavigationLink title="About"
                href="/about"
                selected={segment === 'about'}
                last
            />
        </nav>
    )
}

function NavigationLink({
    href, title, selected, last
}: {
    href: string,
    title: string,
    selected?: boolean,
    last?: boolean,
}) {
    return <span>
        <Link href={href} className={`cursor-pointer ${selected ? 'underline' : 'hover:underline hover:decoration-dotted'} decoration-wavy`}>
            {title}
        </Link>{last ? '' : ','}&nbsp;
    </span>
}