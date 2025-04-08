'use client'
import { allSections } from "@/shared/sections"
import Link from "next/link"
import { useSelectedLayoutSegment } from 'next/navigation'

export function NavigationPanel() {
    const segment = useSelectedLayoutSegment()
    return (
        <nav className="flex flex-row flex-wrap text-accent text-2xl sm:text-5xl whitespace-nowrap pb-2">
            <NavigationLink
                href="/"
                title="Alikro"
                last
            />{'//'}&nbsp;
            {
                allSections().map(section => (
                    <NavigationLink
                        key={section.path}
                        href={`/${section.path}`}
                        title={section.section}
                        selected={segment === section.path}
                    />
                ))
            }
            <NavigationLink title="about"
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
    const selectedClass = selected
        ? 'bg-accent text-secondary'
        : 'text-accent hover:bg-accent hover:text-secondary'
    return <span>
        <Link href={href} className={`cursor-pointer ${selectedClass}`}>
            {title}
        </Link>{last ? '' : ','}&nbsp;
    </span>
}