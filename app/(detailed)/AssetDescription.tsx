import { AssetMetadata } from "@/shared/assets"
import { hrefForAsset, hrefForMaterial, hrefForYear } from "@/shared/href"
import { parseMaterialString, specialCasesForMaterialElements } from "@/shared/materials"
import Link from "next/link"

export function AssetDescription({ asset }: {
    asset: AssetMetadata,
}) {
    return (
        <>
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
        </>
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