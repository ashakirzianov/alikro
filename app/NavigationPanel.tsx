'use client'

import Link from "next/link"
import { useSelectedLayoutSegment } from 'next/navigation'

export function NavigationPanel() {
    let segment = useSelectedLayoutSegment()
    return (
        <nav className="flex flex-row flex-wrap text-lime-500 text-4xl">
            <NavigationLink
                href="/"
                title="Alikro"
            />&nbsp;—&nbsp;
            <NavigationLink title="Drawings"
                href="/drawings"
                selected={segment === 'drawings'}
            />,&nbsp;
            <NavigationLink title="Illustrations"
                href="/illustrations"
                selected={segment === 'illustrations'}
            />,&nbsp;
            <NavigationLink title="Paintings"
                href="/paintings"
                selected={segment === 'paintings'}
            />,&nbsp;
            <NavigationLink title="Posters"
                href="/posters"
                selected={segment === 'posters'}
            />,&nbsp;
            <NavigationLink title="Collages"
                href="/collages"
                selected={segment === 'collages'}
            />,&nbsp;
            <NavigationLink title="Tattoos"
                href="/tattoos"
                selected={segment === 'tattoos'}
            />,&nbsp;
            <NavigationLink title="About"
                href="/about"
                selected={segment === 'about'}
            />
        </nav>
    )
}

function NavigationLink({
    href, title, selected, onClick,
}: {
    href: string,
    title: string,
    selected?: boolean,
    onClick?: () => void,
}) {
    return <Link href={href} className={`cursor-pointer ${selected ? 'line-through' : ''} hover:italic`}>
        {title}
    </Link>
}