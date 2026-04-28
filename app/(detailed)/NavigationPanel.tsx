'use client'
import { allCollections } from "@/shared/collection"
import { hrefForAll, hrefForCollection, hrefForSlideshow } from "@/shared/href"
import clsx from "clsx"
import Link from "next/link"
import { useSearchParams, useSelectedLayoutSegments } from 'next/navigation'
import { Suspense, useMemo, useState } from "react"
import { Filters } from "./filters"

export function NavigationPanel({ filters }: {
    filters: Filters,
}) {
    return <Suspense fallback={<DummyNavigationPanel />}>
        <FullNavigationPanel filters={filters} />
    </Suspense>
}

function FullNavigationPanel({ filters }: {
    filters: Filters,
}) {
    const segments = useSelectedLayoutSegments()
    const searchParams = useSearchParams()
    const [expand, setExpand] = useState(false)

    const by = searchParams.get('by')
    const { rows, selection } = useMemo(() => {
        const [first, second] = segments
            .map(s => s.split('/')).flat().map(decodeURIComponent)

        const key = by ?? (first === 'all' ? 'collection' : first)
        const filterKey = toFilterKey(key)


        const logoRow: NavigationElement[] = [
            {
                href: hrefForSlideshow(),
                title: 'Alikro',
                selection: '',
            },
        ]

        const filterKeys = ['collection', 'tag', 'year', 'material'] as const
        const filterByRow: NavigationElement[] = expand ? filterKeys.map(filter => ({
            href: hrefForAll({ by: filter }),
            title: `by ${filter}`,
            selection: filter,
            onClick: () => setExpand(false),
        })) : [{
            href: '#',
            title: `by ${filterKey}`,
            selection: filterKey,
            onClick: () => setExpand(true),
        }]

        const options = filters[filterKey] ?? []
        const optionsRow: NavigationElement[] = options.map(option => ({
            href: option.href,
            title: option.title,
            selection: option.title,
        }))

        const selection = first === 'all'
            ? filterKey
            : (second === undefined ? first : second)

        const rows: NavigationElement[][] = [
            logoRow,
            filterByRow,
            optionsRow,
            [{
                href: '/about',
                title: 'about',
                selection: 'about',
            }],
        ].filter((row): row is NavigationElement[] => row !== undefined)
        return { rows, selection }
    }, [segments, by, filters, expand])
    return <NavigationPanelImpl
        rows={rows}
        selection={selection}
    />
}

function DummyNavigationPanel() {
    return <NavigationPanelImpl rows={[[{
        href: hrefForSlideshow(),
        title: 'Alikro',
        selection: '',
    }]]} selection='none' />
}

export function OldNavigationPanel() {
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
    onClick?: () => void,
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
                onClick={element.onClick}
            />
        })}
        {!last && <span>{'//'}&nbsp;</span>}
    </>
}

function NavigationLink({
    href, title, selected, last, shallow, onClick,
}: {
    href: string,
    title: string,
    selected?: boolean,
    last?: boolean,
    shallow?: boolean,
    onClick?: () => void,
}) {
    return <span>
        <Link href={href} shallow={shallow} className={clsx(
            'cursor-pointer', {
            'bg-accent text-secondary': selected,
            'text-accent hover:bg-accent hover:text-secondary': !selected,
        }
        )} onClick={onClick}>
            {title}
        </Link>{last ? '' : ','}&nbsp;
    </span>
}

function toFilterKey(by: string | null) {
    switch (by) {
        case 'tag':
        case 'year':
        case 'material':
            return by
        default:
            return 'collection' as const
    }
}