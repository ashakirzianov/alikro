import {
    AssetMetadata,
} from "@/shared/assets"
import Link from "next/link"
import { AssetImage } from "@/app/AssetImage"
import { hrefForAsset, hrefForAssetModal, hrefForMaterial, hrefForYear } from "@/shared/href"
import { OptionalModal } from "./WorkModal"
import { parseMaterialString, specialCasesForMaterialElements } from "@/shared/materials"

export function Gallery({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    function buildColumns(assets: AssetMetadata[], num: number) {
        const columns: AssetMetadata[][] = Array(num).fill(null).map(() => [])
        assets.forEach((asset, index) => {
            const columnIndex = index % num
            columns[columnIndex].push(asset)
        })
        return columns
    }
    const columns = buildColumns(assets, 4)
    return (
        <>
            <OptionalModal
                assets={assets}
                pathname={pathname}
            />
            <div className="flex flex-row gap-2">
                {columns.map((column, index) => (
                    <div key={index} className="flex flex-col w-1/4 gap-0">
                        {column.map((asset) => (
                            <Tile
                                key={asset.fileName}
                                asset={asset}
                                pathname={pathname}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </>
    )
}

function Tile({ asset, pathname }: {
    asset: AssetMetadata,
    pathname: string,
}) {
    const href = hrefForAssetModal({
        pathname,
        assetId: asset.id,
    })
    return (
        <div className="flex flex-col break-inside-avoid-column">
            <Link href={href} className="block">
                <AssetImage asset={asset} sizes="25vw" />
            </Link>
            <span className="hidden sm:flex text-xs text-accent">
                <Link href={hrefForAsset({ assetId: asset.id })} className="hover:underline">
                    {asset.title ?? 'Untitled'}
                </Link>
                {asset.year !== undefined && <>
                    <span>&nbsp;&#40;</span>
                    <Link href={hrefForYear({ year: asset.year })} className="hover:underline">{asset.year}</Link>
                    <span>&#41;</span>
                </>}
                {asset.material && <>
                    <span>,&nbsp;</span>
                    <MaterialLinks material={asset.material} />
                </>}
            </span>
        </div>
    )
}

function MaterialLinks({ material }: { material: string }) {
    const elements = specialCasesForMaterialElements(parseMaterialString(material))
    return (
        <>
            {elements.map((element, index) => {
                if (element.passive) {
                    return <span key={index}>{element.content.replaceAll(' ', '\u00A0')}</span>
                } else if (element.on) {
                    return <Link key={index} href={hrefForMaterial({ material: `on ${element.content}` })} className="hover:underline">{element.content}</Link>
                } else {
                    return <Link key={index} href={hrefForMaterial({ material: element.content })} className="hover:underline">{element.content}</Link>
                }
            })}
        </>
    )
}