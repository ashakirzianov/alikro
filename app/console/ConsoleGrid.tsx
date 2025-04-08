'use client'
import { AssetImage } from "@/shared/AssetImage"
import { AssetKind, AssetMetadata, AssetQuery, AssetTag, and, assetMetadataUpdate, assetsForQuery, or } from "@/shared/assets"
import { useEffect, useMemo, useState } from "react"
import clsx from "clsx"
import AssetEditor from "./AssetEditor"
import FileUploader from "./FileUploader"
import { JsonEditor } from "./JsonEditor"

// Main ConsoleGrid component
type AsideState = 'hidden' | 'upload' | 'asset' | 'json'
export default function ConsoleGrid({
    assets,
    kinds,
    tags
}: {
    assets: AssetMetadata[],
    kinds: AssetKind[],
    tags: AssetTag[]
}) {
    const [asideState, setAsideState] = useState<AsideState>('hidden')
    const [selectedAsset, setSelectedAsset] = useState<AssetMetadata | null>(null)
    const [selectedKinds, setSelectedKinds] = useState<AssetKind[]>([])
    const [selectedTags, setSelectedTags] = useState<AssetTag[]>([])

    // Filter assets based on selected kinds and tags
    const filteredAssets = useMemo(() => {
        const queries: AssetQuery[] = []

        // Add kinds with OR logic
        if (selectedKinds.length > 0) {
            queries.push(or(...selectedKinds))
        }

        // Add tags with AND logic - each tag is included directly in the main AND
        if (selectedTags.length > 0) {
            queries.push(...selectedTags)
        }
        const query: AssetQuery = queries.length > 0 ? and(...queries) : null
        return assetsForQuery(assets, query)
    }, [assets, selectedKinds, selectedTags])

    // Reset selected asset when filtered assets change
    useEffect(() => {
        if (selectedAsset && !filteredAssets.some(asset => asset.id === selectedAsset.id)) {
            setSelectedAsset(null)
        }
    }, [filteredAssets, selectedAsset])

    // Toggle kind filter
    function toggleKind(kind: AssetKind) {
        setSelectedKinds(prev =>
            prev.includes(kind)
                ? []
                : [kind]
        )
    }

    // Toggle tag filter
    function toggleTag(tag: AssetTag) {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        )
    }

    function selectAsset(asset: AssetMetadata) {
        setSelectedAsset(asset)
        setAsideState('asset')
    }

    const json = useMemo(() => {
        const updates = filteredAssets.map(assetMetadataUpdate)
        return JSON.stringify(updates, null, 2)
    }, [filteredAssets])

    const aside = useMemo(() => {
        switch (asideState) {
            case 'hidden':
                return null
            case 'upload':
                return <FileUploader />
            case 'asset':
                // Calculate the order range for all assets
                const orderRange = getAssetsOrderRange(assets)
                return selectedAsset && <AssetEditor
                    asset={selectedAsset}
                    orderRange={orderRange}
                    kinds={kinds}
                    tags={tags}
                    onDelete={() => {
                        setSelectedAsset(null)
                        setAsideState('hidden')
                    }}
                    onUpdate={(updated) => {
                        setSelectedAsset(updated)
                    }}
                />
            case 'json':
                return <JsonEditor initialJson={json} />
            default:
                return null
        }
    }, [asideState, selectedAsset, json, assets, kinds, tags])


    return <ConsoleLayout
        header={<FilterHeader
            kinds={kinds}
            tags={tags}
            selectedKinds={selectedKinds}
            selectedTags={selectedTags}
            setAsideState={setAsideState}
            asideState={asideState}
            toggleKind={toggleKind}
            toggleTag={toggleTag}
            filteredCount={filteredAssets.length}
            totalCount={assets.length}
        />}
        assets={<AssetGrid
            assets={filteredAssets}
            selectedAsset={selectedAsset}
            onSelectAsset={selectAsset}
        />}
        aside={aside}
    />
}

// Extract min and max order values from assets
function getAssetsOrderRange(assets: AssetMetadata[]): [number, number] {
    if (assets.length === 0) {
        return [0, 0]
    }

    return assets.reduce(
        ([min, max], asset) => {
            const order = asset.order ?? 0
            return [
                Math.min(min, order),
                Math.max(max, order)
            ]
        },
        [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
    )
}

function ConsoleLayout({ header, assets, aside }: {
    header: React.ReactNode,
    assets: React.ReactNode,
    aside: React.ReactNode,
}) {

    return (
        <section className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="w-full">
                {header}
            </header>

            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Main content */}
                <div className={clsx("flex-1 overflow-auto p-4", { "w-2/3": aside, "w-full": !aside })}>
                    {assets}
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
    )
}

// Component for the filter header
function FilterHeader({
    kinds,
    tags,
    selectedKinds,
    selectedTags,
    asideState,
    filteredCount,
    totalCount,
    toggleKind,
    toggleTag,
    setAsideState,
}: {
    kinds: AssetKind[],
    tags: AssetTag[],
    selectedKinds: AssetKind[],
    selectedTags: AssetTag[],
    asideState: AsideState,
    filteredCount: number,
    totalCount: number
    toggleKind: (kind: AssetKind) => void,
    toggleTag: (tag: AssetTag) => void,
    setAsideState: (aside: AsideState) => void,
}) {
    return (
        <>
            <nav className="flex flex-row flex-wrap text-accent text-2xl sm:text-5xl whitespace-nowrap pb-2">
                <span className="mr-2">Console</span><HeaderSeparator />

                {/* Kind filters styled like navigation links */}
                {kinds.map((kind, index) => (
                    <FilterButton
                        key={kind}
                        onClick={() => toggleKind(kind)}
                        selected={selectedKinds.includes(kind)}
                        text={`${kind}${index < kinds.length - 1 ? ',' : ''}`}
                    />
                ))}
                {/* Tags section with label */}
                {tags.length > 0 && (
                    <>
                        <HeaderSeparator />
                        <span>Tags:</span>
                        {tags.map((tag, index) => (
                            <FilterButton
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                selected={selectedTags.includes(tag)}
                                text={`${tag}${index < tags.length - 1 ? ',' : ''}`}
                            />
                        ))}
                    </>)}
                <HeaderSeparator />
                <FilterButton
                    onClick={() => setAsideState('upload')}
                    selected={asideState === 'upload'}
                    text="Upload"
                />
                <HeaderSeparator />
                <FilterButton
                    onClick={() => setAsideState('json')}
                    selected={asideState === 'json'}
                    text="Json"
                />
            </nav>

            <div className="flex justify-between items-center mt-3">
                {/* Asset count */}
                <div className="text-sm text-gray-500">
                    Showing {filteredCount} of {totalCount} assets
                </div>
            </div>
        </>
    )
}

// New FilterButton component
function FilterButton({
    onClick,
    selected,
    text
}: {
    onClick: () => void,
    selected: boolean,
    text: string
}) {
    return (
        <button
            onClick={onClick}
            className={clsx("cursor-pointer", {
                "bg-accent text-secondary": selected,
                "text-accent hover:bg-accent hover:text-secondary": !selected
            })}
        >
            <span>{text}&nbsp;</span>
        </button>
    )
}

// Component for the asset grid
function AssetGrid({
    assets,
    selectedAsset,
    onSelectAsset
}: {
    assets: AssetMetadata[],
    selectedAsset: AssetMetadata | null,
    onSelectAsset: (asset: AssetMetadata) => void
}) {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {assets.map((asset) => (
                <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={asset.id === selectedAsset?.id}
                    onSelect={() => onSelectAsset(asset)}
                />
            ))}
        </section>
    )
}

// Component for displaying tags in an asset card
function AssetCardTags({ tags }: { tags?: string[] }) {
    if (!tags || tags.length === 0) return null

    return (
        <div className="mt-1 flex flex-wrap gap-1">
            {tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 px-1 rounded">
                    {tag}
                </span>
            ))}
        </div>
    )
}

// Component for a single asset card
function AssetCard({
    asset,
    isSelected,
    onSelect
}: {
    asset: AssetMetadata,
    isSelected: boolean,
    onSelect: () => void
}) {
    return (
        <div
            className={clsx("border p-2 cursor-pointer hover:bg-gray-100", {
                "border-accent bg-gray-100": isSelected,
                "border-gray-200": !isSelected
            })}
            onClick={onSelect}
        >
            <div className="h-32 flex items-center justify-center">
                <div className="h-full relative w-full">
                    <AssetImage
                        asset={asset}
                        size="small"
                        style={{
                            objectFit: 'contain',
                            width: '100%',
                            height: '100%',
                            position: 'absolute'
                        }}
                    />
                </div>
            </div>
            <div className="mt-2">
                <div className="text-sm text-gray-500">ID: {asset.id}</div>
                <div className="font-medium truncate">{asset.title || 'Untitled'}</div>
                <div className="text-xs text-gray-400">{asset.kind}</div>
                <AssetCardTags tags={asset.tags} />
            </div>
        </div>
    )
}

function HeaderSeparator() {
    return <span className="mr-2">{'//'}&nbsp;</span>
}