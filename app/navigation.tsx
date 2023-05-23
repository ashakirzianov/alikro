'use client'

import Link from "next/link"
import { AssetKind } from "@/app/assets"
import { useSelectedLayoutSegment } from 'next/navigation'

export function Navigation() {
    let segment = useSelectedLayoutSegment()
    let kind: AssetKind | undefined = segment === 'drawings' ? 'drawing'
        : segment === 'illustrations' ? 'illustration'
            : segment === 'paintings' ? 'painting'
                : segment === 'posters' ? 'poster'
                    : undefined
    return (
        <nav className="flex flex-row flex-wrap text-lime-500 text-4xl">
            <NavigationLink
                href="/"
                title="Alikro"
            />&nbsp;—&nbsp;
            <NavigationLink title="Drawings"
                href="/drawings"
                selected={kind === 'drawing'}
            />,&nbsp;
            <NavigationLink title="Illustrations"
                href="/illustrations"
                selected={kind === 'illustration'}
            />,&nbsp;
            <NavigationLink title="Paintings"
                href="/paintings"
                selected={kind === 'painting'}
            />,&nbsp;
            <NavigationLink title="Posters"
                href="/posters"
                selected={kind === 'poster'}
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