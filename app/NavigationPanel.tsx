'use client'
import { NavigationLink } from "@/shared/Atoms"
import { allCollections } from "@/shared/collection"
import { hrefForCollection } from "@/shared/href"
import { useSelectedLayoutSegments } from 'next/navigation'

export function NavigationPanel() {
    const [first, second] = useSelectedLayoutSegments()
    const showExtra = second !== undefined && ['tag'].includes(first)
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
                        selected={first === collection.id}
                    />
                ))
            }
            <NavigationLink title="about"
                href="/about"
                selected={first === 'about'}
                last
            />
            {showExtra && <>
                <span>{'//'}&nbsp;</span>
                <NavigationLink
                    href={`/${first}/${second}`}
                    title={second}
                    selected={true}
                    last={true}
                />
            </>
            }
        </nav>
    )
}

