'use client'
import { NavigationLink } from "@/shared/Atoms"
import { allCollections } from "@/shared/collection"
import { hrefForCollection } from "@/shared/href"
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
                allCollections().map(collection => (
                    <NavigationLink
                        key={collection.id}
                        href={hrefForCollection({ collectionId: collection.id })}
                        title={collection.id}
                        selected={segment === collection.id}
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

