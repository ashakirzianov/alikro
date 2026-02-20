'use client'
import { NavigationLink } from "@/app/(detailed)/Atoms"
import { allCollections } from "@/shared/collection"
import { hrefForCollection } from "@/shared/href"
import { useSelectedLayoutSegments } from 'next/navigation'

export function NavigationPanel() {
    const segments = useSelectedLayoutSegments()
    const [first, second] = segments
        .map(s => s.split('/')).flat().map(decodeURIComponent)
    const showExtra = second !== undefined
        && ['tag', 'year', 'material'].includes(first)

    const rows: NavigationElement[][] = [
        [
            {
                href: '/',
                title: 'Alikro',
                selection: '',
            },
        ],
        [...allCollections().map(collection => ({
            href: hrefForCollection({ collectionId: collection.id }),
            title: collection.id,
            selection: collection.id,
        })), {
            href: '/about',
            title: 'about',
            selection: 'about',
        }],
        showExtra ? [
            {
                href: `/${first}/${second}`,
                title: second,
                selection: first,
            },
        ] : undefined,
    ].filter((row): row is NavigationElement[] => row !== undefined)
    return <NavigationPanelImpl
        rows={rows}
        selection={first}
    />
}

type NavigationElement = {
    href: string,
    title: string,
    selection: string,
}
function NavigationPanelImpl({ rows, selection }: {
    rows: NavigationElement[][],
    selection: string,
}) {
    return (
        <nav className="flex flex-row flex-wrap text-accent text-2xl sm:text-5xl whitespace-nowrap pb-2">
            {rows.map((row, rowIdx) => {
                const lastRow = rowIdx === rows.length - 1
                return <NavigationRow
                    key={rowIdx}
                    elements={row}
                    selection={selection}
                    last={lastRow}
                />
            })}
        </nav>
    )
}

function NavigationRow({ elements, selection, last }: {
    elements: NavigationElement[],
    selection: string,
    last: boolean,
}) {
    return <>
        {elements.map((element, elementIdx) => {
            const lastElement = elementIdx === elements.length - 1
            return <NavigationLink
                key={elementIdx}
                href={element.href}
                title={element.title}
                selected={element.selection === selection}
                last={lastElement}
            />
        })}
        {!last && <span>{'//'}&nbsp;</span>}
    </>
}

